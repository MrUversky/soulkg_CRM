/**
 * WhatsApp utilities
 * 
 * Shared utilities for working with WhatsApp Web integration
 * Used by both data-import and whatsapp modules
 */

import { Client, LocalAuth, type ClientOptions } from 'whatsapp-web.js';
import { normalizePhoneNumber } from '../utils/phone';
import { DatabaseAuth } from './database-auth';

/**
 * Mode for WhatsApp client configuration
 * - 'import': One-time data import (uses import-${organizationId} clientId)
 * - 'integration': Long-running integration (uses org-${organizationId} clientId)
 */
export type WhatsAppClientMode = 'import' | 'integration';

/**
 * Configuration for WhatsApp client creation
 */
export interface WhatsAppClientConfig {
  /** Client ID for session management */
  clientId: string;
  /** Data path for session storage */
  dataPath: string;
  /** Puppeteer options */
  puppeteer?: ClientOptions['puppeteer'];
}

/**
 * Creates WhatsApp client configuration based on organization ID and mode
 * 
 * Different clientId and dataPath are used for import vs integration to avoid session conflicts:
 * - Import: `import-${organizationId}` → `.whatsapp-sessions/import-${organizationId}`
 * - Integration: `org-${organizationId}` → `.whatsapp-sessions/org-${organizationId}`
 * 
 * @param organizationId - Organization ID
 * @param mode - Client mode ('import' or 'integration')
 * @param customDataPath - Optional custom data path (overrides default)
 * @returns WhatsApp client configuration
 * 
 * @example
 * ```typescript
 * // For data import
 * const importConfig = createWhatsAppClientConfig('org-123', 'import');
 * // clientId: 'import-org-123'
 * // dataPath: '.whatsapp-sessions/import-org-123'
 * 
 * // For integration
 * const integrationConfig = createWhatsAppClientConfig('org-123', 'integration');
 * // clientId: 'org-org-123'
 * // dataPath: '.whatsapp-sessions/org-org-123'
 * ```
 */
export function createWhatsAppClientConfig(
  organizationId: string,
  mode: WhatsAppClientMode,
  customDataPath?: string
): WhatsAppClientConfig {
  const clientId = mode === 'import' 
    ? `import-${organizationId}`
    : `org-${organizationId}`;
  
  const dataPath = customDataPath || `.whatsapp-sessions/${clientId}`;
  
  // Detect Chrome executable path for macOS
  let executablePath: string | undefined;
  if (process.platform === 'darwin') {
    const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    try {
      const fs = require('fs');
      if (fs.existsSync(chromePath)) {
        executablePath = chromePath;
      }
    } catch {
      // Ignore errors, use default
    }
  }

  return {
    clientId,
    dataPath,
    puppeteer: {
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-component-extensions-with-background-pages',
        '--disable-default-apps',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-pings',
        '--password-store=basic',
        '--use-mock-keychain',
      ],
    },
  };
}

/**
 * Creates a WhatsApp Client instance with proper configuration
 * 
 * @param organizationId - Organization ID
 * @param mode - Client mode ('import' or 'integration')
 * @param customDataPath - Optional custom data path
 * @param useDatabaseAuth - Use database auth instead of local file system (default: false for dev, true for prod)
 * @returns Configured WhatsApp Client instance
 */
export function createWhatsAppClient(
  organizationId: string,
  mode: WhatsAppClientMode,
  customDataPath?: string,
  useDatabaseAuth: boolean = process.env.NODE_ENV === 'production'
): Client {
  const config = createWhatsAppClientConfig(organizationId, mode, customDataPath);
  
  // Use DatabaseAuth in production, LocalAuth in development
  const authStrategy = useDatabaseAuth
    ? new DatabaseAuth(organizationId, config.clientId, config.dataPath)
    : new LocalAuth({
        clientId: config.clientId,
        dataPath: config.dataPath,
      });
  
  return new Client({
    authStrategy,
    puppeteer: config.puppeteer,
    webVersionCache: {
      type: 'remote',
      remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1017054665.html',
    },
  });
}

/**
 * Formats phone number for WhatsApp API (E.164 → WhatsApp format)
 * 
 * Converts international format to WhatsApp format:
 * - Input: `+996555123456` (E.164 format)
 * - Output: `996555123456@c.us` (WhatsApp format)
 * 
 * @param phone - Phone number in E.164 format (+[country code][number])
 * @returns Phone number in WhatsApp format ([digits]@c.us)
 * 
 * @example
 * ```typescript
 * formatPhoneNumberForWhatsApp('+996555123456')
 * // Returns: '996555123456@c.us'
 * ```
 */
export function formatPhoneNumberForWhatsApp(phone: string): string {
  if (!phone) {
    throw new Error('Phone number is required');
  }
  
  // Normalize to E.164 format first
  const normalized = normalizePhoneNumber(phone);
  
  // Remove + and add @c.us suffix
  const digits = normalized.replace(/^\+/, '');
  
  if (!digits || digits.length < 8) {
    throw new Error(`Invalid phone number format: ${phone}`);
  }
  
  return `${digits}@c.us`;
}

/**
 * Extracts phone number from WhatsApp ID
 * 
 * Converts WhatsApp format to E.164 format:
 * - Input: `996555123456@c.us` (WhatsApp format)
 * - Output: `+996555123456` (E.164 format)
 * 
 * @param whatsappId - WhatsApp ID in format [digits]@c.us or [digits]@g.us
 * @returns Phone number in E.164 format (+[country code][number])
 * 
 * @example
 * ```typescript
 * extractPhoneFromWhatsAppId('996555123456@c.us')
 * // Returns: '+996555123456'
 * 
 * extractPhoneFromWhatsAppId('996555123456@g.us')
 * // Returns: '+996555123456' (group chats also supported)
 * ```
 */
export function extractPhoneFromWhatsAppId(whatsappId: string): string {
  if (!whatsappId) {
    throw new Error('WhatsApp ID is required');
  }
  
  // Extract digits before @ symbol
  const match = whatsappId.match(/^(\d+)@/);
  if (!match) {
    throw new Error(`Invalid WhatsApp ID format: ${whatsappId}`);
  }
  
  const digits = match[1];
  
  // Normalize to E.164 format
  return normalizePhoneNumber(digits);
}

/**
 * Checks if WhatsApp ID is a group chat
 * 
 * @param whatsappId - WhatsApp ID
 * @returns true if group chat (@g.us), false if individual chat (@c.us)
 */
export function isGroupChat(whatsappId: string): boolean {
  return whatsappId.includes('@g.us');
}

/**
 * Checks if WhatsApp ID is an individual chat
 * 
 * @param whatsappId - WhatsApp ID
 * @returns true if individual chat (@c.us), false if group chat
 */
export function isIndividualChat(whatsappId: string): boolean {
  return whatsappId.includes('@c.us');
}

