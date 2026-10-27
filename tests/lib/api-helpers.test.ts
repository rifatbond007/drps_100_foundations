import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const mocks = vi.hoisted(() => ({
  auditCreate: vi.fn().mockResolvedValue({}),
}));
vi.mock('@/lib/prisma', () => ({ prisma: { auditLog: { create: mocks.auditCreate } } }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { fail, parseJsonBody, parseQuery } from '@/lib/api/helpers';
import { NotFoundError, ValidationError } from '@/lib/errors';

const schema = z.object({ note: z.string().optional() });

function req(body: string): Request {
  return new Request('http://localhost/x', { method: 'POST', body });
}

afterEach(() => {
  vi.unstubAllEnvs();
  mocks.auditCreate.mockClear();
});

describe('parseJsonBody', () => {
  it('rejects malformed JSON with a ValidationError', async () => {
    await expect(parseJsonBody(req('{bad'), schema)).rejects.toBeInstanceOf(ValidationError);
  });

  it('treats an empty optional body as {}', async () => {
    await expect(parseJsonBody(req(''), schema, { optional: true })).resolves.toEqual({});
  });

  it('rejects an empty body when not optional', async () => {
    await expect(parseJsonBody(req(''), schema)).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('parseQuery', () => {
  it('parses search params through the schema', () => {
    const q = parseQuery('http://localhost/x?page=2', z.object({ page: z.coerce.number() }));
    expect(q).toEqual({ page: 2 });
  });
});

describe('fail() error persistence', () => {
  it('does not persist 4xx AppErrors in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const res = fail(new NotFoundError());
    expect(res.status).toBe(404);
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it('persists unknown errors in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const res = fail(new Error('boom'));
    expect(res.status).toBe(500);
    expect(mocks.auditCreate).toHaveBeenCalledTimes(1);
  });
});
