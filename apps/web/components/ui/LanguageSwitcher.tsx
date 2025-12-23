/**
 * Language Switcher Component
 * 
 * Component for switching between supported locales (ru/en)
 */

'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';
import { setLocaleCookie, getLocaleFromCookie } from '@/lib/i18n';
import { locales, type Locale } from '@/i18n/routing';

const localeLabels: Record<Locale, string> = {
  ru: 'Русский',
  en: 'English',
};

const localeFlags: Record<Locale, string> = {
  ru: '🇷🇺',
  en: '🇬🇧',
};

export default function LanguageSwitcher() {
  // Try to get locale from next-intl, fallback to cookie
  let currentLocale: Locale;
  try {
    currentLocale = useLocale() as Locale;
  } catch {
    // Fallback to cookie if useLocale fails
    currentLocale = getLocaleFromCookie();
  }
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = async (newLocale: Locale) => {
    if (newLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    // Set cookie
    setLocaleCookie(newLocale);

    // Reload page to apply new locale
    // Using window.location.reload() to ensure full page reload with new locale
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:bg-surface-hover transition-all duration-200 hover:scale-105 active:scale-95 min-w-[36px] sm:min-w-0"
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <Globe className="h-4 w-4 text-text-secondary flex-shrink-0" />
        <span className="hidden sm:block text-sm font-medium text-text-primary whitespace-nowrap">
          {localeFlags[currentLocale]} {currentLocale.toUpperCase()}
        </span>
        <span className="sm:hidden text-base font-medium text-text-primary leading-none">
          {localeFlags[currentLocale]}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 mt-2 w-44 sm:w-48 rounded-xl sm:rounded-2xl shadow-xl bg-background/95 backdrop-blur-xl border border-border/50 py-1 sm:py-2 z-50 overflow-hidden">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => handleLocaleChange(locale)}
                className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-sm transition-all duration-200 ${
                  locale === currentLocale
                    ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 font-semibold'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`}
              >
                <span className="text-base sm:text-lg">{localeFlags[locale]}</span>
                <span className="flex-1 text-left">{localeLabels[locale]}</span>
                {locale === currentLocale && (
                  <span className="text-primary-600 text-sm">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

