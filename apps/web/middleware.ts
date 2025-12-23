/**
 * Next.js Middleware
 * 
 * Handles locale detection from cookies/headers for i18n
 * Cookie-based approach without URL prefix
 */

import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, locales, type Locale } from './i18n/routing';

const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

export function middleware(request: NextRequest) {
  // Get locale from cookie or Accept-Language header
  const cookieLocale = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  const acceptLanguage = request.headers.get('accept-language');
  
  let locale: Locale = defaultLocale;
  
  // Check cookie first
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    locale = cookieLocale as Locale;
  } else if (acceptLanguage) {
    // Try to detect from Accept-Language header
    const preferredLocale = detectLocaleFromHeader(acceptLanguage);
    if (preferredLocale) {
      locale = preferredLocale;
    }
  }
  
  // Set locale in response header for client components
  const response = NextResponse.next();
  response.headers.set('x-locale', locale);
  
  return response;
}

function detectLocaleFromHeader(acceptLanguage: string): Locale | null {
  // Simple detection: check for 'ru' or 'en' in Accept-Language
  const lower = acceptLanguage.toLowerCase();
  if (lower.includes('ru')) return 'ru';
  if (lower.includes('en')) return 'en';
  return null;
}

export const config = {
  // Match all paths except API routes and static files
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};

