/**
 * i18n Request Utilities
 * 
 * Utilities for server components to get translations
 * For cookie-based approach, this file is optional but kept for future use
 */

import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales, type Locale } from './routing';

export default getRequestConfig(async () => {
  // For cookie-based approach without URL prefix,
  // locale is determined in middleware and passed via headers
  // We use defaultLocale here as fallback
  const locale: Locale = defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});

