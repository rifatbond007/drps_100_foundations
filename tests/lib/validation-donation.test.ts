import { describe, expect, it } from 'vitest';
import {
  createDonationSchema,
  submitTrxSchema,
  adminReviewSchema,
  donationHistoryQuerySchema,
  DONATION_PURPOSES,
} from '@/lib/validation/donation';

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
      createDonationSchema.parse({ ...validBase, purpose: 'NOT_A_REAL_PURPOSE' })
    ).toThrow();
  });

  it('rejects missing idempotency key', () => {
    const { idempotencyKey, ...rest } = validBase;
    expect(() => createDonationSchema.parse(rest)).toThrow();
    void idempotencyKey; // silence unused-var lint
  });

  it('rejects non-UUID idempotency key', () => {
    expect(() =>
      createDonationSchema.parse({ ...validBase, idempotencyKey: 'not-a-uuid' })
    ).toThrow();
  });

  it('exports the canonical purpose list', () => {
    expect(DONATION_PURPOSES).toEqual(['GENERAL_FUND', 'EDUCATION', 'MEDICAL', 'EMERGENCY']);
  });
});

describe('submitTrxSchema (manual bKash TrxID + sender phone)', () => {
  const valid = { trxId: '8NQ3K9RT4X', senderPhone: '01712345678' };

  it('accepts a valid TrxID + BD phone', () => {
    const parsed = submitTrxSchema.parse(valid);
    expect(parsed.trxId).toBe('8NQ3K9RT4X');
    expect(parsed.senderPhone).toBe('01712345678');
  });

  it('strips surrounding whitespace', () => {
    const parsed = submitTrxSchema.parse({
      trxId: '  ABC123  ',
      senderPhone: ' 01712345678 ',
    });
    expect(parsed.trxId).toBe('ABC123');
    expect(parsed.senderPhone).toBe('01712345678');
  });

  it('rejects TrxID shorter than 6 chars', () => {
    expect(() => submitTrxSchema.parse({ ...valid, trxId: 'AB12' })).toThrow();
  });

  it('rejects TrxID with non-alphanumeric chars', () => {
    expect(() => submitTrxSchema.parse({ ...valid, trxId: 'ABC-123_XYZ' })).toThrow();
  });

  it('rejects phone that does not match 01[3-9]XXXXXXXX', () => {
    expect(() => submitTrxSchema.parse({ ...valid, senderPhone: '11234567890' })).toThrow();
    expect(() => submitTrxSchema.parse({ ...valid, senderPhone: '0171234567' })).toThrow(); // too short
  });
});

describe('adminReviewSchema', () => {
  it('accepts empty object (approve path)', () => {
    const parsed = adminReviewSchema.parse({});
    expect(parsed.adminNote).toBeUndefined();
  });

  it('accepts a short note', () => {
    expect(adminReviewSchema.parse({ adminNote: 'verified by bKash app' }).adminNote).toBe(
      'verified by bKash app'
    );
  });

  it('rejects notes longer than 500 chars', () => {
    expect(() => adminReviewSchema.parse({ adminNote: 'x'.repeat(501) })).toThrow();
  });
});

describe('donationHistoryQuerySchema', () => {
  it('accepts no params and applies defaults', () => {
    const parsed = donationHistoryQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
  });

  it('coerces numeric strings', () => {
    const parsed = donationHistoryQuerySchema.parse({ page: '2', limit: '5' });
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(5);
  });

  it('rejects limit above 100', () => {
    expect(() => donationHistoryQuerySchema.parse({ limit: '500' })).toThrow();
  });
});
