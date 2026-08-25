/**
 * Singleton Redis (ioredis) client.
 * Used for: sessions, rate limiting, idempotency, caching.
 */
import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as { redis?: Redis };

const url = process.env.REDIS_URL ?? 'redis://localhost:6379';

export const redis =
  globalForRedis.redis ??
  new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    reconnectOnError: (err) =>
      err.message.includes('READONLY') || err.message.includes('ETIMEDOUT'),
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

redis.on('error', (err) => {
  // Don't crash on transient errors — log and continue
  // eslint-disable-next-line no-console
  console.error('[redis] error:', err.message);
});
