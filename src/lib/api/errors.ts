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
    opts: { status: number; code: string; errorId?: string; details?: unknown },
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = opts.status;
    this.code = opts.code;
    this.errorId = opts.errorId;
    this.details = opts.details;
  }

  static fromEnvelope(status: number, body: ApiError): ApiClientError {
    return new ApiClientError(body.message || body.error, {
      status,
      code: body.error,
      errorId: body.errorId,
      details: body.details,
    });
  }
}
