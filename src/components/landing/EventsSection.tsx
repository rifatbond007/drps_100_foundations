/**
 * Events section — upcoming + past foundation events as a register.
 *
 * Same register language as the Causes section: each row is a hairline
 * row, not a card. Column order on sm+: date · title · location · status.
 *
 * The status column is the section's only chromatic mark. UPCOMING sits
 * in emerald (the foundation's primary); PAST sits in muted foreground;
 * TBA sits in admin mustard (the third reserved colour, signalling
 * "not confirmed yet" — distinct from upcoming and past).
 *
 * No card chrome, no shadows, no "register now" buttons inside the row.
 * The row IS the entry. Status does the storytelling.
 */
import { getTranslations } from 'next-intl/server';

interface Props {
  locale: 'bn' | 'en';
}

type EventStatus = 'upcoming' | 'past' | 'tba';

interface EventItem {
  date: string; // ISO yyyy-mm-dd for sortability
  dateLabel: string; // localised display: "১৪ ডিসে ২০২৬" / "Dec 14, 2026"
  title: string;
  location: string;
  status: EventStatus;
}

export async function EventsSection({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: 'landing' });

  const events: EventItem[] = [
    {
      date: '2026-09-21',
      dateLabel: t('event1Date'),
      title: t('event1Title'),
      location: t('event1Location'),
      status: 'upcoming',
    },
    {
      date: '2026-10-12',
      dateLabel: t('event2Date'),
      title: t('event2Title'),
      location: t('event2Location'),
      status: 'upcoming',
    },
    {
      date: '2026-12-07',
      dateLabel: t('event3Date'),
      title: t('event3Title'),
      location: t('event3Location'),
      status: 'tba',
    },
    {
      date: '2026-08-04',
      dateLabel: t('event4Date'),
      title: t('event4Title'),
      location: t('event4Location'),
      status: 'past',
    },
  ];

  // Sort: upcoming/tba first (chronological), past at the bottom
  events.sort((a, b) => {
    const rank = (s: EventStatus) => (s === 'past' ? 1 : 0);
    const r = rank(a.status) - rank(b.status);
    if (r !== 0) return r;
    return a.date.localeCompare(b.date);
  });

  return (
    <section id="events" className="border-t border-border bg-background">
      <div className="container py-14 sm:py-20">
        <h2 className="mb-3 max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t('eventsSectionTitle')}
        </h2>
        <p className="mb-10 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t('eventsSectionLead')}
        </p>

        <ol className="border-y border-border">
          {events.map((e) => (
            <li
              key={e.date + e.title}
              className="grid grid-cols-[6rem_1fr] items-baseline gap-x-6 gap-y-1 border-b border-border py-5 last:border-b-0 sm:grid-cols-[7rem_2fr_2fr_8rem]"
            >
              <span className="text-sm font-semibold tabular-nums text-foreground sm:text-base">
                {e.dateLabel}
              </span>
              <span className="text-base font-semibold text-foreground sm:text-lg">{e.title}</span>
              <span className="col-span-1 text-sm text-muted-foreground sm:col-span-1">
                {e.location}
              </span>
              <div className="col-span-2 sm:col-span-1 sm:text-right">
                <StatusPill status={e.status} label={t(`eventStatus_${e.status}`)} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/** A status indicator. Three states, three treatments. No pill chrome —
 *  each state is just a small mark: emerald filled square for upcoming,
 *  a hairline-ringed circle for tba, a plain dash for past. The state
 *  reads from shape and weight, not background fill, so the register
 *  stays the same as the rest of the page. */
function StatusPill({ status, label }: { status: EventStatus; label: string }) {
  if (status === 'upcoming') {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
        <span aria-hidden="true" className="inline-block h-2 w-2 bg-primary" />
        {label}
      </span>
    );
  }
  if (status === 'tba') {
    return (
      <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-admin">
        <span
          aria-hidden="true"
          className="inline-block h-2 w-2 rounded-full border border-admin"
        />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
      <span aria-hidden="true" className="inline-block h-px w-3 bg-muted-foreground" />
      {label}
    </span>
  );
}
