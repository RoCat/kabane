/**
 * Generated locale codes for @lit/localize
 */

export const sourceLocale = 'en';
export const targetLocales = ['fr'] as const;
export const allLocales = [sourceLocale, ...targetLocales] as const;
export type Locale = (typeof allLocales)[number];
