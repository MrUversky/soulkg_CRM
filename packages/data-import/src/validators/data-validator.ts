/**
 * Data Validator
 * 
 * Validates extracted and parsed data before import
 */

import { isValidPhoneNumber, normalizePhoneNumber } from '@soul-kg-crm/shared';
import type { ParsedClientData } from '../types/import.types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate parsed client data
 */
export function validateClientData(data: ParsedClientData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate phone number
  if (!data.phone) {
    errors.push('Phone number is required');
  } else if (!isValidPhoneNumber(data.phone)) {
    errors.push(`Invalid phone number format: ${data.phone}. Expected format: +996XXXXXXXXX`);
  } else {
    // Normalize phone number
    data.phone = normalizePhoneNumber(data.phone);
  }

  // Validate name (warning if missing, but don't use phone as fallback)
  if (!data.name || data.name.trim().length === 0) {
    warnings.push('Client name is missing. Will be stored as null.');
    data.name = undefined; // Don't use phone as name
  } else if (data.name === data.phone || data.name.match(/^\+?\d+$/)) {
    // If name is actually a phone number, don't use it
    warnings.push('Client name appears to be a phone number. Will be stored as null.');
    data.name = undefined;
  }

  // Validate messages
  if (!data.messages || data.messages.length === 0) {
    warnings.push('No messages found for this client');
  }

  // Validate dates
  if (!data.firstMessageDate || !data.lastMessageDate) {
    errors.push('Message dates are required');
  } else if (data.firstMessageDate > data.lastMessageDate) {
    errors.push('First message date cannot be after last message date');
  }

  // Validate language
  const supportedLanguages = ['en', 'ru', 'ar', 'fr', 'de', 'es', 'pl'];
  if (data.preferredLanguage && !supportedLanguages.includes(data.preferredLanguage)) {
    warnings.push(`Unsupported language: ${data.preferredLanguage}. Defaulting to English.`);
    data.preferredLanguage = 'en';
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

