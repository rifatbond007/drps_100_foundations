import { describe, expect, it } from 'vitest';
import { locales, defaultLocale, isLocale, localeLabels } from '@/lib/i18n/config';

describe('i18n config', () => {
  it('exports bn and en locales', () => {
    expect(locales).toContain('bn');
    expect(locales).toContain('en');
  });

  it('defaults to bn', () => {
    expect(defaultLocale).toBe('bn');
  });

  it('isLocale validates correctly', () => {
    expect(isLocale('bn')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('')).toBe(false);
  });

  it('has labels for every locale', () => {
    for (const l of locales) {
      expect(localeLabels[l]).toBeTruthy();
    }
  });
});