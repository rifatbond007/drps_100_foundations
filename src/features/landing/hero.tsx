import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, CircleCheck, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PublicStats } from '@/lib/stats';
import type { AppLocale } from '@/lib/format';
import { HeroMosaic } from './hero-mosaic';
import { HeroStats } from './hero-stats';

export function Hero({ stats, locale }: { stats: PublicStats | null; locale: AppLocale }) {
  const t = useTranslations('landing');
  const trust = ['heroTrust1', 'heroTrust2', 'heroTrust3'] as const;

  return (
    <section className="relative overflow-hidden pb-4 pt-8 sm:pb-8 md:pt-6">
      <div className="container">
        {/* Phones: the collage is a band above the text. */}
        <HeroMosaic className="mx-auto mb-8 w-full max-w-md md:hidden" />

        <div className="relative md:flex md:min-h-[clamp(460px,38vw,560px)] md:items-center md:justify-center">
          {/* Tablet and up: the headline sits in the collage's open centre. */}
          <HeroMosaic
            hollow
            className="pointer-events-none absolute left-1/2 top-1/2 hidden w-[min(1240px,112%)] -translate-x-1/2 -translate-y-1/2 md:grid"
          />
          <div className="relative mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
              <HeartHandshake className="size-4 text-primary" aria-hidden />
              {t('heroEyebrow')}
            </span>
            <h1 className="mt-6 text-balance text-4xl font-bold sm:text-5xl lg:text-6xl">
              {t('heroTitle')}
              <span className="text-primary">{t('heroTitleHighlight')}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
              {t('heroSubtitle')}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href={`/${locale}/donate`}>
                  {t('donateCta')}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#how-it-works">{t('howItWorksCta')}</a>
              </Button>
            </div>
            <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2">
              {trust.map((key) => (
                <li key={key} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CircleCheck className="size-4 text-primary" aria-hidden />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {stats && (
          <div className="relative mt-10 md:-mt-6">
            <HeroStats stats={stats} locale={locale} />
          </div>
        )}
      </div>
    </section>
  );
}
