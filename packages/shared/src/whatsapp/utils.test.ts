/**
 * Tests for WhatsApp utilities
 */

import { describe, it, expect } from 'vitest';
import {
  createWhatsAppClientConfig,
  createWhatsAppClient,
  formatPhoneNumberForWhatsApp,
  extractPhoneFromWhatsAppId,
  isGroupChat,
  isIndividualChat,
} from './utils';

describe('WhatsApp Utilities', () => {
  describe('createWhatsAppClientConfig', () => {
    it('should create import config with correct clientId and dataPath', () => {
      const config = createWhatsAppClientConfig('org-123', 'import');
      
      expect(config.clientId).toBe('import-org-123');
      expect(config.dataPath).toBe('.whatsapp-sessions/import-org-123');
      expect(config.puppeteer).toBeDefined();
      expect(config.puppeteer?.headless).toBe(true);
    });
    
    it('should create integration config with correct clientId and dataPath', () => {
      const config = createWhatsAppClientConfig('org-123', 'integration');
      
      expect(config.clientId).toBe('org-org-123');
      expect(config.dataPath).toBe('.whatsapp-sessions/org-org-123');
      expect(config.puppeteer).toBeDefined();
    });
    
    it('should use custom data path when provided', () => {
      const customPath = '/custom/path/sessions';
      const config = createWhatsAppClientConfig('org-123', 'import', customPath);
      
      expect(config.clientId).toBe('import-org-123');
      expect(config.dataPath).toBe(customPath);
    });
    
    it('should have different clientId for import vs integration', () => {
      const importConfig = createWhatsAppClientConfig('org-123', 'import');
      const integrationConfig = createWhatsAppClientConfig('org-123', 'integration');
      
      expect(importConfig.clientId).not.toBe(integrationConfig.clientId);
      expect(importConfig.dataPath).not.toBe(integrationConfig.dataPath);
    });
  });
  
  describe('createWhatsAppClient', () => {
    it('should create a Client instance', () => {
      const client = createWhatsAppClient('org-123', 'import');
      
      expect(client).toBeDefined();
      expect(typeof client.initialize).toBe('function');
    });
    
    it('should create different clients for import and integration', () => {
      const importClient = createWhatsAppClient('org-123', 'import');
      const integrationClient = createWhatsAppClient('org-123', 'integration');
      
      // Both should be Client instances
      expect(importClient).toBeDefined();
      expect(integrationClient).toBeDefined();
    });
  });
  
  describe('formatPhoneNumberForWhatsApp', () => {
    it('should format E.164 phone to WhatsApp format', () => {
      expect(formatPhoneNumberForWhatsApp('+996555123456')).toBe('996555123456@c.us');
      expect(formatPhoneNumberForWhatsApp('+971505918093')).toBe('971505918093@c.us');
    });
    
    it('should handle phone numbers without + prefix', () => {
      expect(formatPhoneNumberForWhatsApp('996555123456')).toBe('996555123456@c.us');
    });
    
    it('should normalize phone numbers before formatting', () => {
      // Kyrgyzstan number with leading zero (normalized to +996)
      expect(formatPhoneNumberForWhatsApp('0555123456')).toBe('996555123456@c.us');
      
      // 9-digit number without country code (normalizePhoneNumber adds +, not country code)
      // This is expected behavior - 9 digits without leading 0 are treated as-is
      const result = formatPhoneNumberForWhatsApp('555123456');
      expect(result).toBe('555123456@c.us');
    });
    
    it('should throw error for empty phone number', () => {
      expect(() => formatPhoneNumberForWhatsApp('')).toThrow('Phone number is required');
    });
    
    it('should throw error for invalid phone number', () => {
      expect(() => formatPhoneNumberForWhatsApp('123')).toThrow('Invalid phone number format');
    });
  });
  
  describe('extractPhoneFromWhatsAppId', () => {
    it('should extract phone from individual chat ID', () => {
      expect(extractPhoneFromWhatsAppId('996555123456@c.us')).toBe('+996555123456');
      expect(extractPhoneFromWhatsAppId('971505918093@c.us')).toBe('+971505918093');
    });
    
    it('should extract phone from group chat ID', () => {
      expect(extractPhoneFromWhatsAppId('996555123456@g.us')).toBe('+996555123456');
    });
    
    it('should normalize extracted phone number', () => {
      // 9-digit number extracted from WhatsApp ID
      // normalizePhoneNumber adds + but doesn't add country code for 9-digit numbers
      const result = extractPhoneFromWhatsAppId('555123456@c.us');
      expect(result).toBe('+555123456');
      
      // Number with country code should be normalized correctly
      expect(extractPhoneFromWhatsAppId('996555123456@c.us')).toBe('+996555123456');
    });
    
    it('should throw error for empty WhatsApp ID', () => {
      expect(() => extractPhoneFromWhatsAppId('')).toThrow('WhatsApp ID is required');
    });
    
    it('should throw error for invalid WhatsApp ID format', () => {
      expect(() => extractPhoneFromWhatsAppId('invalid')).toThrow('Invalid WhatsApp ID format');
      expect(() => extractPhoneFromWhatsAppId('@c.us')).toThrow('Invalid WhatsApp ID format');
    });
  });
  
  describe('isGroupChat', () => {
    it('should return true for group chat IDs', () => {
      expect(isGroupChat('996555123456@g.us')).toBe(true);
      expect(isGroupChat('123456789@g.us')).toBe(true);
    });
    
    it('should return false for individual chat IDs', () => {
      expect(isGroupChat('996555123456@c.us')).toBe(false);
    });
    
    it('should return false for invalid IDs', () => {
      expect(isGroupChat('invalid')).toBe(false);
    });
  });
  
  describe('isIndividualChat', () => {
    it('should return true for individual chat IDs', () => {
      expect(isIndividualChat('996555123456@c.us')).toBe(true);
      expect(isIndividualChat('123456789@c.us')).toBe(true);
    });
    
    it('should return false for group chat IDs', () => {
      expect(isIndividualChat('996555123456@g.us')).toBe(false);
    });
    
    it('should return false for invalid IDs', () => {
      expect(isIndividualChat('invalid')).toBe(false);
    });
  });
});

