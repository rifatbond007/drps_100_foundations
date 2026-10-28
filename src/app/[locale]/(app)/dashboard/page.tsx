'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Clock, HandHeart, Receipt, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadError } from '@/components/ui/load-error';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { DonationList } from '@/features/donation/donation-list';
import { useDonationHistory } from '@/hooks/use-donations';
import { useProfile } from '@/hooks/use-profile';
import { formatBDT, formatNumber, toAppLocale } from '@/lib/format';

export default function DashboardPage() {
  const locale = toAppLocale(useLocale());
  const t = useTranslations('dashboard');
  const { data: session } = useSession();
  const profile = useProfile();
  const recent = useDonationHistory({ limit: 5 });
  const isAdmin = session?.user?.role === 'ADMIN';
  const firstName = (profile.data?.name ?? session?.user?.name ?? '').split(' ')[0];

  return (
    <>
      <PageHeader
        title={firstName ? t('greeting', { name: firstName }) : t('title')}
        description={t('subtitle')}
        actions={
          !isAdmin && (
            <Button asChild>
              <Link href={`/${locale}/donate`}>
                <HandHeart aria-hidden />
                {t('donateCta')}
              </Link>
            </Button>
          )
        }
      />

      {profile.isError ? (
        <LoadError message={t('loadFailed')} onRetry={() => void profile.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={Wallet}
            label={t('totalDonated')}
            value={profile.data && formatBDT(profile.data.totalDonated, locale)}
            hint={t('approvedHint')}
            loading={profile.isLoading}
          />
          <StatCard
            icon={Receipt}
            label={t('donationCount')}
            value={profile.data && formatNumber(profile.data.donationCount, locale)}
            hint={t('approvedHint')}
            loading={profile.isLoading}
          />
          <StatCard
            icon={Clock}
            label={t('pendingDonations')}
            value={profile.data && formatNumber(profile.data.pendingCount, locale)}
            hint={t('pendingHint')}
            loading={profile.isLoading}
          />
        </div>
      )}

      {!isAdmin && (
        <div className="mt-6 flex flex-col gap-4 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 text-white shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold">{t('donateAgainTitle')}</p>
            <p className="mt-1 text-sm text-white/80">{t('donateAgainBody')}</p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-transparent bg-white text-emerald-800 hover:bg-white/90"
          >
            <Link href={`/${locale}/donate`}>
              {t('donateCta')}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      )}

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('recentDonations')}</h2>
          <Link href={`/${locale}/history`} className="text-sm font-semibold text-primary">
            {t('viewAllDonations')}
          </Link>
        </div>
        {recent.isLoading ? (
          <Skeleton className="h-48 w-full rounded-lg" />
        ) : recent.isError ? (
          <LoadError message={t('loadFailed')} onRetry={() => void recent.refetch()} />
        ) : recent.data && recent.data.donations.length > 0 ? (
          <DonationList items={recent.data.donations} locale={locale} />
        ) : (
          <EmptyState icon={HandHeart} title={t('emptyTitle')} description={t('emptyBody')} />
        )}
      </section>
    </>
  );
}
