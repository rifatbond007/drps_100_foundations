import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowRight, GraduationCap, HeartPulse, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about' });
  return { title: t('title') };
}

const PILLARS = [
  { n: 1, icon: GraduationCap },
  { n: 2, icon: HeartPulse },
  { n: 3, icon: LifeBuoy },
] as const;

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'about' });
  const tLanding = await getTranslations({ locale, namespace: 'landing' });

  return (
    <>
      <section className="bg-[radial-gradient(60%_60%_at_50%_0%,hsl(var(--primary)/0.1),transparent)]">
        <div className="container max-w-3xl py-16 text-center sm:py-24">
          <h1 className="text-balance text-4xl font-bold sm:text-5xl">{t('title')}</h1>
          <p className="mt-5 text-balance text-lg text-muted-foreground">{t('subtitle')}</p>
        </div>
      </section>

      <section className="container grid max-w-5xl gap-10 pb-16 lg:grid-cols-[1fr_1.2fr]">
        <h2 className="text-2xl font-bold sm:text-3xl">{t('storyTitle')}</h2>
        <div className="space-y-4 text-lg text-muted-foreground">
          <p>{t('body1')}</p>
          <p>{t('body2')}</p>
        </div>
      </section>

      <section className="container max-w-5xl pb-16">
        <ul className="grid gap-5 sm:grid-cols-3">
          {PILLARS.map(({ n, icon: Icon }) => (
            <li key={n} className="rounded-lg border bg-card p-6 shadow-card">
              <span className="flex size-12 items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{t(`pillar${n}Title`)}</h3>
              <p className="mt-1.5 text-muted-foreground">{t(`pillar${n}Body`)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container max-w-5xl pb-8">
        <div className="flex flex-col items-start gap-5 rounded-xl bg-primary-soft p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <h2 className="text-2xl font-bold">{t('ctaTitle')}</h2>
            <p className="mt-1.5 text-muted-foreground">{t('ctaBody')}</p>
          </div>
          <Button asChild size="lg">
            <Link href={`/${locale}/donate`}>
              {tLanding('donateCta')}
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
