import { safeCallbackUrl } from '@/lib/utils/safe-callback-url';

/** Where to send the user after sign-in: a same-site path, else their dashboard. */
export function resolveLoginCallback(raw: string | undefined, locale: string): string {
  return safeCallbackUrl(raw, `/${locale}/dashboard`);
}
