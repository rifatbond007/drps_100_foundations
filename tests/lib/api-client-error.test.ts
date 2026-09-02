import { describe, expect, it } from 'vitest';
import { ApiClientError } from '@/lib/api/errors';

describe('ApiClientError.fromEnvelope', () => {
  it('builds an error carrying status + code + errorId', () => {
    const err = ApiClientError.fromEnvelope(404, {
      success: false,
      error: 'NOT_FOUND',
      message: 'Resource not found',
      errorId: 'err-abc-123',
    });
    expect(err.status).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.errorId).toBe('err-abc-123');
    // errorId is appended to the message so users + dev-tools see a
    // reference for triage even when the server returns a redacted
    // safeMessage.
    expect(err.message).toBe('Resource not found (ref err-abc-123)');
    expect(err.name).toBe('ApiClientError');
  });

  it('falls back to error code when message is missing', () => {
    const err = ApiClientError.fromEnvelope(500, {
      success: false,
      error: 'INTERNAL_ERROR',
      message: '',
    });
    expect(err.message).toBe('INTERNAL_ERROR');
  });

  it('omits ref suffix when no errorId is provided', () => {
    const err = ApiClientError.fromEnvelope(409, {
      success: false,
      error: 'CONFLICT',
      message: 'Already exists',
    });
    expect(err.message).toBe('Already exists');
    expect(err.errorId).toBeUndefined();
  });

  it('passes through validation details', () => {
    const err = ApiClientError.fromEnvelope(400, {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: { fieldErrors: { email: ['Required'] } },
    });
    expect(err.details).toEqual({ fieldErrors: { email: ['Required'] } });
    // Validation errors never carry an errorId, so no ref suffix.
    expect(err.message).toBe('Invalid input');
  });

  it('makes opaque 5xx messages debuggable by surfacing errorId', () => {
    // Production contract: server returns redacted safeMessage + errorId
    // for triage. The client appends the ref so users see it inline.
    const err = ApiClientError.fromEnvelope(500, {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Something went wrong',
      errorId: '8b7f6c1e-1d2a-4f0d-b9ef-7e2a4c1d9e3f',
    });
    expect(err.message).toBe('Something went wrong (ref 8b7f6c1e-1d2a-4f0d-b9ef-7e2a4c1d9e3f)');
  });
});
