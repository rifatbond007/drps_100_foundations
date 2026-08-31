import { describe, expect, it } from 'vitest';
import { safeCallbackUrl } from '@/lib/utils/safe-callback-url';

describe('safeCallbackUrl', () => {
  it('returns fallback when input is undefined', () => {
    expect(safeCallbackUrl(undefined)).toBe('/');
  });

  it('returns fallback when input is null', () => {
    expect(safeCallbackUrl(null)).toBe('/');
  });

  it('returns fallback when input is empty', () => {
    expect(safeCallbackUrl('')).toBe('/');
  });

  it('returns a custom fallback when provided', () => {
    expect(safeCallbackUrl(undefined, '/dashboard')).toBe('/dashboard');
  });

  it('passes through a valid absolute path', () => {
    expect(safeCallbackUrl('/dashboard')).toBe('/dashboard');
  });

  it('passes through a deep path with query string', () => {
    expect(safeCallbackUrl('/en/donate?amount=500')).toBe('/en/donate?amount=500');
  });

  it('rejects an external URL', () => {
    expect(safeCallbackUrl('https://evil.example.com')).toBe('/');
  });

  it('rejects a protocol-relative URL (open-redirect vector)', () => {
    expect(safeCallbackUrl('//evil.example.com')).toBe('/');
    expect(safeCallbackUrl('//evil.example.com/dashboard')).toBe('/');
  });

  it('rejects a value that does not start with /', () => {
    expect(safeCallbackUrl('dashboard')).toBe('/');
    expect(safeCallbackUrl('javascript:alert(1)')).toBe('/');
  });

  it('rejects embedded CR/LF/TAB (header injection)', () => {
    expect(safeCallbackUrl('/dashboard\r\nSet-Cookie:evil=1')).toBe('/');
    expect(safeCallbackUrl('/dashboard\tfoo')).toBe('/');
  });

  it('still rejects a tabbed path with a non-default fallback', () => {
    expect(safeCallbackUrl('/dashboard\tfoo', '/bn')).toBe('/bn');
  });
});
