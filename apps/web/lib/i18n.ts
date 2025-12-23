/**
 * i18n Utilities
 * 
 * Client-side utilities for locale management
 */

import { defaultLocale, locales, type Locale } from '@/i18n/routing';

const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

/**
 * Get current locale from cookie or default
 */
export function getLocaleFromCookie(): Locale {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }
  
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${LOCALE_COOKIE_NAME}=`));
  
  if (cookie) {
    const locale = cookie.split('=')[1];
    if (locales.includes(locale as Locale)) {
      return locale as Locale;
    }
  }
  
  // Try to detect from browser
  const browserLang = navigator.language.split('-')[0];
  if (locales.includes(browserLang as Locale)) {
    return browserLang as Locale;
  }
  
  return defaultLocale;
}

/**
 * Set locale in cookie
 */
export function setLocaleCookie(locale: Locale): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale}; path=/; max-age=31536000`; // 1 year
}

