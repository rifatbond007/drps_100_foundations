/**
 * GET /api/admin/reports — donation aggregates for the admin reports page.
 *
 * Returns:
 *   - totals: { totalRaised, totalDonations, totalDonors, totalUsers, successRate, todayTotal, todayCount }
 *   - byPurpose: array of { purpose, amount, count }
 *   - byMonth: array of { month (YYYY-MM), amount, count } — last 12 months inclusive
 *
 * Admin-only. Read-only; no DB writes. Cached briefly via Next's fetch cache
 * (admin pages are private anyway — caching is mostly to dedupe concurrent
 * fetches from the same admin session).
 *
 * Optional query:
 *   ?format=csv — returns a CSV stream (totals + byMonth) instead of JSON.
 *                 Used by the "Export CSV" button on the reports page.
 */
import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth/session';
import { ok, fail } from '@/lib/api/helpers';
import { rateLimit, requireRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();

    const rl = await rateLimit(
      `admin:reports:${session.user.id}`,
      RATE_LIMITS.ADMIN_ACTION.max,
      RATE_LIMITS.ADMIN_ACTION.windowSeconds
    );
    requireRateLimit(rl);

    const url = new URL(request.url);
    const format = url.searchParams.get('format');

    // Run all aggregations in parallel
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    // Calendar-day window for "today's total donations" stat card.
    // Use server-local midnight so the count matches the admin's wall clock.
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [statusAgg, purposeGroup, monthRaw, donorCount, todayAgg, totalUsers] = await Promise.all(
      [
        prisma.donation.groupBy({
          by: ['status'],
          _count: { _all: true },
          _sum: { amount: true },
        }),
        prisma.donation.groupBy({
          by: ['purpose'],
          where: { status: 'SUCCESS' },
          _count: { _all: true },
          _sum: { amount: true },
        }),
        prisma.donation.findMany({
          where: { status: 'SUCCESS', createdAt: { gte: twelveMonthsAgo } },
          select: { amount: true, createdAt: true },
        }),
        prisma.donation.findMany({
          where: { status: 'SUCCESS', userId: { not: null } },
          distinct: ['userId'],
          select: { userId: true },
        }),
        prisma.donation.aggregate({
          where: { status: 'SUCCESS', createdAt: { gte: startOfToday } },
          _count: { _all: true },
          _sum: { amount: true },
        }),
        // Excludes soft-deleted users. Includes admins so the count reflects
        // everyone who can sign in.
        prisma.user.count({ where: { deletedAt: null } }),
      ]
    );

    const totalRaised = statusAgg
      .filter((s) => s.status === 'SUCCESS')
      .reduce((acc, s) => acc.plus(s._sum.amount ?? new Prisma.Decimal(0)), new Prisma.Decimal(0));

    const totalAll = statusAgg.reduce((acc, s) => acc + s._count._all, 0);
    const totalSuccess = statusAgg.find((s) => s.status === 'SUCCESS')?._count._all ?? 0;
    const successRate = totalAll === 0 ? 0 : Math.round((totalSuccess / totalAll) * 10000) / 100; // 2dp

    const totals = {
      totalRaised: totalRaised.toString(),
      totalDonations: totalAll,
      totalDonors: donorCount.length,
      totalUsers,
      successRate,
      todayTotal: (todayAgg._sum.amount ?? new Prisma.Decimal(0)).toString(),
      todayCount: todayAgg._count._all,
    };

    const byPurpose = purposeGroup
      .map((p) => ({
        purpose: p.purpose,
        amount: (p._sum.amount ?? new Prisma.Decimal(0)).toString(),
        count: p._count._all,
      }))
      .sort((a, b) => Number(b.amount) - Number(a.amount));

    // Aggregate donations into YYYY-MM buckets client-side (Postgres generate_series
    // would be cleaner but keeps things DB-agnostic and avoids raw SQL).
    const monthMap = new Map<string, { amount: Prisma.Decimal; count: number }>();
    for (const d of monthRaw) {
      const key = `${d.createdAt.getFullYear()}-${String(d.createdAt.getMonth() + 1).padStart(
        2,
        '0'
      )}`;
      const cur = monthMap.get(key) ?? {
        amount: new Prisma.Decimal(0),
        count: 0,
      };
      cur.amount = cur.amount.plus(d.amount);
      cur.count += 1;
      monthMap.set(key, cur);
    }

    // Ensure we emit all 12 months (zero-filled) so the chart doesn't have gaps.
    const byMonth: { month: string; amount: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthMap.get(key);
      byMonth.push({
        month: key,
        amount: (bucket?.amount ?? new Prisma.Decimal(0)).toString(),
        count: bucket?.count ?? 0,
      });
    }

    if (format === 'csv') {
      // RFC-4180-ish CSV escape: quote fields containing comma/quote/newline
      // and double any internal quotes. Defends against CSV-injection
      // (`=cmd|...` etc.) by always quoting string fields.
      const csv = (v: string | number) => {
        const s = String(v);
        return `"${s.replace(/"/g, '""')}"`;
      };
      const rows: string[] = [];
      rows.push('# Totals');
      rows.push(`${csv('totalRaised')},${csv(totals.totalRaised)}`);
      rows.push(`${csv('totalDonations')},${csv(totals.totalDonations)}`);
      rows.push(`${csv('totalDonors')},${csv(totals.totalDonors)}`);
      rows.push(`${csv('successRate')},${csv(totals.successRate)}`);
      rows.push(`${csv('todayTotal')},${csv(totals.todayTotal)}`);
      rows.push(`${csv('todayCount')},${csv(totals.todayCount)}`);
      rows.push(`${csv('totalUsers')},${csv(totals.totalUsers)}`);
      rows.push('');
      rows.push('# By purpose');
      rows.push(`${csv('purpose')},${csv('amount')},${csv('count')}`);
      for (const p of byPurpose) rows.push(`${csv(p.purpose)},${csv(p.amount)},${csv(p.count)}`);
      rows.push('');
      rows.push('# By month (last 12 months)');
      rows.push(`${csv('month')},${csv('amount')},${csv('count')}`);
      for (const m of byMonth) rows.push(`${csv(m.month)},${csv(m.amount)},${csv(m.count)}`);

      // UTF-8 BOM so Excel on Windows renders Bengali correctly.
      const body = '\uFEFF' + rows.join('\n') + '\n';
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="donation-report-${new Date()
            .toISOString()
            .slice(0, 10)}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return ok({ totals, byPurpose, byMonth });
  } catch (error) {
    return fail(error);
  }
}
