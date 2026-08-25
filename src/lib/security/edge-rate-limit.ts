/**
 * Edge-compatible rate limiter for middleware.
 *
 * Why a separate file?
 *   src/lib/rate-limit.ts uses ioredis, which only works in the Node runtime.
 *   Next.js middleware runs on the Edge runtime by default. We can't share
 *   the client.
 *
 * Activation:
 *   Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in env.
 *   When unset, rateLimit() returns `{ allowed: true }` so local dev + CI
 *   without Upstash credentials still work.
 *
 * Buckets:
 *   The RATE_LIMITS map mirrors src/lib/rate-limit.ts so the Node-side
 *   bucket values stay the source of truth — this file re-declares them
 *   to avoid a runtime-import cycle (Node code can't be imported from Edge).
 */
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

export interface EdgeRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

interface BucketConfig {
  max: number;
  windowSeconds: number;
}

const EDGE_BUCKETS: Record<string, BucketConfig> = {
  LOGIN: { max: 5, windowSeconds: 60 },
  COMPLETE_PROFILE: { max: 5, windowSeconds: 60 },
  API_GENERAL: { max: 100, windowSeconds: 60 },
};

// Singleton — instantiated once per Edge worker.
let client: Redis | null = null;
function getClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!client) {
    client = new Redis({ url, token });
  }
  return client;
}

function buildLimiter(name: string, cfg: BucketConfig): Ratelimit | null {
  const c = getClient();
  if (!c) return null;
  // `slidingWindow` is the closest match to our Node-side ZSET impl.
  return new Ratelimit({
    redis: c,
    limiter: Ratelimit.slidingWindow(cfg.max, `${cfg.windowSeconds} s`),
    prefix: `ratelimit:edge:${name}`,
    analytics: false,
  });
}

const limiters = new Map<string, Ratelimit | null>();

function getLimiter(name: string): Ratelimit | null {
  if (!limiters.has(name)) {
    const cfg = EDGE_BUCKETS[name];
    if (!cfg) return null;
    limiters.set(name, buildLimiter(name, cfg));
  }
  return limiters.get(name) ?? null;
}

/**
 * Returns `{ allowed: true }` (no-op) when Upstash isn't configured.
 * Caller MUST treat the no-op case as "rate limit disabled" — never as
 * "allowed because we got a pass". This keeps local dev + CI working
 * without secrets.
 */
export async function edgeRateLimit(
  identifier: string,
  bucketName: keyof typeof EDGE_BUCKETS,
): Promise<EdgeRateLimitResult> {
  const limiter = getLimiter(bucketName);
  if (!limiter) {
    return { allowed: true, remaining: -1, resetAt: new Date() };
  }
  const result = await limiter.limit(identifier);
  return {
    allowed: result.success,
    remaining: result.remaining,
    resetAt: new Date(result.reset),
  };
}
