/**
 * Localization configuration for Kabane
 *
 * Uses @lit/localize for runtime locale switching.
 * Source locale is English (en), with French (fr) translation.
 */

import { configureLocalization, msg, str } from '@lit/localize';
import { sourceLocale, targetLocales } from './locale-codes';

// Configure localization with runtime mode
export const { getLocale, setLocale } = configureLocalization({
  sourceLocale,
  targetLocales,
  loadLocale: (locale: string) => import(`./locales/${locale}.ts`),
});

// Storage key for persisting locale preference
const LOCALE_STORAGE_KEY = 'kabane_locale';

/**
 * Get the user's preferred locale
 * Checks localStorage first, then browser settings
 */
export function getPreferredLocale(): string {
  // Check localStorage
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  console.log(stored);
  if (stored && (stored === sourceLocale || targetLocales.includes(stored as (typeof targetLocales)[number]))) {
    return stored;
  }

  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  if (browserLang === sourceLocale || targetLocales.includes(browserLang as (typeof targetLocales)[number])) {
    return browserLang;
  }

  return sourceLocale;
}

/**
 * Set and persist the locale
 */
export async function setAndPersistLocale(locale: string): Promise<void> {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  await setLocale(locale);
}

/**
 * Initialize localization with user's preferred locale
 */
export async function initLocalization(): Promise<void> {
  const preferredLocale = getPreferredLocale();
  if (preferredLocale !== sourceLocale) {
    await setLocale(preferredLocale);
  }
}

// Re-export for convenience
export { sourceLocale, targetLocales, msg, str };
