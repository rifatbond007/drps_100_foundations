import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** The page's headline and first call to action, right under the image-only hero. */
export function Intro({ locale }: { locale: string }) {
  const t = useTranslations('landing');
  return (
    <section className="container pt-12 sm:pt-16">
      <div className="grid gap-8 border-y py-12 sm:py-16 lg:grid-cols-[3fr_2fr] lg:items-end lg:gap-16">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            {t('introEyebrow')}
          </p>
          <h1 className="mt-4 text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            {t('heroTitle')}
            <span className="text-primary">{t('heroTitleHighlight')}</span>
          </h1>
        </div>
        <div>
          <p className="text-lg text-muted-foreground sm:text-xl">{t('introBody')}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link href={`/${locale}/donate`}>
                {t('donateCta')}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="rounded-full">
              <a href="#how-it-works">
                {t('introHowLink')}
                <ArrowDown aria-hidden />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
