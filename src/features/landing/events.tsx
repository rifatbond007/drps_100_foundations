import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EVENTS, eventStatus } from '@/lib/config/events';
import { formatDate, type AppLocale } from '@/lib/format';
import { cn } from '@/lib/utils';
import { SectionHeading } from './section-heading';

const STATUS_VARIANT = { upcoming: 'primary', past: 'neutral', tba: 'warning' } as const;

export function Events({ locale }: { locale: AppLocale }) {
  const t = useTranslations('landing');
  return (
    <section className="bg-muted/50 py-16 sm:py-24">
      <div className="container">
        <SectionHeading title={t('eventsTitle')} lead={t('eventsLead')} />
        <ul className="grid gap-4 md:grid-cols-2">
          {EVENTS.map(({ n, date }) => {
            const status = eventStatus(date);
            const day = date ? formatDate(date, locale, { day: 'numeric' }) : '—';
            const month = date ? formatDate(date, locale, { month: 'short', year: 'numeric' }) : '';
            return (
              <li
                key={n}
                className={cn(
                  'flex items-center gap-5 rounded-lg border bg-card p-5 shadow-card',
                  status === 'past' && 'opacity-75'
                )}
              >
                <div className="flex size-16 shrink-0 flex-col items-center justify-center rounded-md bg-primary-soft text-primary-soft-foreground">
                  <span className="tabular text-2xl font-bold leading-none">{day}</span>
                  <span className="mt-1 text-[11px] font-medium leading-none">{month}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <Badge variant={STATUS_VARIANT[status]}>{t(`eventStatus_${status}`)}</Badge>
                  <p className="mt-1.5 font-semibold">{t(`event${n}Title`)}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                    {t(`event${n}Location`)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
