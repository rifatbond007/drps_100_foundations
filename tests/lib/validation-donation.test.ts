import { describe, expect, it } from 'vitest';
import { createDonationSchema, DONATION_PURPOSES } from '@/lib/validation/donation';

describe('createDonationSchema', () => {
  const validBase = {
    amount: 500,
    purpose: 'GENERAL_FUND',
    idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
  };

  it('accepts a valid payload', () => {
    const parsed = createDonationSchema.parse(validBase);
    expect(parsed.amount).toBe(500);
    expect(parsed.purpose).toBe('GENERAL_FUND');
  });

  it('rejects amount below 10', () => {
    expect(() => createDonationSchema.parse({ ...validBase, amount: 5 })).toThrow();
  });

  it('rejects amount above 100000', () => {
    expect(() => createDonationSchema.parse({ ...validBase, amount: 200000 })).toThrow();
  });

  it('accepts amounts with up to 2 decimal places', () => {
    const parsed = createDonationSchema.parse({ ...validBase, amount: 12.5 });
    expect(parsed.amount).toBe(12.5);
  });

  it('rejects amounts with more than 2 decimal places', () => {
    expect(() => createDonationSchema.parse({ ...validBase, amount: 12.345 })).toThrow();
  });

  it('rejects unknown purpose', () => {
    expect(() =>
      createDonationSchema.parse({ ...validBase, purpose: 'NOT_A_REAL_PURPOSE' }),
    ).toThrow();
  });

  it('rejects missing idempotency key', () => {
    const { idempotencyKey, ...rest } = validBase;
    expect(() => createDonationSchema.parse(rest)).toThrow();
    void idempotencyKey; // silence unused-var lint
  });

  it('rejects non-UUID idempotency key', () => {
    expect(() =>
      createDonationSchema.parse({ ...validBase, idempotencyKey: 'not-a-uuid' }),
    ).toThrow();
  });

  it('exports the canonical purpose list', () => {
    expect(DONATION_PURPOSES).toEqual([
      'GENERAL_FUND',
      'EDUCATION',
      'MEDICAL',
      'EMERGENCY',
    ]);
  });
});