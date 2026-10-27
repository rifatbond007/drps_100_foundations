import { describe, expect, it } from 'vitest';
import { formatBDT, formatDate, formatNumber, intlLocale, toAppLocale } from '@/lib/format';

describe('format helpers', () => {
  it('formats BDT with locale digits', () => {
    expect(formatBDT(1500, 'en')).toContain('1,500');
    expect(formatBDT(1500, 'bn')).toContain('১,৫০০');
  });

  it('returns an em dash for non-numeric amounts', () => {
    expect(formatBDT('abc', 'en')).toBe('—');
  });

  it('formats plain numbers in Bangla digits', () => {
    expect(formatNumber(1234, 'bn')).toBe('১,২৩৪');
  });

  it('formats dates in Asia/Dhaka time', () => {
    expect(formatDate('2026-01-31T20:00:00Z', 'en')).toContain('Feb 1, 2026');
  });

  it('maps unknown locales to bn', () => {
    expect(toAppLocale('fr')).toBe('bn');
    expect(toAppLocale('en')).toBe('en');
    expect(intlLocale('en')).toBe('en-US');
  });
});
