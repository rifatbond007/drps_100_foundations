/**
 * Singleton Redis (ioredis) client.
 * Used for: sessions, rate limiting, idempotency, caching.
 *
 * Production guarantees:
 *  - REDIS_URL MUST be set; we throw at module-load instead of silently
 *    connecting to a non-existent local Redis. This catches the common
 *    Vercel misconfig (default `redis://localhost:6379` = guaranteed
 *    EHOSTUNREACH + 30s hangs on every serverless cold start) at
 *    startup instead of producing opaque "Something went wrong" 500s
 *    on the first request that hits `redis.zcard(...)` /
 *    `redis.get(...)`.
 *  - Auto-enable TLS for `rediss://` URLs (Upstash, Redis Cloud, etc.)
 *    by parsing the URL explicitly — passing a `rediss://` URL through
 *    ioredis's `url:` constructor option DOES auto-set `tls: {}` since
 *    ioredis ≥4, but we set it defensively so the contract is local
 *    and explicit.
 *  - Dev: fall back to `redis://localhost:6379` so `pnpm dev` keeps
 *    working without docker-compose being up — the rate limiter
 *    gracefully degrades when Redis isn't reachable (see rate-limit.ts).
 */
import Redis from 'ioredis';
import { logger } from '@/lib/logger';

const globalForRedis = globalThis as unknown as { redis?: Redis };

const isProd = process.env.NODE_ENV === 'production';
const rawUrl = process.env.REDIS_URL;

if (isProd && (!rawUrl || rawUrl.length === 0)) {
  throw new Error(
    'REDIS_URL must be set in production. On Vercel, add it under Project → Settings → Environment Variables ' +
      'for the Production environment. Using a default `redis://localhost:6379` on Vercel causes silent ' +
      'connection failures and opaque 500s on every request that hits Redis (rate limit, idempotency cache).'
  );
}

/** Fall back to local Redis only in dev — never in production. */
const url = rawUrl && rawUrl.length > 0 ? rawUrl : 'redis://localhost:6379';

const isTls = url.startsWith('rediss://');

export const redis =
  globalForRedis.redis ??
  new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    // `lazyConnect: true` keeps the constructor from opening a socket
    // until the first command is issued. On Vercel, where many route
    // imports pull `redis` synchronously but never call it, this avoids
    // a connect attempt (and the subsequent retry storm) for cold
    // invocations that don't actually use Redis. The first command will
    // still throw if Redis is unreachable — and that throw is now the
    // ONLY place a Redis failure surfaces (caught in helpers.ts / rate
    // limiter below), so the failure mode is loud, not silent.
    lazyConnect: true,
    reconnectOnError: (err) =>
      err.message.includes('READONLY') || err.message.includes('ETIMEDOUT'),
    ...(isTls ? { tls: { rejectUnauthorized: true } } : {}),
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

redis.on('error', (err) => {
  // Don't crash on transient errors — log and continue. Pino handles
  // the prod path; console for local dev convenience.
  logger.warn({ err: err.message, code: err.name }, '[redis] connection error');
  if (!isProd) {
    // eslint-disable-next-line no-console
    console.error('[redis] error:', err.message);
  }
});

redis.on('connect', () => {
  logger.info({ url: url.replace(/:[^:@/]+@/, ':***@') }, '[redis] connected');
});

redis.on('ready', () => {
  logger.info('[redis] ready');
});
