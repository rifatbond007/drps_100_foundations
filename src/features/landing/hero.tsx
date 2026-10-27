import { useTranslations } from 'next-intl';
import { HeroCollage } from './hero-collage';
import { Wordmark } from './wordmark';

/** Image-only hero: the community collage over an outlined DRPS100 wordmark. */
export function Hero() {
  const t = useTranslations('landing');
  return (
    <section className="overflow-hidden pt-8 sm:pt-12">
      {/* The page still needs one heading for screen readers and search. */}
      <h1 className="sr-only">
        {t('heroTitle')}
        {t('heroTitleHighlight')}
      </h1>
      <div className="container">
        <HeroCollage className="mx-auto max-w-[860px]" />
        <Wordmark text="DRPS100" className="mt-6 text-foreground/30 sm:mt-8" />
      </div>
    </section>
  );
}
