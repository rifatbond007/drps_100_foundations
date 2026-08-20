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
    expect(err.message).toBe('Resource not found');
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

  it('passes through validation details', () => {
    const err = ApiClientError.fromEnvelope(400, {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: { fieldErrors: { email: ['Required'] } },
    });
    expect(err.details).toEqual({ fieldErrors: { email: ['Required'] } });
  });
});