/**
 * Auth-agent validation tests.
 *
 * The actual /api/users/* routes require a live DB and session, which are
 * integration-tested separately. Here we cover the bits we can test in
 * isolation: phone regex, validation schemas, and the ConflictError class
 * added for profile-completion double-submit protection.
 */
import { describe, expect, it } from 'vitest';
import { ConflictError, ValidationError } from '@/lib/errors';

// Mirror of the regex used in the complete-profile + profile PATCH routes.
const PHONE_RE = /^(\+?880|0)1[3-9]\d{8}$/;

describe('phone validation regex', () => {
  it.each([
    '+8801712345678',
    '01712345678',
    '8801712345678',
    '+8801912345678',
    '+8801512345678',
  ])('accepts %s', (phone) => {
    expect(PHONE_RE.test(phone)).toBe(true);
  });

  it.each([
    '1234',
    '0171234',         // too short
    '017123456789',    // too long (11 after 0)
    '+8801212345678',  // 02 — not a mobile prefix
    '+880171234567',   // 11 digits total after country
    'abcdefghijk',
    '',
  ])('rejects %s', (phone) => {
    expect(PHONE_RE.test(phone)).toBe(false);
  });
});

describe('ConflictError', () => {
  it('is an AppError with 409 / CONFLICT', () => {
    const err = new ConflictError('Profile already completed');
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe('CONFLICT');
    expect(err.name).toBe('ConflictError');
    expect(err.safeMessage).toBe('Profile already completed');
  });

  it('default message is "Conflict"', () => {
    const err = new ConflictError();
    expect(err.message).toBe('Conflict');
  });
});

describe('ValidationError carries field errors', () => {
  it('preserves details for downstream consumers', () => {
    const err = new ValidationError('Invalid input', {
      fieldErrors: { phone: ['Required'] },
    });
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toEqual({ fieldErrors: { phone: ['Required'] } });
  });
});