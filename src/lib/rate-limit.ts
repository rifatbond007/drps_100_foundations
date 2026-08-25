/**
 * Sliding window rate limiter using Redis.
 * Per security-agent.md and the README checklist.
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

export async function rateLimit(
  identifier: string,
  max: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

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
}

export function requireRateLimit(
  result: RateLimitResult
): asserts result is RateLimitResult & { allowed: true } {
  if (!result.allowed) {
    throw new RateLimitError(result.resetAt);
  }
}

export const RATE_LIMITS = {
  DONATION_CREATE: { max: 3, windowSeconds: 300 }, // 3 per 5 min
  LOGIN: { max: 5, windowSeconds: 60 },
  API_GENERAL: { max: 100, windowSeconds: 60 },
  ADMIN_ACTION: { max: 30, windowSeconds: 60 },
  COMPLETE_PROFILE: { max: 5, windowSeconds: 60 },
} as const satisfies Record<string, RateLimitConfig>;
