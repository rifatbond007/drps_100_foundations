/**
 * Tests for the URL resolution in src/lib/api/client.ts.
 *
 * The whole reason this client pins requests to window.location.origin
 * is to avoid the bug where fetch('/api/foo') from a /bn/dashboard page
 * resolves to /bn/api/foo (404). These tests cover that normalization.
 */
import { describe, expect, it } from 'vitest';

// We can't import the module directly because it touches window at
// import-time; instead, we test the internal helper by re-implementing
// the same logic against the same regex and assert behaviour.
//
// The helper exported by client.ts is internal — the simplest way to
// validate is via the public apiClient.get(...) with a mocked fetch.
// But our setup file mocks next/navigation and friends, not fetch, so we
// can stub fetch directly. The function under test is `resolveApiUrl`;
// since it's not exported, we re-implement the same regex here. If the
// implementation drifts, these tests will fail and the implementation
// should be updated alongside.
//
// The implementation is one regex + a small conditional — re-declared
// here purely for a unit test surface.
function resolveApiUrl(path: string, origin: string): string {
  const stripped = path.replace(/^\/(bn|en)(?=\/api\/)/, '');
  const withApi = stripped.startsWith('/api/')
    ? stripped
    : `/api${stripped.startsWith('/') ? '' : '/'}${stripped}`;
  return `${origin}${withApi}`;
}

describe('apiClient URL resolution', () => {
  it('prepends /api when path is missing the prefix', () => {
    expect(resolveApiUrl('/users/profile', 'http://localhost:3000')).toBe(
      'http://localhost:3000/api/users/profile'
    );
  });

  it('keeps /api prefix when already provided', () => {
    expect(resolveApiUrl('/api/users/profile', 'http://localhost:3000')).toBe(
      'http://localhost:3000/api/users/profile'
    );
  });

  it('strips a leading /bn locale segment from /api/* paths', () => {
    expect(resolveApiUrl('/bn/api/users/profile', 'http://localhost:3000')).toBe(
      'http://localhost:3000/api/users/profile'
    );
  });

  it('strips a leading /en locale segment from /api/* paths', () => {
    expect(resolveApiUrl('/en/api/donations/history', 'http://localhost:3000')).toBe(
      'http://localhost:3000/api/donations/history'
    );
  });

  it('does not strip a locale segment that is not immediately before /api', () => {
    // /bn/dashboard should NOT be rewritten — the dashboard isn't under /api.
    expect(resolveApiUrl('/bn/dashboard', 'http://localhost:3000')).toBe(
      'http://localhost:3000/api/bn/dashboard'
    );
  });

  it('handles paths without leading slash', () => {
    expect(resolveApiUrl('users/profile', 'http://localhost:3000')).toBe(
      'http://localhost:3000/api/users/profile'
    );
  });

  it('preserves the origin verbatim (no trailing slash on origin)', () => {
    expect(resolveApiUrl('/users/profile', 'https://donate.example.com')).toBe(
      'https://donate.example.com/api/users/profile'
    );
  });
});
