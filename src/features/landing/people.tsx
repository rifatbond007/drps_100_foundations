import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { SectionHeading } from './section-heading';

// Placeholder portraits — replace the files in public/images/people/.
const PEOPLE = [1, 2, 3] as const;

export function People() {
  const t = useTranslations('landing');
  return (
    <section className="container py-16 sm:py-24">
      <SectionHeading title={t('peopleTitle')} lead={t('peopleLead')} />
      <ul className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
        {PEOPLE.map((n) => (
          <li key={n} className="overflow-hidden rounded-lg border bg-card shadow-card">
            <div className="relative aspect-[4/5] bg-primary-soft">
              <Image
                src={`/images/people/portrait-${n}.svg`}
                alt={t(`people${n}Name`)}
                fill
                sizes="(min-width: 640px) 30vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="p-5">
              <p className="font-semibold">{t(`people${n}Name`)}</p>
              <p className="text-sm text-muted-foreground">{t(`people${n}Role`)}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
