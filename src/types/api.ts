/**
 * Shared API response types.
 * Mirrors `src/lib/api/helpers.ts` envelope.
 */

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  /** Server-generated correlation ID for support/triage. Always present in prod for 4xx/5xx. */
  errorId?: string;
  /** Field-level validation errors (only for VALIDATION_ERROR) */
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;