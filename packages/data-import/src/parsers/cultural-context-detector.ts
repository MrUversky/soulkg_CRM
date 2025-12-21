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
 * 
 * IMPORTANT: Language is the PRIMARY indicator, phone country code is SECONDARY
 * This is because in countries like UAE, people from many different countries live there
 */
export function detectCulturalContext(
  language: SupportedLanguage,
  phone?: string
): CulturalContext {
  const context: CulturalContext = {
    language,
  };

  // PRIMARY: Determine cultural context based on LANGUAGE (most reliable)
  // Language reflects actual cultural background, not just location
  
  if (language === 'ar') {
    // Arabic speakers - likely Middle Eastern or North African origin
    context.region = 'Middle East / North Africa';
    context.communicationStyle = 'formal';
    context.culturalNotes = [
      'May prefer formal greetings and titles',
      'Respect for cultural and religious practices',
      'Consider time zone differences',
    ];
    context.dietaryRestrictions = ['Halal food preferences'];
    // Timezone depends on phone country code if available
  } else if (language === 'ru') {
    // Russian speakers - likely from CIS/Central Asia
    context.region = 'Central Asia / CIS';
    context.communicationStyle = 'mixed';
    context.culturalNotes = [
      'May prefer Russian language communication',
      'Consider time zone differences',
    ];
  } else if (['fr', 'de', 'es', 'pl'].includes(language)) {
    // European languages
    context.region = 'Europe';
    context.communicationStyle = 'mixed';
    context.culturalNotes = [
      'May prefer direct communication',
      'Consider European time zones',
    ];
  } else if (language === 'en') {
    // English speakers - could be from anywhere
    // Use phone country code as secondary indicator
    context.communicationStyle = 'informal';
    context.culturalNotes = [
      'English-speaking client',
      'Consider time zone differences',
    ];
  } else {
    // Default
    context.communicationStyle = 'informal';
  }

  // SECONDARY: Use phone country code for timezone and additional context
  // But don't override language-based cultural context
  if (phone) {
    const countryCode = extractCountryCode(phone);
    const country = getCountryFromPhone(phone);

    if (countryCode) {
      context.countryCode = countryCode;
    }
    if (country) {
      // Store country but don't override region if already set by language
      if (!context.region) {
        context.country = country;
        // Only set region if not already set by language
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
      } else {
        // Region already set by language, but store country for reference
        context.country = country;
      }

      // Timezone always based on phone country code (where they are now)
      if (country === 'AE') {
        context.timezone = 'Asia/Dubai'; // GMT+4
      } else if (country === 'KG') {
        context.timezone = 'Asia/Bishkek'; // GMT+6
      } else if (country === 'PK') {
        context.timezone = 'Asia/Karachi'; // GMT+5
      } else if (country === 'RU') {
        context.timezone = 'Europe/Moscow'; // GMT+3
      } else if (country === 'GB') {
        context.timezone = 'Europe/London'; // GMT+0/+1
      } else if (country === 'FR' || country === 'DE' || country === 'ES' || country === 'PL') {
        context.timezone = 'Europe/Paris'; // GMT+1/+2 (approximate for Europe)
      }
    }
  }

  // Special case: If English speaker with UAE phone, add note about expat community
  if (language === 'en' && phone && phone.startsWith('+971')) {
    context.culturalNotes = [
      'English-speaking expat in UAE',
      'Diverse cultural background - adapt communication style based on conversation',
      'Consider UAE time zone (GMT+4)',
    ];
    context.timezone = 'Asia/Dubai';
  }

  return context;
}

