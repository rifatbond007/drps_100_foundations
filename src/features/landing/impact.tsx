import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import type { DonationPurpose } from '@prisma/client';
import { causeFor } from '@/lib/config/causes';
import { formatBDT, type AppLocale } from '@/lib/format';
import { cn } from '@/lib/utils';
import { SectionHeading } from './section-heading';
import { Tilt } from './tilt';

/**
 * Example gift sizes and what each covers. Illustrative placeholder
 * amounts — confirm with the treasurer before launch.
 */
const EXAMPLES: ReadonlyArray<{ n: number; amount: number; purpose: DonationPurpose }> = [
  { n: 1, amount: 500, purpose: 'EDUCATION' },
  { n: 2, amount: 2000, purpose: 'MEDICAL' },
  { n: 3, amount: 5000, purpose: 'EMERGENCY' },
];

export function Impact({ locale }: { locale: AppLocale }) {
  const t = useTranslations('landing');
  return (
    <section className="container py-20 sm:py-28">
      <SectionHeading
        eyebrow={t('impactEyebrow')}
        title={t('impactTitle')}
        lead={t('impactLead')}
      />
      <ul className="grid gap-4 md:grid-cols-3">
        {EXAMPLES.map(({ n, amount, purpose }) => {
          const { icon: Icon, nameKey } = causeFor(purpose);
          // The middle example is the visual anchor of the row.
          const featured = n === 2;
          return (
            <li key={n} className="flex">
              <Tilt
                className={cn(
                  'group flex flex-1 flex-col overflow-hidden rounded-xl border p-7 shadow-card hover:shadow-lift sm:p-8',
                  featured ? 'border-emerald-400/30 bg-[hsl(162_45%_9%)] text-white' : 'bg-card'
                )}
              >
                <Icon
                  aria-hidden
                  className={cn(
                    'absolute -right-6 -top-6 size-32 rotate-12',
                    featured ? 'text-white/[0.06]' : 'text-primary/[0.07]'
                  )}
                />
                <p
                  className={cn(
                    'tabular text-5xl font-bold tracking-tight sm:text-6xl',
                    featured ? 'text-emerald-300' : 'text-primary'
                  )}
                >
                  {formatBDT(amount, locale)}
                </p>
                <p className="mt-5 flex-1 text-lg font-medium leading-snug">{t(`impact${n}`)}</p>
                <Link
                  href={`/${locale}/donate?purpose=${purpose}`}
                  className={cn(
                    'mt-8 inline-flex items-center gap-1.5 text-sm font-semibold',
                    featured ? 'text-emerald-300' : 'text-primary'
                  )}
                >
                  {t('impactGive', { fund: t(nameKey) })}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              </Tilt>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-sm text-muted-foreground">{t('impactNote')}</p>
    </section>
  );
}
