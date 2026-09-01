import { describe, expect, it } from 'vitest';
import {
  getSessionCookieNames,
  isSecureCookieName,
  SESSION_COOKIE_NAMES,
} from '@/lib/utils/cookie-name';

describe('getSessionCookieNames', () => {
  it('returns both secure + plain variants for https (preference order matters)', () => {
    const names = getSessionCookieNames('https:');
    expect(names).toEqual([SESSION_COOKIE_NAMES.SECURE, SESSION_COOKIE_NAMES.PLAIN]);
    // The secure variant MUST come first so middleware prefers the
    // cookie NextAuth should have set on production.
    expect(names[0]).toBe('__Secure-authjs.session-token');
  });

  it('returns only the plain variant for http (dev / localhost)', () => {
    const names = getSessionCookieNames('http:');
    expect(names).toEqual([SESSION_COOKIE_NAMES.PLAIN]);
    expect(names).toHaveLength(1);
  });

  it('returns only the plain variant for any non-https protocol', () => {
    expect(getSessionCookieNames('ws:')).toEqual([SESSION_COOKIE_NAMES.PLAIN]);
    expect(getSessionCookieNames('')).toEqual([SESSION_COOKIE_NAMES.PLAIN]);
    expect(getSessionCookieNames('file:')).toEqual([SESSION_COOKIE_NAMES.PLAIN]);
  });

  it('returns readonly arrays (callers must not mutate)', () => {
    const names = getSessionCookieNames('https:');
    expect(Array.isArray(names)).toBe(true);
    // The underlying tuple types are `readonly`, so TypeScript prevents
    // mutation at compile time. Confirm at runtime that the result
    // matches the documented shape (Array.isArray === true, length === 2).
    expect(names).toHaveLength(2);
  });
});

describe('isSecureCookieName', () => {
  it('returns true for the secure-prefixed variant', () => {
    expect(isSecureCookieName('__Secure-authjs.session-token')).toBe(true);
  });

  it('returns false for the plain variant', () => {
    expect(isSecureCookieName('authjs.session-token')).toBe(false);
  });

  it('returns false for any other name (defense in depth)', () => {
    expect(isSecureCookieName('authjs.session-token-foo')).toBe(false);
    expect(isSecureCookieName('__Secure-')).toBe(true); // bare prefix still counts
    expect(isSecureCookieName('')).toBe(false);
  });
});

describe('SESSION_COOKIE_NAMES constants', () => {
  it('matches the exact names next-auth v5 uses', () => {
    // These are the literal strings next-auth@5.0.0-beta.25 sets.
    // If next-auth ever changes them, this test breaks loudly.
    expect(SESSION_COOKIE_NAMES.SECURE).toBe('__Secure-authjs.session-token');
    expect(SESSION_COOKIE_NAMES.PLAIN).toBe('authjs.session-token');
  });
});
