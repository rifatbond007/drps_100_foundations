import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowUpRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { CAUSES } from '@/lib/config/causes';
import { formatBDT, type AppLocale } from '@/lib/format';
import type { PublicStats } from '@/lib/stats';
import { cn } from '@/lib/utils';
import { HeroStats } from './hero-stats';
import { SectionHeading } from './section-heading';
import { Tilt } from './tilt';

interface CausesProps {
  stats: PublicStats | null;
  locale: AppLocale;
}

/** Bento placement per card: the first (general fund) is the large feature tile. */
const TILE = [
  'sm:col-span-2 lg:row-span-2 min-h-[26rem]',
  'sm:col-span-2 min-h-[20rem]',
  'min-h-[20rem]',
  'min-h-[20rem]',
];

export function CauseCards({ stats, locale }: CausesProps) {
  const t = useTranslations('landing');
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
      {CAUSES.map(({ purpose, icon: Icon, goal, image, nameKey, descKey }, i) => {
        const raised = stats ? Number(stats.byPurpose[purpose] ?? 0) : null;
        const featured = i === 0;
        return (
          <Tilt key={purpose} max={6} className={cn('flex flex-col rounded-xl', TILE[i])}>
            <Link
              href={`/${locale}/donate?purpose=${purpose}`}
              className={cn(
                'group relative isolate flex flex-1 flex-col justify-end overflow-hidden rounded-xl bg-muted p-6 text-white shadow-card transition-shadow hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-7'
              )}
            >
              <Image
                src={image}
                alt=""
                fill
                sizes={
                  featured
                    ? '(min-width: 1024px) 50vw, 100vw'
                    : '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw'
                }
                className="-z-20 object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
              />
              {/* Scrim: keeps white text readable over any photo. */}
              <div
                aria-hidden
                className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/40 to-black/5"
              />

              <span className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-md transition-colors group-hover:bg-white group-hover:text-foreground">
                <ArrowUpRight className="size-5" aria-hidden />
              </span>

              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-md">
                <Icon className="size-3.5" aria-hidden />
                {t(nameKey)}
              </span>
              <h3
                className={cn(
                  'mt-3 text-balance font-bold leading-tight',
                  featured ? 'text-3xl sm:text-4xl' : 'text-xl'
                )}
              >
                {t(descKey)}
              </h3>

              {raised !== null && (
                <div className={cn('mt-5', featured && 'max-w-md')}>
                  <div className="tabular flex items-baseline justify-between gap-3 text-sm">
                    <p>
                      <span className="font-bold">{formatBDT(raised, locale)}</span>{' '}
                      <span className="text-white/70">{t('causeRaised')}</span>
                    </p>
                    <p className="text-xs text-white/70">
                      {t('causeGoal', { goal: formatBDT(goal, locale) })}
                    </p>
                  </div>
                  <Progress
                    value={(raised / goal) * 100}
                    label={t(nameKey)}
                    className="mt-2 h-1.5 bg-white/20"
                  />
                </div>
              )}

              <span className="mt-5 text-sm font-semibold underline-offset-4 group-hover:underline">
                {t('causeDonate')}
              </span>
            </Link>
          </Tilt>
        );
      })}
    </div>
  );
}

export function Causes(props: CausesProps) {
  const t = useTranslations('landing');
  return (
    <section id="causes" className="container scroll-mt-20 py-16 sm:py-24">
      <div className="mb-10 flex flex-col gap-8 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow={t('causesEyebrow')}
          title={t('causesTitle')}
          lead={t('causesLead')}
          className="mb-0 max-w-xl sm:mb-0"
        />
        {/* Live totals; renders nothing when unavailable. */}
        <HeroStats stats={props.stats} locale={props.locale} />
      </div>
      <CauseCards {...props} />
    </section>
  );
}
