import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Quote } from 'lucide-react';

/** Full-width photo with the foundation's story set over it. */
export function Stories() {
  const t = useTranslations('landing');
  return (
    <section className="container py-20 sm:py-28">
      <figure className="relative isolate flex min-h-[34rem] items-end overflow-hidden rounded-2xl text-white shadow-lift lg:items-center">
        {/* Placeholder (see public/images/landing/README.md) — swap for a photo of the foundation's own work. */}
        <Image
          src="/images/landing/06.jpg"
          alt=""
          fill
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/60 to-black/10 lg:bg-gradient-to-r lg:from-black/90 lg:via-black/60 lg:to-transparent"
        />
        <div className="max-w-2xl p-8 sm:p-12 lg:p-16">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-300">
            {t('storiesTitle')}
          </p>
          <Quote className="mt-6 size-10 text-emerald-300/70" aria-hidden />
          <blockquote className="mt-4 text-balance text-2xl font-semibold leading-snug sm:text-3xl lg:text-4xl">
            {t('storyQuote')}
          </blockquote>
          <figcaption className="mt-4 text-sm text-white/70">— {t('storyAttribution')}</figcaption>
          <p className="mt-8 max-w-xl border-l-2 border-emerald-400/60 pl-4 text-white/80">
            {t('storyBody')}
          </p>
        </div>
      </figure>
    </section>
  );
}
