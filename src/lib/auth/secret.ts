/**
 * Single source of truth for NEXTAUTH_SECRET.
 *
 * Returns the value of NEXTAUTH_SECRET, throwing if it is missing or
 * empty. This function is intentionally NOT invoked at module-load
 * time (see the note below on why).
 *
 * IMPORTANT — why lazy, not eager:
 *
 * `next build` runs "page data collection" which evaluates every route's
 * module graph. If we threw on missing NEXTAUTH_SECRET at the top of
 * this file, any import of `@/lib/auth/secret` (directly or transitively,
 * e.g. via `@/lib/auth/session`) would crash the build when the env
 * var isn't present in the build environment — which is normal on
 * Vercel, where env vars live in the runtime, not the build.
 *
 * By exporting a function we keep the "fail loud on misconfig"
 * guarantee but defer it to first call, which always happens at
 * request time after env loading.
 *
 * Callers:
 *  - `next-auth.ts` passes the secret to NextAuth. NextAuth only
 *    reads `secret` when signing/verifying a JWT — i.e. at request
 *    time — so even passing the raw `process.env.NEXTAUTH_SECRET`
 *    is safe at build (NextAuth's MissingSecretError fires at the
 *    same point `getAuthSecret()` would).
 *  - `middleware.ts` calls `getAuthSecret()` directly inside the
 *    middleware function (per request).
 */
export function getAuthSecret(): string {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value || value.length === 0) {
    throw new Error(
      'NEXTAUTH_SECRET must be set (and non-empty) in the runtime that calls getAuthSecret(). ' +
        'On Vercel, confirm the variable is set for the Production environment ' +
        'and is not scoped to a single runtime/region.'
    );
  }
  return value;
}
