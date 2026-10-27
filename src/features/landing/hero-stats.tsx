'use client';

import { useTranslations } from 'next-intl';
import { TrendingUp } from 'lucide-react';
import type { PublicStats } from '@/lib/stats';
import { formatBDT, formatNumber, type AppLocale } from '@/lib/format';
import { CountUp } from './count-up';

interface HeroStatsProps {
  stats: PublicStats | null;
  locale: AppLocale;
}

/** The live total card. Renders nothing numeric when stats are unavailable. */
export function HeroStats({ stats, locale }: HeroStatsProps) {
  const t = useTranslations('landing');
  if (!stats) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-6 shadow-lift sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-2xl"
      />
      <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <span className="flex size-7 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground">
          <TrendingUp className="size-4" aria-hidden />
        </span>
        {t('heroStatsTitle')}
      </p>
      <p
        data-testid="hero-total"
        className="tabular mt-3 text-4xl font-bold text-primary sm:text-5xl"
      >
        <CountUp value={Number(stats.totalRaised)} format={(n) => formatBDT(n, locale)} />
      </p>
      <dl className="mt-6 grid grid-cols-2 gap-4 border-t pt-5">
        <div>
          <dt className="sr-only">{t('statDonors')}</dt>
          <dd className="tabular text-2xl font-bold">{formatNumber(stats.donorCount, locale)}</dd>
          <p className="text-sm text-muted-foreground">{t('statDonors')}</p>
        </div>
        <div>
          <dt className="sr-only">{t('statDonations')}</dt>
          <dd className="tabular text-2xl font-bold">
            {formatNumber(stats.donationCount, locale)}
          </dd>
          <p className="text-sm text-muted-foreground">{t('statDonations')}</p>
        </div>
      </dl>
      <p className="mt-5 text-xs text-muted-foreground">{t('heroStatsNote')}</p>
    </div>
  );
}
