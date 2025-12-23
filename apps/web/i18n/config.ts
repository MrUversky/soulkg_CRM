/**
 * i18n Configuration
 * 
 * Configuration for next-intl internationalization
 * This file is used for server components
 * For cookie-based approach, locale is determined in middleware/cookies
 */

import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, locales, type Locale } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // For cookie-based approach, get locale from cookies
  let locale: Locale = defaultLocale;
  
  try {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
    
    if (cookieLocale && locales.includes(cookieLocale as Locale)) {
      locale = cookieLocale as Locale;
    }
  } catch (error) {
    // Fallback to default locale if cookies can't be read
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});

