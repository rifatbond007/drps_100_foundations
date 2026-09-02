/**
 * Sliding window rate limiter using Redis.
 * Per security-agent.md and the README checklist.
 *
 * If Redis is unreachable (e.g. REDIS_URL missing / wrong on Vercel,
 * ioredis socket dropped), `rateLimit(...)` falls back to a permissive
 * allow-all and logs a warning. This is intentional:
 *
 *  - A 5xx on EVERY read endpoint because Redis is down is worse than
 *    a brief window of no rate-limiting — a fully-down Redis already
 *    means anyone hitting the routes can bypass rate limits, but the
 *    blast radius is bounded by the routes themselves.
 *  - For routes that MUST be rate-limited (payment, login), callers
 *    should invoke `requireRateLimitOrFail(...)` instead, which throws
 *    even on Redis failure — explicitly opting into hard-fail semantics.
 *
 * In dev (no REDIS_URL), the helper logs once and short-circuits to
 * allow so `pnpm dev` without docker-compose keeps working.
 */
import { redis } from '@/lib/redis';
import { RateLimitError } from '@/lib/errors';
import { logger } from '@/lib/logger';

export interface RateLimitConfig {
  max: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

const ALLOW_ALL: RateLimitResult = Object.freeze({
  allowed: true,
  remaining: Number.MAX_SAFE_INTEGER,
  resetAt: new Date(0),
});

export async function rateLimit(
  identifier: string,
  max: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  // Catch every Redis-side failure (connect, command, parse) and
  // downgrade to a permissive allow with a server-side warning so the
  // route can still serve traffic. Without this guard, a single
  // dropped ioredis connection returns ReplyError, which `helpers.ts`'s
  // catch-all maps to the opaque "Something went wrong" 500 — turning
  // an operational hiccup into "the whole site is broken".
  try {
    // Drop expired entries
    await redis.zremrangebyscore(key, 0, windowStart);

    const count = await redis.zcard(key);

    if (count >= max) {
      const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
      // H4: defend against empty/malformed Redis ZSET result.
      // Previously `oldest[1] ?? now` silently fell back, allowing indefinite
      // lockouts to be skipped if Redis returned empty.
      let oldestScore: number;
      if (oldest.length >= 2 && typeof oldest[1] === 'string' && oldest[1].length > 0) {
        oldestScore = Number(oldest[1]);
      } else if (oldest.length >= 2 && typeof oldest[1] === 'number') {
        oldestScore = oldest[1];
      } else {
        logger.warn(
          { key, oldest, count },
          'rate-limit: redis returned empty/malformed zset; defaulting resetAt to now'
        );
        oldestScore = now;
      }
      if (!Number.isFinite(oldestScore)) {
        logger.warn({ key, oldestScore }, 'rate-limit: parsed score is NaN, defaulting');
        oldestScore = now;
      }
      const resetAt = new Date(oldestScore + windowSeconds * 1000);
      return { allowed: false, remaining: 0, resetAt };
    }

    await redis.zadd(key, now, `${now}-${Math.random()}`);
    await redis.expire(key, windowSeconds);

    return {
      allowed: true,
      remaining: Math.max(0, max - count - 1),
      resetAt: new Date(now + windowSeconds * 1000),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(
      { identifier, error: message },
      'rate-limit: redis unavailable, allowing request (fail-open)'
    );
    return ALLOW_ALL;
  }
}

export function requireRateLimit(
  result: RateLimitResult
): asserts result is RateLimitResult & { allowed: true } {
  if (!result.allowed) {
    throw new RateLimitError(result.resetAt);
  }
}

/**
 * Strict variant — throws if Redis is unreachable instead of
 * degrading. Use for routes where bypassing rate-limit on Redis-down is
 * unacceptable (e.g. login, payment endpoints that hit idempotency).
 *
 * Today no caller uses this because login + payment both have alternate
 * limiting layers (Nginx edge rate-limit at the reverse proxy, Google
 * OAuth roundtrip on /login). Kept exported so future hardening can
 * switch the right routes over without restructuring.
 */
export function requireRateLimitOrFail(
  result: RateLimitResult,
  context: { identifier: string; error: unknown }
): asserts result is RateLimitResult & { allowed: true } {
  if (!result.allowed) {
    throw new RateLimitError(result.resetAt);
  }
  if (result === ALLOW_ALL) {
    // Fail-open branch — Redis itself failed; surface as 503 so the
    // caller (not Redis) decides policy. Routes that can't tolerate
    // this should catch + translate.
    const message =
      context.error instanceof Error ? context.error.message : 'rate-limit backend unavailable';
    throw new Error(`Rate limit backend unavailable: ${message}`);
  }
}

export const RATE_LIMITS = {
  DONATION_CREATE: { max: 3, windowSeconds: 300 }, // 3 per 5 min
  LOGIN: { max: 5, windowSeconds: 60 },
  API_GENERAL: { max: 100, windowSeconds: 60 },
  ADMIN_ACTION: { max: 30, windowSeconds: 60 },
  COMPLETE_PROFILE: { max: 5, windowSeconds: 60 },
} as const satisfies Record<string, RateLimitConfig>;
