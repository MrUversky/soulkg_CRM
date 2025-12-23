/**
 * WhatsApp integration settings types
 * 
 * These settings control rate limiting, safety features, and mass sending behavior
 * for WhatsApp Web integration. Settings are stored in Organization.settings.whatsapp (JSON field).
 */

/**
 * Rate limiting configuration for WhatsApp message sending
 */
export interface WhatsAppRateLimiting {
  /** Maximum messages per minute (default: 10, conservative) */
  messagesPerMinute: number;
  
  /** Maximum messages per hour (default: 100) */
  messagesPerHour: number;
  
  /** Maximum messages per day (default: 500) */
  messagesPerDay: number;
  
  /** Maximum concurrent message processing (default: 3, conservative) */
  concurrency: number;
}

/**
 * Safety configuration for WhatsApp integration
 */
export interface WhatsAppSafety {
  /** Enable mass sending feature (default: false, requires confirmation) */
  enableMassSending: boolean;
  
  /** Require confirmation for bulk sends (default: true for >10 messages) */
  requireConfirmation: boolean;
  
  /** Maximum batch size for mass sending (default: 50) */
  maxBatchSize: number;
}

/**
 * Complete WhatsApp settings configuration
 */
export interface WhatsAppSettings {
  rateLimiting: WhatsAppRateLimiting;
  safety: WhatsAppSafety;
}

/**
 * Default conservative WhatsApp settings
 * 
 * These values are designed to minimize the risk of WhatsApp account blocking:
 * - 10 messages/minute (instead of 20) - more conservative
 * - 3 concurrent messages (instead of 5) - more conservative
 * - Mass sending disabled by default
 * - Confirmation required for bulk sends
 */
export function getDefaultWhatsAppSettings(): WhatsAppSettings {
  return {
    rateLimiting: {
      messagesPerMinute: 10,
      messagesPerHour: 100,
      messagesPerDay: 500,
      concurrency: 3,
    },
    safety: {
      enableMassSending: false,
      requireConfirmation: true,
      maxBatchSize: 50,
    },
  };
}

/**
 * Validates and normalizes WhatsApp settings
 * 
 * Fills missing values with defaults and validates ranges:
 * - messagesPerMinute: 1-20 (max recommended by WhatsApp)
 * - messagesPerHour: 1-200
 * - messagesPerDay: 1-1000
 * - concurrency: 1-5
 * - maxBatchSize: 1-100
 * 
 * @param settings - Partial settings to validate
 * @returns Complete validated settings
 */
export function validateWhatsAppSettings(
  settings: Partial<WhatsAppSettings>
): WhatsAppSettings {
  const defaults = getDefaultWhatsAppSettings();
  
  // Validate and normalize rate limiting
  const rateLimiting: WhatsAppRateLimiting = {
    messagesPerMinute: Math.max(
      1,
      Math.min(20, settings.rateLimiting?.messagesPerMinute ?? defaults.rateLimiting.messagesPerMinute)
    ),
    messagesPerHour: Math.max(
      1,
      Math.min(200, settings.rateLimiting?.messagesPerHour ?? defaults.rateLimiting.messagesPerHour)
    ),
    messagesPerDay: Math.max(
      1,
      Math.min(1000, settings.rateLimiting?.messagesPerDay ?? defaults.rateLimiting.messagesPerDay)
    ),
    concurrency: Math.max(
      1,
      Math.min(5, settings.rateLimiting?.concurrency ?? defaults.rateLimiting.concurrency)
    ),
  };
  
  // Validate and normalize safety settings
  const safety: WhatsAppSafety = {
    enableMassSending: settings.safety?.enableMassSending ?? defaults.safety.enableMassSending,
    requireConfirmation: settings.safety?.requireConfirmation ?? defaults.safety.requireConfirmation,
    maxBatchSize: Math.max(
      1,
      Math.min(100, settings.safety?.maxBatchSize ?? defaults.safety.maxBatchSize)
    ),
  };
  
  return {
    rateLimiting,
    safety,
  };
}

