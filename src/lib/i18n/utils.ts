/**
 * i18n utilities used by middleware and pages.
 */
import type { Locale } from './config';

export function getDirection(_locale: Locale): 'ltr' | 'rtl' {
  // Both bn and en are LTR
  return 'ltr';
}

export function getHtmlLang(locale: Locale): string {
  return locale === 'bn' ? 'bn' : 'en';
}
