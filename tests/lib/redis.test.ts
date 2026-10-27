import { afterEach, describe, expect, it, vi } from 'vitest';

const logger = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn(), info: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('redis module', () => {
  it('does not throw at import when REDIS_URL is missing in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('REDIS_URL', '');
    await expect(import('@/lib/redis')).resolves.toBeDefined();
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(String(logger.error.mock.calls[0]?.[1] ?? logger.error.mock.calls[0]?.[0])).toContain(
      'REDIS_URL'
    );
  });
});
