import { useTranslations } from 'next-intl';
import { EVENTS, eventStatus } from '@/lib/config/events';
import { formatDate, type AppLocale } from '@/lib/format';
import { EventsDeck, type EventTicket } from './events-deck';
import { SectionHeading } from './section-heading';

export function Events({ locale }: { locale: AppLocale }) {
  const t = useTranslations('landing');
  const items: EventTicket[] = EVENTS.map(({ n, date }) => {
    const status = eventStatus(date);
    return {
      id: n,
      status,
      statusLabel: t(`eventStatus_${status}`),
      day: date ? formatDate(date, locale, { day: 'numeric' }) : '—',
      month: date ? formatDate(date, locale, { month: 'short', year: 'numeric' }) : '',
      title: t(`event${n}Title`),
      location: t(`event${n}Location`),
    };
  });

  return (
    <section id="events" className="relative scroll-mt-20 overflow-hidden py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-1/2 size-[36rem] -translate-y-1/2 translate-x-1/4 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="container relative grid gap-12 lg:grid-cols-[2fr_3fr] lg:items-center lg:gap-20">
        <SectionHeading
          eyebrow={t('eventsEyebrow')}
          title={t('eventsTitle')}
          lead={t('eventsLead')}
          className="mb-0 sm:mb-0"
        />
        <EventsDeck
          items={items}
          labels={{ region: t('eventsTitle'), prev: t('eventsPrev'), next: t('eventsNext') }}
        />
      </div>
    </section>
  );
}
