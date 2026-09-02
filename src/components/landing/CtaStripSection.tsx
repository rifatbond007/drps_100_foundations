/**
 * Final CTA strip.
 *
 * The page's only emerald surface. One sentence, one button, full
 * bleed. A horizontal hairline at the top and bottom frames it as
 * the conclusion of the page — the place the reader lands when
 * they have read everything above and decided to act.
 */
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';

interface Props {
  locale: string;
}

export async function CtaStripSection({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'landing' });

  return (
    <section className="bg-primary text-primary-foreground">
      <div className="container flex flex-col items-start justify-between gap-8 py-14 sm:flex-row sm:items-center sm:py-20">
        <div className="max-w-2xl">
          <p className="text-balance text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl">
            {t('ctaStripHeadline')}
          </p>
          <p className="mt-3 text-base text-primary-foreground/80 sm:text-lg">
            {t('ctaStripSubtitle')}
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="h-14 shrink-0 bg-background px-10 text-base text-foreground hover:bg-background/90"
        >
          <Link href={`/${locale}/donate`}>{t('donateCta')}</Link>
        </Button>
      </div>
    </section>
  );
}
