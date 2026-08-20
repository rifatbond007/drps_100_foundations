import { describe, expect, it } from 'vitest';
import { cn, formatBDT } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('filters falsy values', () => {
    expect(cn('a', undefined, null, false, 'b')).toBe('a b');
  });

  it('handles empty inputs', () => {
    expect(cn()).toBe('');
  });
});

describe('formatBDT', () => {
  it('formats whole numbers in English locale', () => {
    const result = formatBDT('1000', 'en');
    expect(result).toMatch(/1[,.]?000/);
    expect(result).toContain('BDT');
  });

  it('formats decimal values in English locale (rounds to whole number)', () => {
    // BDT doesn't use paisa — function rounds to integer
    const result = formatBDT('1000.50', 'en');
    expect(result).toMatch(/1[,.]?0(0[1-9]|0[1-9]\d)/); // either 1000 or rounded
    expect(result).toContain('BDT');
  });

  it('formats Bangla locale (default)', () => {
    const result = formatBDT('1000', 'bn');
    // Bangla uses its own digits (১,০,০,০)
    expect(result).toContain('১');
    expect(result).toContain('০');
  });

  it('handles zero', () => {
    expect(formatBDT('0', 'en')).toBeTruthy();
  });

  it('handles number input', () => {
    expect(formatBDT(500, 'en')).toContain('500');
  });

  it('handles invalid input gracefully', () => {
    const result = formatBDT('not-a-number', 'en');
    expect(result).toBe('—');
  });
});