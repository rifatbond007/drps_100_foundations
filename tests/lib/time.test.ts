import { describe, expect, it } from 'vitest';
import { dhakaMonthKey, dhakaMonthKeys, startOfDhakaDay, startOfDhakaMonth } from '@/lib/time';

describe('Asia/Dhaka time helpers', () => {
  it('startOfDhakaDay returns 18:00Z of the previous UTC day', () => {
    expect(startOfDhakaDay(new Date('2026-03-01T19:00:00Z')).toISOString()).toBe(
      '2026-03-01T18:00:00.000Z'
    );
    expect(startOfDhakaDay(new Date('2026-03-01T10:00:00Z')).toISOString()).toBe(
      '2026-02-28T18:00:00.000Z'
    );
  });

  it('dhakaMonthKey rolls into the next month after 18:00Z on the last day', () => {
    expect(dhakaMonthKey(new Date('2026-01-31T19:30:00Z'))).toBe('2026-02');
  });

  it('startOfDhakaMonth goes back whole months', () => {
    expect(startOfDhakaMonth(new Date('2026-03-10T00:00:00Z'), 11).toISOString()).toBe(
      '2025-03-31T18:00:00.000Z'
    );
  });

  it('dhakaMonthKeys lists the last n months oldest first', () => {
    expect(dhakaMonthKeys(3, new Date('2026-01-15T00:00:00Z'))).toEqual([
      '2025-11',
      '2025-12',
      '2026-01',
    ]);
  });
});
