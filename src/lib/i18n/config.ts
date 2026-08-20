/**
 * i18n configuration — supported locales and helpers.
 */
export const locales = ['bn', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'bn';

export const localeLabels: Record<Locale, string> = {
  bn: 'বাংলা',
  en: 'English',
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
