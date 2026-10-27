import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CtaBanner({ locale }: { locale: string }) {
  const t = useTranslations('landing');
  return (
    <section className="container pb-8 pt-4">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 py-12 text-center text-white shadow-lift sm:px-12 sm:py-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-20 size-64 rounded-full bg-white/10 blur-2xl"
        />
        <h2 className="relative mx-auto max-w-2xl text-balance text-3xl font-bold sm:text-4xl">
          {t('ctaTitle')}
        </h2>
        <p className="relative mt-3 text-lg text-white/80">{t('ctaBody')}</p>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="relative mt-8 border-transparent bg-white text-emerald-800 hover:bg-white/90"
        >
          <Link href={`/${locale}/donate`}>
            {t('donateCta')}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
