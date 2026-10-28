/**
 * Landing-page events. Titles/locations are `landing.event{n}*` message
 * keys; `date` is an ISO day (Asia/Dhaka) or null when not yet fixed.
 * Status (upcoming / completed / TBA) is derived from the date.
 */
export const EVENTS = [
  { n: 3, date: '2026-12-07' },
  { n: 2, date: '2026-10-12' },
  { n: 1, date: '2026-09-21' },
  { n: 4, date: '2026-08-04' },
] as const satisfies ReadonlyArray<{ n: number; date: string | null }>;

export type EventStatus = 'upcoming' | 'past' | 'tba';

export function eventStatus(date: string | null, today: Date = new Date()): EventStatus {
  if (!date) return 'tba';
  // Compare calendar days in Dhaka (UTC+6).
  const todayKey = new Date(today.getTime() + 6 * 3600_000).toISOString().slice(0, 10);
  return date >= todayKey ? 'upcoming' : 'past';
}
