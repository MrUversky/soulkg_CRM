/**
 * Language Detection Parser
 * 
 * Detects the language of messages using simple heuristics
 * For MVP: basic detection, can be enhanced with ML models later
 */

import type { ExtractedMessage } from '../types/import.types';

export type SupportedLanguage = 'en' | 'ru' | 'ar' | 'fr' | 'de' | 'es' | 'pl';

/**
 * Detect language from a single message
 */
export function detectLanguage(message: string): SupportedLanguage {
  // Simple heuristic-based detection
  // For MVP, can be enhanced with proper language detection library later

  const text = message.toLowerCase();

  // Arabic detection (Arabic script)
  if (/[\u0600-\u06FF]/.test(message)) {
    return 'ar';
  }

  // Russian detection (Cyrillic script)
  if (/[а-яё]/i.test(message)) {
    return 'ru';
  }

  // Polish detection (common words) - check before German to avoid conflicts
  const polishWords = ['cześć', 'dziękuję', 'tak', 'nie', 'dzień dobry', 'do widzenia'];
  if (polishWords.some((word) => text.includes(word))) {
    return 'pl';
  }

  // French detection (common words)
  const frenchWords = ['bonjour', 'merci', 'oui', 'non', 'salut', 'au revoir'];
  if (frenchWords.some((word) => text.includes(word))) {
    return 'fr';
  }

  // German detection (common words)
  const germanWords = ['hallo', 'danke', 'ja', 'nein', 'guten tag', 'auf wiedersehen'];
  if (germanWords.some((word) => text.includes(word))) {
    return 'de';
  }

  // Spanish detection (common words)
  const spanishWords = ['hola', 'gracias', 'sí', 'no', 'adiós', 'por favor'];
  if (spanishWords.some((word) => text.includes(word))) {
    return 'es';
  }

  // Default to English
  return 'en';
}

/**
 * Detect primary language from multiple messages
 */
export function detectPrimaryLanguage(messages: ExtractedMessage[]): SupportedLanguage {
  if (messages.length === 0) {
    return 'en';
  }

  // Count languages
  const languageCounts: Record<SupportedLanguage, number> = {
    en: 0,
    ru: 0,
    ar: 0,
    fr: 0,
    de: 0,
    es: 0,
    pl: 0,
  };

  for (const message of messages) {
    const lang = detectLanguage(message.content);
    languageCounts[lang]++;
  }

  // Return most common language
  let maxCount = 0;
  let primaryLanguage: SupportedLanguage = 'en';

  for (const [lang, count] of Object.entries(languageCounts) as [SupportedLanguage, number][]) {
    if (count > maxCount) {
      maxCount = count;
      primaryLanguage = lang;
    }
  }

  return primaryLanguage;
}

