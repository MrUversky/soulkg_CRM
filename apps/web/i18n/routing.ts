/**
 * i18n Routing Configuration
 * 
 * Defines supported locales and routing behavior
 * Using cookie-based approach without URL prefix
 */

export const locales = ['ru', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ru';

// For cookie-based approach, we don't use next-intl routing
// Instead, we'll use NextIntlClientProvider with locale from cookie

