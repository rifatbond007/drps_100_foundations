import { useTranslations } from 'next-intl';
import { SectionHeading } from './section-heading';
import { TeamSpotlight } from './team-spotlight';

// Placeholder stock portraits — replace with the real committee (see public/images/people/README.md).
const PEOPLE = [1, 2, 3] as const;

/** The committee: a selectable list beside a spotlight card, plus an invitation to join. */
export function People({ locale }: { locale: string }) {
  const t = useTranslations('landing');
  return (
    <section className="py-20 sm:py-28">
      <div className="container">
        <TeamSpotlight
          heading={
            <SectionHeading
              eyebrow={t('peopleEyebrow')}
              title={t('peopleTitle')}
              lead={t('peopleLead')}
              className="mb-0 sm:mb-0 lg:mb-10"
            />
          }
          members={PEOPLE.map((n) => ({
            name: t(`people${n}Name`),
            role: t(`people${n}Role`),
            desc: t(`people${n}Desc`),
            image: `/images/people/member-${n}.jpg`,
          }))}
          join={{
            title: t('peopleJoinTitle'),
            body: t('peopleJoinBody'),
            cta: t('involved3Title'),
            href: `/${locale}/alumni`,
          }}
        />
      </div>
    </section>
  );
}
