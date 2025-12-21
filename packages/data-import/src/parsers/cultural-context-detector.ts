/**
 * Cultural Context Detector
 * 
 * Determines cultural context based on language, phone country code, and other factors
 */

import type { SupportedLanguage } from './language-detector';

/**
 * Country code to country mapping
 * Common country codes for our target markets
 */
const COUNTRY_CODES: Record<string, string> = {
  '971': 'AE', // UAE
  '996': 'KG', // Kyrgyzstan
  '92': 'PK',  // Pakistan
  '1': 'US',   // US/Canada
  '44': 'GB',  // UK
  '33': 'FR',  // France
  '49': 'DE',  // Germany
  '34': 'ES',  // Spain
  '48': 'PL',  // Poland
  '7': 'RU',   // Russia/Kazakhstan
  '966': 'SA', // Saudi Arabia
  '974': 'QA', // Qatar
  '973': 'BH', // Bahrain
  '968': 'OM', // Oman
  '965': 'KW', // Kuwait
};


/**
 * Cultural context structure
 */
export interface CulturalContext {
  country?: string;
  countryCode?: string;
  region?: string;
  language: SupportedLanguage;
  timezone?: string;
  communicationStyle?: 'formal' | 'informal' | 'mixed';
  dietaryRestrictions?: string[];
  culturalNotes?: string[];
}

/**
 * Extract country code from phone number
 */
export function extractCountryCode(phone: string): string | null {
  if (!phone || !phone.startsWith('+')) {
    return null;
  }

  // Remove + and extract first 1-3 digits (country code)
  const digits = phone.slice(1);
  
  // Try 3-digit codes first (most specific)
  for (const code of Object.keys(COUNTRY_CODES).sort((a, b) => b.length - a.length)) {
    if (digits.startsWith(code)) {
      return code;
    }
  }

  return null;
}

/**
 * Get country from phone number
 */
export function getCountryFromPhone(phone: string): string | null {
  const countryCode = extractCountryCode(phone);
  if (!countryCode) {
    return null;
  }
  return COUNTRY_CODES[countryCode] || null;
}

/**
 * Determine cultural context from language and phone number
 */
export function detectCulturalContext(
  language: SupportedLanguage,
  phone?: string
): CulturalContext {
  const context: CulturalContext = {
    language,
  };

  // Determine country from phone number
  if (phone) {
    const countryCode = extractCountryCode(phone);
    const country = getCountryFromPhone(phone);

    if (countryCode) {
      context.countryCode = countryCode;
    }
    if (country) {
      context.country = country;
      
      // Determine region
      if (['AE', 'SA', 'QA', 'BH', 'OM', 'KW'].includes(country)) {
        context.region = 'Middle East';
      } else if (['RU', 'KG', 'KZ'].includes(country)) {
        context.region = 'Central Asia / CIS';
      } else if (['US', 'CA'].includes(country)) {
        context.region = 'North America';
      } else if (['GB', 'FR', 'DE', 'ES', 'PL'].includes(country)) {
        context.region = 'Europe';
      } else if (['PK', 'IN'].includes(country)) {
        context.region = 'South Asia';
      }
    }
  }

  // Determine communication style based on language and region
  if (context.region === 'Middle East' || language === 'ar') {
    context.communicationStyle = 'formal';
    context.culturalNotes = [
      'May prefer formal greetings and titles',
      'Consider time zone differences (GMT+4 for UAE)',
      'Respect for cultural and religious practices',
    ];
    context.dietaryRestrictions = ['Halal food preferences'];
  } else if (context.region === 'Europe' || ['fr', 'de', 'es', 'pl'].includes(language)) {
    context.communicationStyle = 'mixed';
    context.culturalNotes = [
      'May prefer direct communication',
      'Consider European time zones',
    ];
  } else if (language === 'ru' || context.region === 'Central Asia / CIS') {
    context.communicationStyle = 'mixed';
    context.culturalNotes = [
      'May prefer Russian language communication',
      'Consider time zone differences',
    ];
  } else {
    context.communicationStyle = 'informal';
  }

  // Determine timezone based on country
  if (context.country === 'AE') {
    context.timezone = 'Asia/Dubai'; // GMT+4
  } else if (context.country === 'KG') {
    context.timezone = 'Asia/Bishkek'; // GMT+6
  } else if (context.country === 'PK') {
    context.timezone = 'Asia/Karachi'; // GMT+5
  } else if (context.country === 'RU') {
    context.timezone = 'Europe/Moscow'; // GMT+3
  }

  return context;
}

