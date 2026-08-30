/**
 * Authenticated dashboard — real data from /api/users/profile +
 * /api/donations/history. Client component because TanStack Query
 * runs in the browser. Auth is guaranteed by the (authenticated)
 * layout (server component) which calls requireAuth() before
 * rendering children.
 */
'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Heart, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { useProfile } from '@/lib/hooks/use-profile';
import { useDonationHistory } from '@/lib/hooks/use-donations';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatBDT } from '@/lib/utils';
import { cn } from '@/lib/utils';

function StatCard({
  title,
  value,
  subtitle,
  loading,
}: {
  title: string;
  value: string;
  subtitle?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <>
            <Skeleton className="mb-2 h-8 w-24" />
            <Skeleton className="h-3 w-16" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const tHistory = useTranslations('history');

  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
  const {
    data: history,
    isLoading: historyLoading,
    error: historyError,
  } = useDonationHistory(user?.id);

  const recentDonations = (history?.donations ?? []).slice(0, 5);

  if (profileError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <Card>
          <CardContent className="py-12 text-center text-destructive">
            {t('loadFailed')}
            <div className="mt-2 text-sm text-muted-foreground">{profileError.message}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = profile?.name ?? user?.name ?? user?.email ?? '';
  const avatarUrl = profile?.avatarUrl ?? user?.image ?? null;
  const email = profile?.email ?? user?.email ?? '';

  return (
    <div className="space-y-6">
      {/* Greeting header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar
            src={avatarUrl}
            name={profile?.name ?? user?.name ?? null}
            email={email}
            size="lg"
          />
          <div>
            {profileLoading ? (
              <>
                <Skeleton className="mb-2 h-8 w-48" />
                <Skeleton className="h-3 w-32" />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold tracking-tight">
                  {t('greeting', { name: displayName || tCommon('appName') })}
                </h1>
                <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
                {email && (
                  <p className="mt-1 text-xs text-muted-foreground">{t('signedInAs', { email })}</p>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/${locale}/settings`}>
              <SettingsIcon className="mr-2 h-4 w-4" />
              {t('editProfile')}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${locale}/donate`}>
              <Heart className="mr-2 h-4 w-4" />
              {t('donateCtaSecondary')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{t('profileStatsTitle')}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title={t('totalDonated')}
            value={formatBDT(
              profile?.totalDonated ?? '0',
              (profile?.languagePref.toLowerCase() as 'bn' | 'en') ?? 'bn'
            )}
            subtitle={t('allTime')}
            loading={profileLoading}
          />
          <StatCard
            title={t('donationCount')}
            value={String(profile?.donationCount ?? 0)}
            subtitle={t('allTime')}
            loading={profileLoading}
          />
          <StatCard
            title={t('lastDonation')}
            value={
              recentDonations[0]
                ? new Date(recentDonations[0].createdAt).toLocaleDateString(
                    profile?.languagePref === 'EN' ? 'en-US' : 'bn-BD'
                  )
                : t('never')
            }
            loading={profileLoading || historyLoading}
          />
        </div>
      </div>

      {/* Recent donations */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">{t('recentDonations')}</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${locale}/history`}>
              <HistoryIcon className="mr-2 h-4 w-4" />
              {t('viewAllDonations')}
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          {historyLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : historyError ? (
            <div className="py-6 text-center text-sm text-destructive">
              {tHistory('loadingFailed', { message: historyError.message })}
            </div>
          ) : recentDonations.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {tHistory('noDonations')}
            </div>
          ) : (
            <ul className="divide-y">
              {recentDonations.map((d) => (
                <li key={d.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-semibold">
                      {formatBDT(
                        d.amount,
                        (profile?.languagePref.toLowerCase() as 'bn' | 'en') ?? 'bn'
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {tHistory(`purposes.${d.purpose}`)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={cn(
                        'text-xs font-medium',
                        d.status === 'SUCCESS' && 'text-green-600',
                        d.status === 'FAILED' && 'text-destructive',
                        d.status === 'PENDING' && 'text-yellow-600',
                        d.status === 'CANCELLED' && 'text-muted-foreground'
                      )}
                    >
                      {tHistory(`status.${d.status}`)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(d.createdAt).toLocaleDateString(
                        profile?.languagePref === 'EN' ? 'en-US' : 'bn-BD'
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
