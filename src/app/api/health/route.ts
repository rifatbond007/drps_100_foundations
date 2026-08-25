/**
 * Health check endpoint.
 *
 * GET /api/health  — basic liveness
 * GET /api/health?deep=1  — also pings Postgres + Redis
 *
 * Returns:
 *   { status: 'ok' | 'degraded', timestamp, version, services? }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

const VERSION = process.env.npm_package_version ?? '0.1.0';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const deep = url.searchParams.get('deep') === '1';

  const services: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};

  if (deep) {
    // Postgres
    const pgStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      services.postgres = { ok: true, latencyMs: Date.now() - pgStart };
    } catch (e) {
      services.postgres = { ok: false, error: (e as Error).message };
    }

    // Redis
    const redisStart = Date.now();
    try {
      const pong = await redis.ping();
      services.redis = { ok: pong === 'PONG', latencyMs: Date.now() - redisStart };
    } catch (e) {
      services.redis = { ok: false, error: (e as Error).message };
    }
  }

  const allOk = Object.values(services).every((s) => s.ok);
  const status = deep && !allOk ? 'degraded' : 'ok';

  return NextResponse.json(
    {
      success: true,
      data: {
        status,
        timestamp: new Date().toISOString(),
        version: VERSION,
        ...(deep ? { services } : {}),
      },
    },
    { status: status === 'ok' ? 200 : 503 }
  );
}
