/**
 * Authenticated dashboard.
 *
 * Four hairline-border cards summarise the donor's account at a glance:
 * total donated (BDT, lifetime successful), donation count, last donation
 * amount + date, and pending donations awaiting bKash confirmation.
 *
 * Each card has the same structure: an uppercase eyebrow label on top,
 * a tabular big number or short value below. Cards are 1-up on mobile
 * and 2-up on small screens, 4-up on lg+. The recent-donations register
 * sits below the cards so the page still tells the story of "what you
 * did" rather than only "what you have."
 */
'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/lib/hooks/use-profile';
import { useDonationHistory } from '@/lib/hooks/use-donations';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatBDT, cn } from '@/lib/utils';

function StatusLabel({ status }: { status: string }) {
  const tHistory = useTranslations('history');
  return <span>{tHistory(`status.${status}`)}</span>;
}

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border border-border bg-background p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 text-xl font-bold tabular-nums text-foreground sm:text-2xl">
        {children}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const locale = useLocale();
  const t = useTranslations('dashboard');
  const tHistory = useTranslations('history');

  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
  const { data: history, isLoading: historyLoading } = useDonationHistory(user?.id);

  if (profileError) {
    return (
      <p
        role="alert"
        className="border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm text-destructive"
      >
        {t('loadFailed')}
      </p>
    );
  }

  const displayName = profile?.name ?? user?.name ?? user?.email ?? '';
  const localePref = (profile?.languagePref.toLowerCase() as 'bn' | 'en') ?? 'bn';

  const donations = history?.donations ?? [];
  const successDonations = donations.filter((d) => d.status === 'SUCCESS');
  const pendingDonations = donations.filter((d) => d.status === 'PENDING');
  const total = successDonations.reduce((sum, d) => sum + Number(d.amount), 0);
  const lastDonation = successDonations[0];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('greeting', { name: displayName || '' })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      {/* Stat cards */}
      <section
        aria-label={t('profileStatsTitle')}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard label={t('totalDonated')}>
          {profileLoading || historyLoading ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            formatBDT(String(total), localePref)
          )}
        </StatCard>

        <StatCard label={t('donationCount')}>
          {historyLoading ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            successDonations.length.toLocaleString(locale === 'en' ? 'en-US' : 'bn-BD')
          )}
        </StatCard>

        <StatCard label={t('lastDonation')}>
          {historyLoading ? (
            <span className="text-muted-foreground">—</span>
          ) : lastDonation ? (
            <div className="flex flex-col">
              <span>{formatBDT(lastDonation.amount, localePref)}</span>
              <span className="mt-1 text-xs font-normal text-muted-foreground">
                {new Date(lastDonation.createdAt).toLocaleDateString(
                  locale === 'en' ? 'en-US' : 'bn-BD'
                )}
              </span>
            </div>
          ) : (
            <span className="text-sm font-normal text-muted-foreground">{t('never')}</span>
          )}
        </StatCard>

        <StatCard label={t('pendingDonations')}>
          {historyLoading ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            <span className="flex items-baseline gap-2">
              <span>
                {pendingDonations.length.toLocaleString(locale === 'en' ? 'en-US' : 'bn-BD')}
              </span>
              {pendingDonations.length > 0 && (
                <span className="text-[10px] font-medium uppercase tracking-wider text-admin">
                  {tHistory('status.PENDING')}
                </span>
              )}
            </span>
          )}
        </StatCard>
      </section>

      {/* Recent donations */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-foreground">{t('recentDonations')}</h2>
          <Link
            href={`/${locale}/history`}
            className="text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {t('viewAllDonations')} →
          </Link>
        </div>

        {historyLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">…</p>
        ) : donations.length === 0 ? (
          <div className="border-t border-border py-8 text-center">
            <p className="text-sm text-muted-foreground">{tHistory('noDonations')}</p>
            <Button asChild size="sm" className="mt-4">
              <Link href={`/${locale}/donate`}>{t('donateCta')}</Link>
            </Button>
          </div>
        ) : (
          <ol className="border-t border-border">
            {donations.slice(0, 5).map((d) => (
              <li
                key={d.id}
                className="flex items-baseline justify-between gap-4 border-b border-border py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {formatBDT(d.amount, localePref)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {tHistory(`purposes.${d.purpose}`)} ·{' '}
                    <span
                      className={cn(
                        d.status === 'SUCCESS' && 'text-primary',
                        d.status === 'FAILED' && 'text-destructive',
                        d.status === 'PENDING' && 'text-admin',
                        d.status === 'CANCELLED' && 'text-muted-foreground'
                      )}
                    >
                      <StatusLabel status={d.status} />
                    </span>
                  </div>
                </div>
                <time className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {new Date(d.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'bn-BD')}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
