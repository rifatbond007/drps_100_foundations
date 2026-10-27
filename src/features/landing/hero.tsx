import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PublicStats } from '@/lib/stats';
import type { AppLocale } from '@/lib/format';
import { HeroMosaic } from './hero-mosaic';
import { HeroStats } from './hero-stats';

export function Hero({ stats, locale }: { stats: PublicStats | null; locale: AppLocale }) {
  const t = useTranslations('landing');

  return (
    <section className="relative overflow-hidden pb-4 pt-8 sm:pb-8 md:pt-4">
      <div className="container">
        {/* Phones: the collage is a band above the text. */}
        <HeroMosaic className="mx-auto mb-8 w-full max-w-md md:hidden" />

        <div className="relative md:flex md:min-h-[clamp(420px,36vw,520px)] md:items-center md:justify-center">
          {/* Tablet and up: the headline sits in the collage's open centre. */}
          <HeroMosaic
            hollow
            className="absolute left-1/2 top-1/2 hidden w-[min(1240px,112%)] -translate-x-1/2 -translate-y-1/2 md:grid"
          />
          <div className="relative mx-auto max-w-md text-center lg:max-w-lg">
            <h1 className="text-balance text-4xl font-bold sm:text-5xl">
              {t('heroTitle')}
              <span className="text-primary">{t('heroTitleHighlight')}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-muted-foreground sm:text-lg">
              {t('heroSubtitle')}
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
              <Button asChild size="lg">
                <Link href={`/${locale}/donate`}>
                  {t('donateCta')}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
              <a
                href="#how-it-works"
                className="text-sm font-semibold text-foreground underline-offset-4 hover:underline"
              >
                {t('howItWorksCta')}
              </a>
            </div>
          </div>
        </div>

        {stats && (
          <div className="relative mt-10 md:mt-2">
            <HeroStats stats={stats} locale={locale} />
          </div>
        )}
      </div>
    </section>
  );
}
