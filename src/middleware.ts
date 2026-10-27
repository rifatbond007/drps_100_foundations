/**
 * Middleware: i18n routing + page access rules.
 *
 * API routes are excluded by the matcher (they are not locale-prefixed)
 * and enforce auth themselves via requireAuth / requireAdmin.
 *
 * Page rules live in `resolveRouteGuard`: signed-out visitors to a
 * protected page go to `/{locale}/login?callbackUrl=…`, non-admins are
 * kept out of `/{locale}/admin`.
 */
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { locales, defaultLocale, isLocale } from '@/lib/i18n/config';
import { getAuthSecret } from '@/lib/auth/secret';
import { resolveRouteGuard } from '@/lib/auth/route-guard';
import { getSessionCookieNames, isSecureCookieName } from '@/lib/utils/cookie-name';

const intlMiddleware = createIntlMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
});

/**
 * Decode the session JWT. NextAuth may set either the `__Secure-` or the
 * plain cookie name depending on how the request reached it (Vercel's
 * proxy makes this unreliable), so probe both.
 */
async function readToken(request: NextRequest) {
  // Resolve the secret per request, not at import: `next build` evaluates
  // this file and a missing secret must not crash the build.
  const secret = getAuthSecret();
  for (const name of getSessionCookieNames(request.nextUrl.protocol)) {
    const token = await getToken({
      req: request,
      secret,
      secureCookie: isSecureCookieName(name),
      cookieName: name,
    });
    if (token) return token;
  }
  return null;
}

export default async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);
  const { pathname, search } = request.nextUrl;

  const firstSegment = pathname.split('/')[1] ?? '';
  if (!isLocale(firstSegment)) return intlResponse;

  const result = resolveRouteGuard({
    pathname,
    search,
    locale: firstSegment,
    token: await readToken(request),
  });
  if (result.action === 'next') return intlResponse;

  // Fresh redirect (never copy request headers into a response); carry
  // over only the locale cookies the intl middleware set.
  const redirect = NextResponse.redirect(new URL(result.to, request.url));
  for (const cookie of intlResponse.headers.getSetCookie()) {
    redirect.headers.append('set-cookie', cookie);
  }
  return redirect;
}

export const config = {
  // Everything except Next internals, static files and /api/* (API routes
  // are not locale-prefixed; the intl middleware would rewrite them).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)).*)',
  ],
};
