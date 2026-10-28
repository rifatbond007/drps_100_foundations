/**
 * Page-level access rules, kept pure so they can be unit tested and run
 * in the Edge middleware. API routes enforce their own auth in handlers.
 */
import type { Locale } from '@/lib/i18n/config';

export type GuardResult = { action: 'next' } | { action: 'redirect'; to: string };

interface GuardInput {
  pathname: string;
  search: string;
  locale: Locale;
  /** Decoded JWT, or null. A revoked session decodes to `{}`. */
  token: { id?: unknown; role?: unknown } | null;
}

const PROTECTED = ['dashboard', 'donate', 'history', 'settings', 'admin'];

export function resolveRouteGuard({ pathname, search, locale, token }: GuardInput): GuardResult {
  const isSignedIn = typeof token?.id === 'string';
  const under = (segment: string) => {
    const prefix = `/${locale}/${segment}`;
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  };

  // The login page checks the real session itself: a decodable cookie may
  // belong to a revoked session, and redirecting it away from /login would
  // loop with the app layout's redirect back here.
  if (under('login')) return { action: 'next' };

  if (!PROTECTED.some(under)) return { action: 'next' };

  if (!isSignedIn) {
    const callbackUrl = encodeURIComponent(`${pathname}${search}`);
    return { action: 'redirect', to: `/${locale}/login?callbackUrl=${callbackUrl}` };
  }

  if (under('admin') && token?.role !== 'ADMIN') {
    return { action: 'redirect', to: `/${locale}/dashboard` };
  }

  return { action: 'next' };
}
