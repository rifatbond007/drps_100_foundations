import { ApiClientError } from '@/lib/api/errors';

const KNOWN_CODES = new Set([
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMIT_EXCEEDED',
  'TRX_ALREADY_USED',
  'ALREADY_REVIEWED',
  'INTERNAL_ERROR',
]);

/**
 * Message key for an API failure. Server messages are English and may be
 * redacted, so the UI always shows a translated message for the code.
 */
export function apiErrorKey(error: unknown): string {
  const code =
    error instanceof ApiClientError && KNOWN_CODES.has(error.code) ? error.code : 'INTERNAL_ERROR';
  return `errors.codes.${code}`;
}
