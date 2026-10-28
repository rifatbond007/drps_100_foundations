import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowRight, Plus } from 'lucide-react';
import { SectionHeading } from './section-heading';
import { Tilt } from './tilt';

// Placeholder portraits — replace the files in public/images/people/.
const PEOPLE = [1, 2, 3] as const;

/** Profile cards for the committee, closing with an invitation to join it. */
export function People({ locale }: { locale: string }) {
  const t = useTranslations('landing');
  return (
    <section className="container py-20 sm:py-28">
      <SectionHeading
        eyebrow={t('peopleEyebrow')}
        title={t('peopleTitle')}
        lead={t('peopleLead')}
      />
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PEOPLE.map((n) => (
          <li key={n} className="flex">
            <Tilt
              max={6}
              className="group flex flex-1 flex-col items-center overflow-hidden rounded-2xl border bg-card px-6 pb-8 text-center shadow-card hover:shadow-lift"
            >
              {/* Banner the portrait overlaps. */}
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-primary-soft to-primary/20"
              />
              <div className="relative mt-10 size-32 overflow-hidden rounded-full bg-primary-soft outline outline-2 outline-offset-4 outline-transparent ring-4 ring-card transition-[outline-color] group-hover:outline-primary/50">
                <Image
                  src={`/images/people/portrait-${n}.svg`}
                  alt={t(`people${n}Name`)}
                  fill
                  sizes="128px"
                  // Scaled up so the placeholder's own paper frame stays out of the circle.
                  className="scale-125 object-cover object-[50%_35%]"
                />
              </div>
              <h3 className="mt-6 text-lg font-semibold">{t(`people${n}Name`)}</h3>
              <p className="mt-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-soft-foreground">
                {t(`people${n}Role`)}
              </p>
              <p className="mt-4 text-sm text-muted-foreground">{t(`people${n}Desc`)}</p>
            </Tilt>
          </li>
        ))}
        <li>
          <Link
            href={`/${locale}/alumni`}
            className="group flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors hover:border-primary/60 hover:bg-primary-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Plus className="size-7" aria-hidden />
            </span>
            <h3 className="mt-6 text-lg font-semibold">{t('peopleJoinTitle')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{t('peopleJoinBody')}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              {t('involved3Title')}
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
