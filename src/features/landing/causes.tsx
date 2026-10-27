import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { CAUSES } from '@/lib/config/causes';
import { formatBDT, type AppLocale } from '@/lib/format';
import type { PublicStats } from '@/lib/stats';
import { HeroStats } from './hero-stats';
import { SectionHeading } from './section-heading';

interface CausesProps {
  stats: PublicStats | null;
  locale: AppLocale;
}

export function CauseCards({ stats, locale }: CausesProps) {
  const t = useTranslations('landing');
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {CAUSES.map(({ purpose, icon: Icon, goal, nameKey, descKey }) => {
        const raised = stats ? Number(stats.byPurpose[purpose] ?? 0) : null;
        return (
          <article
            key={purpose}
            className="group flex flex-col rounded-lg border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-lift"
          >
            <span className="flex size-12 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
              <Icon className="size-6" aria-hidden />
            </span>
            <h3 className="mt-5 text-lg font-semibold">{t(nameKey)}</h3>
            <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{t(descKey)}</p>
            {raised !== null && (
              <div className="mt-5">
                <p className="tabular text-sm">
                  <span className="font-bold text-foreground">{formatBDT(raised, locale)}</span>{' '}
                  <span className="text-muted-foreground">{t('causeRaised')}</span>
                </p>
                <Progress value={(raised / goal) * 100} label={t(nameKey)} className="mt-2" />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {t('causeGoal', { goal: formatBDT(goal, locale) })}
                </p>
              </div>
            )}
            <Link
              href={`/${locale}/donate?purpose=${purpose}`}
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
            >
              {t('causeDonate')}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </article>
        );
      })}
    </div>
  );
}

export function Causes(props: CausesProps) {
  const t = useTranslations('landing');
  return (
    <section id="causes" className="container scroll-mt-20 py-16 sm:py-24">
      <SectionHeading title={t('causesTitle')} lead={t('causesLead')} />
      {/* Live totals (hidden when unavailable), then the per-fund breakdown. */}
      {props.stats && (
        <div className="mb-10">
          <HeroStats stats={props.stats} locale={props.locale} />
        </div>
      )}
      <CauseCards {...props} />
    </section>
  );
}
