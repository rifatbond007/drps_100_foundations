/**
 * Asia/Dhaka calendar helpers. Bangladesh is UTC+6 with no DST, so a
 * fixed offset is exact. Reports bucket by the admin's wall clock, not
 * the server's (which is UTC on Vercel).
 */
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

/** Shift a UTC instant so its UTC fields read as Dhaka wall-clock time. */
const toDhakaFields = (d: Date): Date => new Date(d.getTime() + DHAKA_OFFSET_MS);

/** UTC instant of Dhaka midnight for the given Dhaka Y/M/D fields. */
const fromDhakaFields = (year: number, month: number, day: number): Date =>
  new Date(Date.UTC(year, month, day) - DHAKA_OFFSET_MS);

export function startOfDhakaDay(now: Date = new Date()): Date {
  const d = toDhakaFields(now);
  return fromDhakaFields(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Start of the Dhaka month `monthsBack` months before the one containing `now`. */
export function startOfDhakaMonth(now: Date = new Date(), monthsBack = 0): Date {
  const d = toDhakaFields(now);
  return fromDhakaFields(d.getUTCFullYear(), d.getUTCMonth() - monthsBack, 1);
}

export function dhakaMonthKey(date: Date): string {
  const d = toDhakaFields(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** The last `n` Dhaka month keys, oldest first, ending with the current month. */
export function dhakaMonthKeys(n: number, now: Date = new Date()): string[] {
  return Array.from({ length: n }, (_, i) => dhakaMonthKey(startOfDhakaMonth(now, n - 1 - i)));
}
