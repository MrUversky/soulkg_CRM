/**
 * Phone number utilities
 * 
 * Supports international phone number formats (E.164 standard)
 * https://en.wikipedia.org/wiki/E.164
 */

/**
 * Normalizes phone number to E.164 format (+[country code][number])
 * 
 * Examples:
 * - +996555123456 -> +996555123456
 * - +971505918093 -> +971505918093
 * - 996555123456 -> +996555123456
 * - 0555123456 (Kyrgyzstan) -> +996555123456
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) {
    return '';
  }

  // Remove all non-digit characters except +
  const cleaned = phone.trim().replace(/[^\d+]/g, '');

  // If already starts with +, return as is (assuming it's already normalized)
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Remove leading zeros for Kyrgyzstan numbers (0XXXXXXXXX -> XXXXXXXXX)
  let digits = cleaned;
  if (digits.startsWith('0') && digits.length === 10) {
    // Assume Kyrgyzstan number: 0XXXXXXXXX -> +996XXXXXXXXX
    return `+996${digits.slice(1)}`;
  }

  // If starts with country code (996, 971, etc.), add +
  if (digits.length >= 9) {
    return `+${digits}`;
  }

  // If 9 digits, assume Kyrgyzstan number
  if (digits.length === 9) {
    return `+996${digits}`;
  }

  // Default: add + prefix
  return `+${digits}`;
}

/**
 * Validates phone number format (E.164 standard)
 * 
 * Valid formats:
 * - +996555123456 (Kyrgyzstan)
 * - +971505918093 (UAE)
 * - +923423651402 (Pakistan)
 * - +1234567890 (US)
 * 
 * Format: +[1-3 digit country code][7-15 digit subscriber number]
 * Total length: 8-15 digits after +
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }

  const normalized = normalizePhoneNumber(phone);
  
  // E.164 format: +[country code][subscriber number]
  // Country code: 1-3 digits
  // Subscriber number: 7-15 digits
  // Total: 8-15 digits after +
  // Pattern: ^\+[1-9]\d{7,14}$
  const e164Pattern = /^\+[1-9]\d{7,14}$/;
  
  return e164Pattern.test(normalized);
}

