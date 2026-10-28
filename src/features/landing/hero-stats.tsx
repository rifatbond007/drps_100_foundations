'use client';

import { useTranslations } from 'next-intl';
import type { PublicStats } from '@/lib/stats';
import { formatBDT, formatNumber, type AppLocale } from '@/lib/format';
import { CountUp } from './count-up';

interface HeroStatsProps {
  stats: PublicStats | null;
  locale: AppLocale;
}

/** Live totals strip beside the causes heading. Renders nothing when stats are unavailable. */
export function HeroStats({ stats, locale }: HeroStatsProps) {
  const t = useTranslations('landing');
  if (!stats) return null;

  return (
    <div className="shrink-0">
      <dl className="flex flex-wrap gap-x-10 gap-y-4">
        <div>
          <dt className="text-sm text-muted-foreground">{t('heroStatsTitle')}</dt>
          <dd
            data-testid="hero-total"
            className="tabular mt-1 text-3xl font-bold text-primary sm:text-4xl"
          >
            <CountUp value={Number(stats.totalRaised)} format={(n) => formatBDT(n, locale)} />
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">{t('statDonors')}</dt>
          <dd className="tabular mt-1 text-3xl font-bold sm:text-4xl">
            {formatNumber(stats.donorCount, locale)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">{t('statDonations')}</dt>
          <dd className="tabular mt-1 text-3xl font-bold sm:text-4xl">
            {formatNumber(stats.donationCount, locale)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">{t('heroStatsNote')}</p>
    </div>
  );
}
