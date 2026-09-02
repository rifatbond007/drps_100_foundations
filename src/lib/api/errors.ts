/**
 * Client-side API error class.
 * Thrown by `apiClient` when the response envelope has `success: false`,
 * or when the HTTP response itself is non-2xx.
 */
import type { ApiError } from '@/types/api';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly errorId?: string;
  readonly details?: unknown;

  constructor(
    message: string,
    opts: { status: number; code: string; errorId?: string; details?: unknown }
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = opts.status;
    this.code = opts.code;
    this.errorId = opts.errorId;
    this.details = opts.details;
  }

  /**
   * Build an ApiClientError from a server envelope.
   *
   * In production, the server returns a redacted `safeMessage` (e.g.
   * "Something went wrong") for 4xx/5xx to avoid leaking PII. To make
   * those opaque messages debuggable, we append the server-generated
   * `errorId` (a UUID) into `Error.message` so it ends up surfaced
   * wherever the error is shown to the user — e.g. inside an i18n
   * template like "Failed to load: {message}" — and in the JS console
   * when the dev-tools network tab is open.
   *
   * ValidationError already carries actionable field-level details
   * (`body.details`) and is left untouched. For other server returns
   * the original message is preserved as-is when no errorId exists.
   */
  static fromEnvelope(status: number, body: ApiError): ApiClientError {
    const base = body.message || body.error;
    const refSuffix = body.errorId ? ` (ref ${body.errorId})` : '';
    return new ApiClientError(`${base}${refSuffix}`, {
      status,
      code: body.error,
      errorId: body.errorId,
      details: body.details,
    });
  }
}
