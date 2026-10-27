/**
 * Locale-aware formatting for money, numbers and dates.
 * Dates render in Asia/Dhaka so server and browser agree.
 */
export type AppLocale = 'bn' | 'en';

export function toAppLocale(locale: string): AppLocale {
  return locale === 'en' ? 'en' : 'bn';
}

export function intlLocale(locale: AppLocale): 'bn-BD' | 'en-US' {
  return locale === 'en' ? 'en-US' : 'bn-BD';
}

export function formatBDT(amount: number | string, locale: AppLocale = 'bn'): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(n)) return '—';
  try {
    return new Intl.NumberFormat(intlLocale(locale), {
      style: 'currency',
      currency: 'BDT',
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `৳${n}`;
  }
}

export function formatNumber(n: number, locale: AppLocale): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(n);
}

export function formatDate(
  date: Date | string,
  locale: AppLocale,
  opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }
): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { timeZone: 'Asia/Dhaka', ...opts }).format(
    typeof date === 'string' ? new Date(date) : date
  );
}
