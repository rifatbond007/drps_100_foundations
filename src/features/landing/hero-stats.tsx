'use client';

import { useTranslations } from 'next-intl';
import type { PublicStats } from '@/lib/stats';
import { formatBDT, formatNumber, type AppLocale } from '@/lib/format';
import { CountUp } from './count-up';

interface HeroStatsProps {
  stats: PublicStats | null;
  locale: AppLocale;
}

/** Live totals strip under the hero. Renders nothing when stats are unavailable. */
export function HeroStats({ stats, locale }: HeroStatsProps) {
  const t = useTranslations('landing');
  if (!stats) return null;

  return (
    <div className="mx-auto w-full max-w-3xl rounded-xl border bg-card/90 shadow-lift backdrop-blur">
      <dl className="grid divide-y sm:grid-cols-[1.4fr_1fr_1fr] sm:divide-x sm:divide-y-0">
        <div className="px-6 py-5 text-center sm:text-left">
          <dt className="text-sm text-muted-foreground">{t('heroStatsTitle')}</dt>
          <dd
            data-testid="hero-total"
            className="tabular mt-1 text-3xl font-bold text-primary sm:text-4xl"
          >
            <CountUp value={Number(stats.totalRaised)} format={(n) => formatBDT(n, locale)} />
          </dd>
        </div>
        <div className="px-6 py-5 text-center sm:text-left">
          <dt className="text-sm text-muted-foreground">{t('statDonors')}</dt>
          <dd className="tabular mt-1 text-2xl font-bold">
            {formatNumber(stats.donorCount, locale)}
          </dd>
        </div>
        <div className="px-6 py-5 text-center sm:text-left">
          <dt className="text-sm text-muted-foreground">{t('statDonations')}</dt>
          <dd className="tabular mt-1 text-2xl font-bold">
            {formatNumber(stats.donationCount, locale)}
          </dd>
        </div>
      </dl>
      <p className="border-t px-6 py-2.5 text-center text-xs text-muted-foreground">
        {t('heroStatsNote')}
      </p>
    </div>
  );
}
