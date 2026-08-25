/**
 * Middleware: i18n routing + auth + role guards.
 * Per auth-agent.md.
 *
 * Hardening (audit C1, H1):
 * - Every redirect/response preserves headers + cookies from intlMiddleware
 *   so locale detection cookies (NEXT_LOCALE) and Vary headers aren't dropped
 *   on auth/profile-completion/admin-redirect flows.
 * - Exact-prefix matching for protected routes to avoid /en/admin-dashboard
 *   accidentally matching /en/admin/dashboard or vice versa.
 */
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { locales, defaultLocale } from '@/lib/i18n/config';

const intlMiddleware = createIntlMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
});

const SECRET = process.env.NEXTAUTH_SECRET ?? '';

/**
 * Copy cookies/Set-Cookie + key headers (Vary) from `source` onto a redirect.
 * Use this for every NextResponse.redirect/NextResponse.json() we return.
 */
function withIntlHeaders(
  response: NextResponse,
  source: NextResponse,
): NextResponse {
  // Forward Set-Cookie headers
  for (const [name, value] of source.headers.entries()) {
    if (name.toLowerCase() === 'set-cookie' || name.toLowerCase() === 'vary') {
      response.headers.append(name, value);
    }
  }
  return response;
}

/**
 * Build a redirect response that still carries intl cookies + Vary.
 * Use NextResponse.redirect's init.headers option (Next 15 supported).
 */
function redirectWithIntl(
  intlResponse: NextResponse,
  url: URL,
  request: NextRequest,
): NextResponse {
  const headers = new Headers(request.headers);
  // Pass through any cookie/header adjustments the intl middleware made
  for (const [k, v] of intlResponse.headers.entries()) {
    if (k.toLowerCase() === 'set-cookie' || k.toLowerCase() === 'vary') {
      headers.set(k, v);
    }
  }
  return NextResponse.redirect(url, { headers });
}

export default async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;

  // First segment might be the locale
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  const isLocalePath = (locales as readonly string[]).includes(firstSegment ?? '');
  const locale = isLocalePath ? (firstSegment as (typeof locales)[number]) : defaultLocale;

  // Public API routes — no auth check, no intl middleware
  const isPublicApi =
    pathname.startsWith('/api/auth') ||
    pathname === '/api/health' ||
    pathname.startsWith('/api/donations/webhook');

  if (isPublicApi) {
    return NextResponse.next();
  }

  // Run i18n middleware first (sets locale cookie, Vary header)
  const intlResponse = intlMiddleware(request);

  // Auth-free pages (public route group + locale root + next assets)
  const isAuthFreePath =
    pathname === `/${locale}` ||
    pathname === `/${locale}/login` ||
    pathname === `/${locale}/about` ||
    pathname.startsWith('/_next') ||
    pathname === '/';

  if (isAuthFreePath || isLocalePath === false) {
    return intlResponse;
  }

  const token = await getToken({ req: request, secret: SECRET });
  const isLoggedIn = !!token;
  const userRole = token?.role as string | undefined;
  const profileCompleted = token?.profileCompleted as boolean | undefined;

  // H1: exact-prefix matching — `/en/admin-dashboard-fake` must NOT match `/en/admin`.
  const matchesPath = (prefix: string): boolean =>
    pathname === prefix || pathname.startsWith(`${prefix}/`);

  // Routes that require login only (profile completion guarded separately)
  const loginOnlyPaths = [
    `/${locale}/complete-profile`,
  ];
  const isLoginOnlyRoute = loginOnlyPaths.some(matchesPath);

  // Routes that require login AND completed profile
  const fullyProtectedPaths = [
    `/${locale}/dashboard`,
    `/${locale}/donate`,
    `/${locale}/donate/success`,
    `/${locale}/donate/failed`,
    `/${locale}/history`,
    `/${locale}/settings`,
  ];
  const isFullyProtectedRoute = fullyProtectedPaths.some(matchesPath);

  // Login-only routes: just require logged in
  if (isLoginOnlyRoute && !isLoggedIn) {
    const loginUrl = new URL(`/${locale}/login`, nextUrl);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return redirectWithIntl(intlResponse, loginUrl, request);
  }

  // Fully-protected routes: require logged in, then completed profile
  if (isFullyProtectedRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL(`/${locale}/login`, nextUrl);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return redirectWithIntl(intlResponse, loginUrl, request);
    }
    if (profileCompleted === false) {
      return redirectWithIntl(intlResponse, new URL(`/${locale}/complete-profile`, nextUrl), request);
    }
  }

  // Profile incomplete — but ONLY on login-only routes do we forward them
  // to /complete-profile. If they're visiting a public page (home, about),
  // don't bounce them — let them browse.
  if (
    isLoggedIn &&
    profileCompleted === false &&
    matchesPath(`/${locale}/complete-profile`) === false &&
    isFullyProtectedRoute === false
  ) {
    // No-op: let them view public pages
  }

  // Admin routes — require ADMIN role
  if (matchesPath(`/${locale}/admin`)) {
    if (userRole !== 'ADMIN') {
      return redirectWithIntl(intlResponse, new URL(`/${locale}/dashboard`, nextUrl), request);
    }
  }

  // Admin API — 403 instead of redirect; still carry intl headers
  if (pathname.startsWith('/api/admin') && userRole !== 'ADMIN') {
    const res = NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    return withIntlHeaders(res, intlResponse);
  }

  return intlResponse;
}

export const config = {
  // Match all routes except: _next/static, _next/image, favicon, public files
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)).*)'],
};
