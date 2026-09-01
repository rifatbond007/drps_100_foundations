/**
 * Middleware: i18n routing + auth + role guards.
 *
 * There IS a /{locale}/login page — but only as a NextAuth error target.
 * Under the happy path, clicking "Sign in" in the header calls
 * `signIn('google')` directly via the SignInButton client component,
 * which navigates the browser to Google's account chooser without ever
 * visiting /login. The /login page only renders when NextAuth itself
 * redirects — e.g. after a failed OAuth callback (PKCE mismatch from a
 * dev-server restart) — and it must remain auth-free so the redirect
 * target is reachable.
 *
 * There is no /{locale}/complete-profile page. Profile fields
 * (phone, languagePref) are collected lazily — at the point they're
 * actually needed (donate flow). So authenticated-but-incomplete users
 * can browse fully-protected pages; the donate action will prompt for
 * the missing fields before allowing the API call.
 *
 * Hardening (audit C1, H1):
 * - Every redirect/response preserves headers + cookies from intlMiddleware
 *   so locale detection cookies (NEXT_LOCALE) and Vary headers aren't dropped
 *   on auth/admin-redirect flows.
 * - Exact-prefix matching for protected routes to avoid /en/admin-dashboard
 *   accidentally matching /en/admin/dashboard or vice versa.
 */
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { locales, defaultLocale } from '@/lib/i18n/config';
import { edgeRateLimit } from '@/lib/security/edge-rate-limit';
import { getAuthSecret } from '@/lib/auth/secret';
import { getSessionCookieNames, isSecureCookieName } from '@/lib/utils/cookie-name';

const intlMiddleware = createIntlMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
});

// Resolve the secret lazily (inside the middleware function), not at
// module top. `next build` evaluates middleware.ts during build; if we
// bound SECRET at import time, a missing NEXTAUTH_SECRET in the build
// env would crash the build on Vercel. Calling getAuthSecret() per
// request still gives the Edge + Node runtimes the same key and turns
// a missing/empty env var into a loud runtime error instead of a
// silent `getToken() === null` that drops users back to the home page.

/**
 * Copy cookies/Set-Cookie + key headers (Vary) from `source` onto a redirect.
 * Use this for every NextResponse.redirect/NextResponse.json() we return.
 */
function withIntlHeaders(response: NextResponse, source: NextResponse): NextResponse {
  for (const [name, value] of source.headers.entries()) {
    if (name.toLowerCase() === 'set-cookie' || name.toLowerCase() === 'vary') {
      response.headers.append(name, value);
    }
  }
  return response;
}

/**
 * Build a redirect response that still carries intl cookies + Vary.
 */
function redirectWithIntl(
  intlResponse: NextResponse,
  url: URL,
  request: NextRequest
): NextResponse {
  const headers = new Headers(request.headers);
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
  const isPublicApi = pathname.startsWith('/api/auth') || pathname === '/api/health';

  // Edge-compatible rate limit on auth endpoints (per-IP sliding window).
  // No-op when UPSTASH_REDIS_REST_URL is unset (local dev + CI without creds).
  if (pathname.startsWith('/api/auth')) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'anon';
    const rl = await edgeRateLimit(ip, 'LOGIN');
    if (!rl.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000));
      return NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many attempts. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rl.resetAt.getTime()),
          },
        }
      );
    }
  }

  if (isPublicApi) {
    return NextResponse.next();
  }

  // Run i18n middleware first (sets locale cookie, Vary header)
  const intlResponse = intlMiddleware(request);

  // Auth-free pages: locale root, /about, /login, root, next assets.
  // /login must be reachable without a session so NextAuth can redirect
  // failed OAuth callbacks (?error=...) back to a renderable page instead
  // of 404'ing. Clicking "Sign in" in the header still calls
  // signIn('google') directly and never visits this page — but if the
  // OAuth roundtrip fails (e.g. PKCE mismatch after a dev-server
  // restart), NextAuth bounces the browser here.
  const isAuthFreePath =
    pathname === `/${locale}` ||
    pathname === `/${locale}/about` ||
    pathname === `/${locale}/login` ||
    pathname.startsWith('/_next') ||
    pathname === '/';

  if (isAuthFreePath || isLocalePath === false) {
    return intlResponse;
  }

  // Detect secure-cookie variant from the actual request protocol — matches
  // what NextAuth itself does when SETTING the cookie. Without this, getToken()
  // defaults to looking for the plain `authjs.session-token` cookie (no
  // __Secure- prefix), which never exists on HTTPS deployments like Vercel.
  // Result: getToken() returns null on every protected route and middleware
  // bounces authenticated users back to /${locale}?from=… even though the
  // session is valid. Affects next-auth@5.0.0-beta.25 — see
  // https://github.com/nextauthjs/next-auth/issues/11043
  //
  // Try BOTH the secure-prefixed and plain cookie names because NextAuth's
  // `useSecureCookies` derivation is not 100% reliable on Vercel's proxy:
  // depending on the order of the OAuth callback vs. subsequent navigations,
  // it can set a plain `authjs.session-token` even on an HTTPS deployment.
  // We probe both names and use the first one that resolves to a valid token.
  // (Order: prefer the secure-prefixed variant when the request is HTTPS,
  // since that's what NextAuth SHOULD have set.)
  const cookieNames = getSessionCookieNames(request.nextUrl.protocol);

  let token: Awaited<ReturnType<typeof getToken>> = null;
  for (const name of cookieNames) {
    const candidate = await getToken({
      req: request,
      secret: getAuthSecret(),
      secureCookie: isSecureCookieName(name),
      cookieName: name,
    });
    if (candidate) {
      token = candidate;
      break;
    }
  }
  const isLoggedIn = !!token;
  const userRole = token?.role as string | undefined;

  // H1: exact-prefix matching — `/en/admin-dashboard-fake` must NOT match `/en/admin`.
  const matchesPath = (prefix: string): boolean =>
    pathname === prefix || pathname.startsWith(`${prefix}/`);

  // Routes that require login (profile completion no longer gates a route —
  // it's prompted lazily at point of use, e.g. on donate submit).
  const fullyProtectedPaths = [
    `/${locale}/dashboard`,
    `/${locale}/donate`,
    `/${locale}/donate/success`,
    `/${locale}/donate/failed`,
    `/${locale}/history`,
    `/${locale}/settings`,
  ];
  const isFullyProtectedRoute = fullyProtectedPaths.some(matchesPath);

  if (isFullyProtectedRoute && !isLoggedIn) {
    // No /login page — bounce them back to the locale home page.
    // The header's "Sign in" button on that page will kick off Google OAuth.
    const homeUrl = new URL(`/${locale}`, nextUrl);
    homeUrl.searchParams.set('from', pathname);
    return redirectWithIntl(intlResponse, homeUrl, request);
  }

  // Admin routes — require ADMIN role
  if (matchesPath(`/${locale}/admin`)) {
    if (!isLoggedIn) {
      const homeUrl = new URL(`/${locale}`, nextUrl);
      return redirectWithIntl(intlResponse, homeUrl, request);
    }
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
  // Match all routes EXCEPT:
  //   - _next/static, _next/image
  //   - favicon.ico
  //   - public files (image extensions)
  //   - /api/* — API routes are NOT locale-prefixed. They must reach the
  //     route handler as-is. If we let the intl middleware see them, it
  //     rewrites `/api/users/profile` → `/bn/api/users/profile` (307),
  //     which then 404s because no such route exists.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)).*)',
  ],
};
