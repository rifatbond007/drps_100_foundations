import { describe, expect, it } from 'vitest';
import { apiErrorKey } from '@/lib/i18n/error-message';
import { ApiClientError } from '@/lib/api/errors';

const err = (code: string) => new ApiClientError('x', { status: 409, code });

describe('apiErrorKey', () => {
  it('maps known API codes to errors.codes.*', () => {
    expect(apiErrorKey(err('TRX_ALREADY_USED'))).toBe('errors.codes.TRX_ALREADY_USED');
  });

  it('falls back to INTERNAL_ERROR for unknown codes and non-API errors', () => {
    expect(apiErrorKey(err('SOMETHING_NEW'))).toBe('errors.codes.INTERNAL_ERROR');
    expect(apiErrorKey(new Error('network'))).toBe('errors.codes.INTERNAL_ERROR');
  });
});
