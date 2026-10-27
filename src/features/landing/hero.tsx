import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, CircleCheck, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PublicStats } from '@/lib/stats';
import type { AppLocale } from '@/lib/format';
import { HeroStats } from './hero-stats';

export function Hero({ stats, locale }: { stats: PublicStats | null; locale: AppLocale }) {
  const t = useTranslations('landing');
  const trust = ['heroTrust1', 'heroTrust2', 'heroTrust3'] as const;

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_20%_0%,hsl(var(--primary)/0.12),transparent),radial-gradient(40%_40%_at_90%_20%,hsl(var(--primary)/0.08),transparent)]"
      />
      <div
        className={`container grid items-center gap-12 py-14 sm:py-20 lg:py-24 ${stats ? 'lg:grid-cols-[1.15fr_1fr]' : ''}`}
      >
        <div className={stats ? '' : 'mx-auto max-w-3xl text-center'}>
          <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
            <HeartHandshake className="size-4 text-primary" aria-hidden />
            {t('heroEyebrow')}
          </span>
          <h1 className="mt-6 text-balance text-4xl font-bold sm:text-5xl lg:text-6xl">
            {t('heroTitle')}
            <span className="text-primary">{t('heroTitleHighlight')}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground [.text-center_&]:mx-auto">
            {t('heroSubtitle')}
          </p>
          <div className={`mt-8 flex flex-wrap gap-3 ${stats ? '' : 'justify-center'}`}>
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
          <ul className={`mt-8 flex flex-wrap gap-x-6 gap-y-2 ${stats ? '' : 'justify-center'}`}>
            {trust.map((key) => (
              <li key={key} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CircleCheck className="size-4 text-primary" aria-hidden />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
        {stats && <HeroStats stats={stats} locale={locale} />}
      </div>
    </section>
  );
}
