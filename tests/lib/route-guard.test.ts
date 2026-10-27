import { describe, expect, it } from 'vitest';
import { resolveRouteGuard } from '@/lib/auth/route-guard';

const user = { id: 'u1', role: 'USER' };
const admin = { id: 'a1', role: 'ADMIN' };
const guard = (pathname: string, token: { id?: unknown; role?: unknown } | null, search = '') =>
  resolveRouteGuard({ pathname, search, locale: pathname.startsWith('/en') ? 'en' : 'bn', token });

describe('resolveRouteGuard', () => {
  it('sends signed-out users on protected pages to login with a callbackUrl', () => {
    expect(guard('/en/donate', null, '?x=1')).toEqual({
      action: 'redirect',
      to: '/en/login?callbackUrl=%2Fen%2Fdonate%3Fx%3D1',
    });
  });

  it('treats a revoked (empty) token as signed out', () => {
    expect(guard('/bn/history', {})).toEqual({
      action: 'redirect',
      to: '/bn/login?callbackUrl=%2Fbn%2Fhistory',
    });
  });

  it('sends signed-out users on admin pages to login', () => {
    expect(guard('/en/admin/users', null)).toEqual({
      action: 'redirect',
      to: '/en/login?callbackUrl=%2Fen%2Fadmin%2Fusers',
    });
  });

  it('sends non-admins away from admin pages', () => {
    expect(guard('/bn/admin', user)).toEqual({ action: 'redirect', to: '/bn/dashboard' });
  });

  it('lets admins into admin pages', () => {
    expect(guard('/bn/admin/reports', admin)).toEqual({ action: 'next' });
  });

  it('never redirects away from the login page', () => {
    // The cookie may be revoked (banned/deleted/forced logout) even though it
    // decodes; the login page checks the real session itself. Redirecting here
    // would loop with the app layout's redirect back to /login.
    expect(guard('/en/login', user)).toEqual({ action: 'next' });
    expect(guard('/en/login', null)).toEqual({ action: 'next' });
  });

  it('uses exact-prefix matching', () => {
    expect(guard('/en/admin-dashboard-fake', null)).toEqual({ action: 'next' });
    expect(guard('/en/donations', null)).toEqual({ action: 'next' });
  });

  it('leaves public pages alone', () => {
    expect(guard('/bn', null)).toEqual({ action: 'next' });
    expect(guard('/bn/about', null)).toEqual({ action: 'next' });
    expect(guard('/bn/dashboard', user)).toEqual({ action: 'next' });
  });
});
