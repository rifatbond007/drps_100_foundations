import { useTranslations } from 'next-intl';
import { HeroCollage } from './hero-collage';
import { Wordmark } from './wordmark';

/**
 * Image-only hero filling the first screen: the community collage, as large
 * as the viewport allows, over an outlined drps100 wordmark.
 */
export function Hero() {
  const t = useTranslations('landing');
  return (
    <section className="flex min-h-[calc(100svh-4rem)] flex-col overflow-x-clip pb-6 pt-4 sm:pb-8 sm:pt-6">
      {/* The page still needs one heading for screen readers and search. */}
      <h1 className="sr-only">
        {t('heroTitle')}
        {t('heroTitleHighlight')}
      </h1>
      <div className="container flex flex-1 flex-col gap-5 sm:gap-8">
        {/* Largest collage that fits beside the wordmark in one screen:
            viewport height minus header (4rem), padding + gap (~6rem) and
            the wordmark's own height, converted to width by the grid ratio. */}
        {/* Phones: wider than the screen (edges cropped) so faces stay readable. */}
        <div className="flex flex-1 items-center justify-center">
          <HeroCollage
            className="mx-auto w-[150vw] max-w-none shrink-0 sm:w-[var(--collage-w)] sm:max-w-full"
            style={
              {
                '--collage-w': 'calc((100svh - 10rem - clamp(56px, 13svh, 150px)) * 424 / 228)',
              } as React.CSSProperties
            }
          />
        </div>
        <Wordmark className="mx-auto h-[clamp(56px,13svh,150px)] w-full" />
      </div>
    </section>
  );
}
