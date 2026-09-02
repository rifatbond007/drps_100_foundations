/**
 * Authenticated dashboard.
 *
 * Composition: a single "আপনার অনুদান" panel that lists the user's
 * recent donations as a register. No three stat cards above it — the
 * amount-total goes at the top of the list as a single line of type,
 * not a card. The page reads as one continuous log rather than as
 * three widget cards + one list card stacked on each other.
 */
'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/lib/hooks/use-profile';
import { useDonationHistory } from '@/lib/hooks/use-donations';
import { useAuth } from '@/lib/hooks/use-auth';
import { formatBDT } from '@/lib/utils';
import { cn } from '@/lib/utils';

function StatusLabel({ status }: { status: string }) {
  const tHistory = useTranslations('history');
  return <span>{tHistory(`status.${status}`)}</span>;
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
  const total = donations.reduce(
    (sum, d) => sum + (d.status === 'SUCCESS' ? Number(d.amount) : 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('greeting', { name: displayName || '' })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      {/* Total + count as a single line of type, not a card. */}
      <div className="flex items-baseline justify-between border-y border-border py-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t('totalDonated')}
        </p>
        {profileLoading ? (
          <span className="text-2xl font-bold tabular-nums text-muted-foreground">—</span>
        ) : (
          <span className="text-3xl font-bold tabular-nums text-foreground">
            {formatBDT(String(total), localePref)}
          </span>
        )}
      </div>

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
