/**
 * Name Extractor
 * 
 * Extracts client name from various sources:
 * 1. WhatsApp contact name (if available)
 * 2. Messages (if client introduced themselves)
 * 3. Contact pushname (WhatsApp display name)
 */

import type { ExtractedMessage } from '../types/import.types';

/**
 * Patterns for name extraction from messages
 */
const NAME_PATTERNS = [
  // English patterns
  /(?:hi|hello|hey)[\s,]+(?:i'?m|i am|my name is|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  /(?:i'?m|i am|my name is|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  /(?:name'?s|name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  
  // Russian patterns
  /(?:привет|здравствуйте|добрый день)[\s,]+(?:меня зовут|я|это)\s+([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+)?)/i,
  /(?:меня зовут|я|это)\s+([А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+)?)/i,
  
  // Arabic patterns (basic)
  /(?:اسمي|أنا)\s+([\u0600-\u06FF]+)/,
  
  // Common: "Hi, I'm John" or "Hello, this is Sarah"
  /(?:hi|hello|hey)[\s,]+(?:i'?m|this is)\s+([A-Z][a-z]+)/i,
];

/**
 * Extract name from messages
 */
export function extractNameFromMessages(messages: ExtractedMessage[]): string | null {
  // Check first few messages from client (where they might introduce themselves)
  const clientMessages = messages
    .filter(msg => !msg.fromMe)
    .slice(0, 5); // Check first 5 client messages

  for (const message of clientMessages) {
    const content = message.content.trim();
    
    // Try each pattern
    for (const pattern of NAME_PATTERNS) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        // Validate: name should be reasonable length and not contain digits
        if (name.length >= 2 && name.length <= 50 && !/\d/.test(name)) {
          return name;
        }
      }
    }
  }

  return null;
}

/**
 * Clean and validate name
 * Removes phone numbers, validates format
 */
export function cleanName(name: string | undefined, phone: string): string | undefined {
  if (!name || name.trim().length === 0) {
    return undefined;
  }

  const trimmed = name.trim();
  
  // Normalize both name and phone for comparison
  const normalizeForComparison = (str: string) => 
    str.replace(/[\s\-\(\)\.]/g, '').toLowerCase();
  
  const normalizedName = normalizeForComparison(trimmed);
  const normalizedPhone = normalizeForComparison(phone);
  
  // Check if name is actually a phone number
  const isPhoneNumber = 
    normalizedName === normalizedPhone ||
    normalizedName.match(/^\+?\d{8,}$/) ||
    (normalizedName.startsWith('+') && normalizedName.replace(/\+/g, '').match(/^\d{8,}$/));
  
  if (isPhoneNumber) {
    return undefined; // Don't use phone as name
  }

  // Check if name is too short or contains only digits
  if (trimmed.length < 2 || /^\d+$/.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}

/**
 * Extract best available name from multiple sources
 */
export function extractBestName(
  contactName: string | undefined,
  messages: ExtractedMessage[],
  phone: string
): string | undefined {
  // Priority 1: Name from messages (most reliable - client introduced themselves)
  const nameFromMessages = extractNameFromMessages(messages);
  if (nameFromMessages) {
    return cleanName(nameFromMessages, phone);
  }

  // Priority 2: Contact name from WhatsApp (if not a phone number)
  if (contactName) {
    const cleanedContactName = cleanName(contactName, phone);
    if (cleanedContactName) {
      return cleanedContactName;
    }
  }

  // No valid name found
  return undefined;
}


