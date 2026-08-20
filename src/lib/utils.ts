/**
 * Utility helpers — `cn()` for classnames, formatters.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBDT(amount: number | string, locale: 'bn' | 'en' = 'bn'): string {
  const n = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(n)) return '—';
  try {
    return new Intl.NumberFormat(locale === 'bn' ? 'bn-BD' : 'en-US', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `৳${n}`;
  }
}

export function truncate(text: string, max = 100): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
