import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Quote } from 'lucide-react';

export function Stories() {
  const t = useTranslations('landing');
  return (
    <section className="container py-16 sm:py-24">
      <div className="grid overflow-hidden rounded-xl border bg-card shadow-card lg:grid-cols-2">
        <div className="relative min-h-64 bg-primary-soft">
          {/* Placeholder — replace public/images/stories/story-placeholder.svg with a real photo. */}
          <Image
            src="/images/stories/story-placeholder.svg"
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {t('storiesTitle')}
          </p>
          <Quote className="mt-5 size-8 text-primary/40" aria-hidden />
          <blockquote className="mt-3 text-balance text-xl font-semibold sm:text-2xl">
            {t('storyQuote')}
          </blockquote>
          <p className="mt-3 text-sm text-muted-foreground">— {t('storyAttribution')}</p>
          <p className="mt-6 text-muted-foreground">{t('storyBody')}</p>
        </div>
      </div>
    </section>
  );
}
