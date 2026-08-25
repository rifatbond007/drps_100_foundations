import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/next-auth';
import { Sidebar } from '@/components/layout/Sidebar';
import { AdminStatsCard } from '@/components/admin/AdminStatsCard';
import { prisma } from '@/lib/prisma';
import type { AdminTotals } from '@/components/admin/AdminStatsCard';

/**
 * Admin layout — guards all /admin/* routes.
 * Requires role === 'ADMIN'.
 *
 * Wraps children with the same sidebar used by authenticated pages so the
 * admin keeps navigation context when clicking between Users / Reports.
 * The Sidebar's `isAdmin` prop also makes it render the admin section.
 *
 * Renders 3 stat cards above the page content (total users, total raised,
 * today's donations). Fetches the totals inline so the cards are visible
 * immediately on every admin page — no client-side fetch waterfall.
 *
 * If the totals query fails, we fall back to zeros rather than throwing —
 * an admin must still be able to use ban/reports even if the dashboard
 * aggregates hit a transient DB issue.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user) redirect(`/${locale}/login`);
  if (session.user.role !== 'ADMIN') redirect(`/${locale}/dashboard`);

  const safeLocale: 'bn' | 'en' = locale === 'en' ? 'en' : 'bn';

  const totals: AdminTotals = await loadAdminTotals();

  return (
    <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-8">
      <Sidebar isAdmin />
      <div className="flex-1 space-y-6">
        <AdminStatsCard totals={totals} locale={safeLocale} />
        {children}
      </div>
    </div>
  );
}

/**
 * Single-roundtrip totals fetch scoped to the dashboard stat cards.
 * Avoids the full CSV / per-purpose payload of /api/admin/reports — that
 * endpoint is for the Reports page and we don't want to pay that cost on
 * every admin navigation.
 */
async function loadAdminTotals(): Promise<AdminTotals> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  try {
    const [statusAgg, donorCount, todayAgg, totalUsers] = await Promise.all([
      prisma.donation.groupBy({
        by: ['status'],
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.donation.findMany({
        where: { status: 'SUCCESS', userId: { not: null } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      prisma.donation.aggregate({
        where: { status: 'SUCCESS', createdAt: { gte: startOfToday } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.user.count({ where: { deletedAt: null } }),
    ]);

    const totalRaised = statusAgg.reduce(
      // Prisma.Decimal is required at runtime; the import-free form keeps
      // this helper independent of the lib's full Decimal surface.
      (acc: number, s: { _sum: { amount: unknown } }) => {
        const v = s._sum.amount;
        return acc + (typeof v === 'string' || typeof v === 'number' ? Number(v) : 0);
      },
      0
    );
    const totalDonations = statusAgg.reduce(
      (acc: number, s: { _count: { _all: number } }) => acc + s._count._all,
      0
    );

    return {
      totalRaised: totalRaised.toString(),
      totalDonations,
      totalDonors: donorCount.length,
      totalUsers,
      todayTotal: (() => {
        const v = todayAgg._sum.amount;
        return (typeof v === 'string' || typeof v === 'number' ? Number(v) : 0).toString();
      })(),
      todayCount: todayAgg._count._all,
    };
  } catch {
    return {
      totalRaised: '0',
      totalDonations: 0,
      totalDonors: 0,
      totalUsers: 0,
      todayTotal: '0',
      todayCount: 0,
    };
  }
}
