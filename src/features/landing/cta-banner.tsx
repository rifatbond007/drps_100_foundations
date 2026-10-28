import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tilt } from './tilt';

export function CtaBanner({ locale }: { locale: string }) {
  const t = useTranslations('landing');
  return (
    <section className="container pb-12 pt-16 sm:pt-20">
      <Tilt
        max={3}
        className="isolate overflow-hidden rounded-2xl px-6 py-16 text-white shadow-lift sm:px-12 sm:py-20 lg:px-16"
      >
        {/* Placeholder (see public/images/landing/README.md) — swap for a photo of the foundation's own work. */}
        <Image
          src="/images/landing/01.jpg"
          alt=""
          fill
          sizes="100vw"
          className="-z-20 object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-950/95 via-emerald-900/85 to-emerald-800/40"
        />
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-balance text-3xl font-bold sm:text-4xl lg:text-5xl">
              {t('ctaTitle')}
            </h2>
            <p className="mt-4 text-lg text-white/80">{t('ctaBody')}</p>
          </div>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="shrink-0 border-transparent bg-white text-emerald-800 hover:bg-white/90"
          >
            <Link href={`/${locale}/donate`}>
              {t('donateCta')}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </Tilt>
    </section>
  );
}
