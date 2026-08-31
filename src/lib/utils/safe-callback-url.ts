/**
 * Defensive helper for user-controlled `callbackUrl` query params.
 *
 * Rules:
 *  - Empty / missing      → returns the fallback
 *  - Protocol-relative    → returns the fallback  (begins with `//`)
 *  - Non-absolute         → returns the fallback  (must start with `/`)
 *  - Control characters   → returns the fallback  (defense against header injection)
 *  - Otherwise            → returns the original value
 *
 * This is intentionally narrow — we only ever need this for same-origin paths
 * that we ourselves hand to next/navigation or next-auth's signIn()/signOut().
 * Do NOT loosen the checks without also re-auditing every call site.
 */
export function safeCallbackUrl(input: string | undefined | null, fallback = '/'): string {
  if (!input) return fallback;
  if (!input.startsWith('/')) return fallback;
  if (input.startsWith('//')) return fallback;
  if (/[\r\n\t]/.test(input)) return fallback;
  return input;
}
