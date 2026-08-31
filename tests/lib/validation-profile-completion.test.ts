import { describe, expect, it } from 'vitest';
import { firstTimeProfileCompletionSchema } from '@/lib/validation/profile-completion';

describe('firstTimeProfileCompletionSchema', () => {
  it('accepts a valid BD phone + languagePref', () => {
    const r = firstTimeProfileCompletionSchema.safeParse({
      phone: '+8801712345678',
      languagePref: 'BN',
    });
    expect(r.success).toBe(true);
  });

  it('rejects a phone without the +880 prefix', () => {
    const r = firstTimeProfileCompletionSchema.safeParse({
      phone: '01712345678',
      languagePref: 'BN',
    });
    expect(r.success).toBe(false);
  });

  it('rejects a phone with the wrong operator prefix (not 13-19)', () => {
    const r = firstTimeProfileCompletionSchema.safeParse({
      phone: '+8801112345678',
      languagePref: 'EN',
    });
    expect(r.success).toBe(false);
  });

  it('rejects an unsupported languagePref', () => {
    const r = firstTimeProfileCompletionSchema.safeParse({
      phone: '+8801712345678',
      languagePref: 'FR',
    });
    expect(r.success).toBe(false);
  });

  it('rejects when phone is missing', () => {
    const r = firstTimeProfileCompletionSchema.safeParse({ languagePref: 'BN' });
    expect(r.success).toBe(false);
  });
});
