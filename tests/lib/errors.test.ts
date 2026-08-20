import { describe, expect, it } from 'vitest';
import {
  AppError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  PaymentError,
} from '@/lib/errors';

describe('AppError.safeMessage', () => {
  it('default AppError returns a generic safe message', () => {
    const e = new AppError('DB password was wrong, also credit card 4111-1111');
    expect(e.safeMessage).not.toContain('DB password');
    expect(e.safeMessage).not.toContain('4111');
  });

  it('UnauthorizedError returns sign-in prompt', () => {
    expect(new UnauthorizedError().safeMessage).toMatch(/sign in/i);
  });

  it('ForbiddenError returns generic permission message', () => {
    expect(new ForbiddenError().safeMessage).toMatch(/permission/i);
  });

  it('NotFoundError returns generic not-found', () => {
    expect(new NotFoundError().safeMessage).toMatch(/not found/i);
  });

  it('ValidationError.message is intentionally client-safe', () => {
    const e = new ValidationError('Email is required');
    expect(e.safeMessage).toBe('Email is required');
  });

  it('PaymentError never leaks provider details', () => {
    const e = new PaymentError('bKash 5xx: transactionRef=ABC123 secret=xyz');
    expect(e.safeMessage).not.toContain('ABC123');
    expect(e.safeMessage).not.toContain('xyz');
    expect(e.safeMessage).toMatch(/payment/i);
  });

  it('RateLimitError returns retry-later copy', () => {
    const e = new RateLimitError(new Date());
    expect(e.safeMessage).toMatch(/try again/i);
  });
});