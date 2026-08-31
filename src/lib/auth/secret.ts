/**
 * Single source of truth for NEXTAUTH_SECRET.
 *
 * Importing this module guarantees NEXTAUTH_SECRET is present AND
 * non-empty. Both `next-auth.ts` (Node runtime — signs the JWT) and
 * `middleware.ts` (Edge runtime — verifies the JWT) read from here, so
 * a divergence or missing-env is impossible.
 *
 * Edge note: middleware.ts runs on the Edge runtime. NextAuth v5's
 * `getToken({ secret })` and the session-cookie HMAC both derive their
 * key from this same string. If the runtime sees an empty string,
 * `getToken` silently returns `null` and protected routes redirect to
 * the locale home with `?from=...` (see middleware.ts isFullyProtected
 * branch). Failing loudly here surfaces the misconfig instead.
 */
function resolveAuthSecret(): string {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value || value.length === 0) {
    throw new Error(
      'NEXTAUTH_SECRET must be set (and non-empty) in the runtime that imports @/lib/auth/secret. ' +
        'On Vercel, confirm the variable is set for the Production environment ' +
        'and is not scoped to a single runtime/region.'
    );
  }
  return value;
}

export const NEXTAUTH_SECRET = resolveAuthSecret();
