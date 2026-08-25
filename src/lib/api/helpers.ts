/**
 * API route helpers — uniform success/error envelope.
 *
 * H5 (audit fix): In production, AppError.message is NEVER echoed to clients.
 * Instead we generate an `errorId` (cryptographically random) and:
 *  - Log the full message + stack + errorId server-side
 *  - Return only `code`, `errorId`, and a redacted `safeMessage` to the client
 * In development we still echo the raw message for DX.
 */
import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { ZodError } from 'zod';
import { logger } from '@/lib/logger';

const IS_PROD = process.env.NODE_ENV === 'production';

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  errorId?: string;
  details?: unknown;
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, init);
}

function newErrorId(): string {
  return crypto.randomUUID();
}

export function fail(error: unknown): NextResponse<ApiError> {
  // Validation: always client-safe (no PII in zod issues by design)
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid input',
        details: error.flatten(),
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    if (IS_PROD) {
      const errorId = newErrorId();
      logger.error(
        {
          errorId,
          code: error.code,
          statusCode: error.statusCode,
          message: error.message,
          stack: error.stack,
        },
        'AppError in API route'
      );
      return NextResponse.json(
        {
          success: false,
          error: error.code,
          message: error.safeMessage,
          errorId,
        },
        { status: error.statusCode }
      );
    }
    // Dev: echo real message for DX
    return NextResponse.json(
      { success: false, error: error.code, message: error.message },
      { status: error.statusCode }
    );
  }

  // Unknown error: always opaque in prod
  if (IS_PROD) {
    const errorId = newErrorId();
    logger.error({ errorId, error }, 'Unhandled API error');
    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Something went wrong',
        errorId,
      },
      { status: 500 }
    );
  }
  // Dev: include the real error string
  const message = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ success: false, error: 'INTERNAL_ERROR', message }, { status: 500 });
}
