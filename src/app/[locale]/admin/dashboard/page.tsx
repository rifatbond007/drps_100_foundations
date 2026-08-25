import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Users, BarChart } from 'lucide-react';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { AdminStatsCard, type AdminTotals } from '@/components/admin/AdminStatsCard';
import { prisma } from '@/lib/prisma';

/**
 * /admin/dashboard — landing page for admins.
 *
 * Renders the three stat cards (Total users / Total raised / Today's
 * donations) plus two shortcut cards linking to Users and Reports. The
 * stat cards used to live in the admin layout, but that meant every
 * admin page started with the same totals row — moving them here makes
 * /admin/dashboard the canonical landing view and gives the other admin
 * pages more breathing room.
 */
export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const safeLocale: 'bn' | 'en' = locale === 'en' ? 'en' : 'bn';
  const t = await getTranslations('admin.dashboard');

  const totals: AdminTotals = await loadAdminTotals();

  return (
    <div className="space-y-6">
      <AdminStatsCard totals={totals} locale={safeLocale} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={`/${locale}/admin/users`}
          className="group rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base group-hover:underline">{t('manageUsers')}</CardTitle>
              <CardDescription className="text-xs">{t('manageUsersDesc')}</CardDescription>
            </div>
          </div>
        </Link>

        <Link
          href={`/${locale}/admin/reports`}
          className="group rounded-lg border bg-card p-5 transition-colors hover:bg-accent"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BarChart className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base group-hover:underline">{t('viewReports')}</CardTitle>
              <CardDescription className="text-xs">{t('viewReportsDesc')}</CardDescription>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

// Local helpers below mirror AdminLayout's loadAdminTotals so the
// dashboard is self-contained when navigated to directly (the layout
// helper isn't exported). Keep them in sync with the layout file.

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

    const totalRaised = statusAgg.reduce((acc: number, s: { _sum: { amount: unknown } }) => {
      const v = s._sum.amount;
      return acc + (typeof v === 'string' || typeof v === 'number' ? Number(v) : 0);
    }, 0);
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
