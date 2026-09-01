/**
 * NextAuth session-cookie name selection.
 *
 * next-auth v5 (beta.25) sets the session cookie under one of two names
 * depending on whether `useSecureCookies` is true:
 *
 *   - HTTPS / production-like:  `__Secure-authjs.session-token`
 *   - HTTP / local dev:         `authjs.session-token`
 *
 * The flag is derived from the request URL NextAuth sees internally. On
 * Vercel's edge proxy that derivation is unreliable: depending on the
 * order of the OAuth callback vs. subsequent navigations, NextAuth may
 * end up setting the plain (non-secure-prefixed) cookie even though the
 * site is HTTPS — and then `getToken({ cookieName: '__Secure-...' })`
 * in middleware returns `null`, so protected routes bounce the user
 * back to `/${locale}?from=...` despite a valid session.
 *
 * Rather than depending on NextAuth's internal derivation, we probe
 * BOTH names (in preference order) and use whichever resolves to a
 * token. This makes middleware resilient regardless of which cookie
 * NextAuth happened to set.
 *
 * Extracted as a pure helper so it can be unit-tested without
 * instantiating the full middleware (which pulls in next-intl + the
 * Edge runtime stack).
 */

/** The two possible cookie names NextAuth may have used. */
export const SESSION_COOKIE_NAMES = {
  SECURE: '__Secure-authjs.session-token',
  PLAIN: 'authjs.session-token',
} as const;

/**
 * Returns the cookie names to probe, in preference order, given the
 * protocol of the incoming request.
 *
 * - `https:` → try the `__Secure-` variant FIRST (the correct one for
 *   production), fall back to the plain variant if NextAuth set the
 *   wrong one.
 * - `http:`  → only the plain variant is valid; the browser would have
 *   rejected the `__Secure-` cookie on a non-HTTPS origin anyway.
 */
export function getSessionCookieNames(protocol: string): readonly string[] {
  if (protocol === 'https:') {
    return [SESSION_COOKIE_NAMES.SECURE, SESSION_COOKIE_NAMES.PLAIN];
  }
  return [SESSION_COOKIE_NAMES.PLAIN];
}

/** True iff the cookie name carries the `__Secure-` prefix. */
export function isSecureCookieName(name: string): boolean {
  return name.startsWith('__Secure-');
}
