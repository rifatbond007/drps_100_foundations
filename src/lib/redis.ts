/**
 * Singleton Redis (ioredis) client.
 * Used for: sessions, rate limiting, idempotency, caching.
 *
 * Production guarantees:
 *  - REDIS_URL MUST be set. If it is missing we log an error at import
 *    (never throw — that would break `next build` and unrelated routes)
 *    and disable the offline queue so commands fail fast instead of
 *    hanging on a localhost connection that will never succeed.
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

const missingInProd = isProd && (!rawUrl || rawUrl.length === 0);
if (missingInProd) {
  // Log loudly instead of throwing: a module-level throw breaks `next build`
  // and every route that merely imports this file (health, landing stats).
  // Commands fail fast instead (see enableOfflineQueue below) and callers
  // already degrade when Redis is unavailable.
  logger.error(
    {},
    'REDIS_URL must be set in production. Redis-backed features (rate limit, idempotency, caching) are disabled.'
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
    // Misconfigured prod: reject commands immediately instead of queueing
    // them behind a connection that will never come up.
    ...(missingInProd ? { enableOfflineQueue: false } : {}),
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
