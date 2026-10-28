import { describe, expect, it } from 'vitest';
import { sweepX } from '@/features/landing/wordmark-sweep';

const W = 1000;
const PERIOD = 6000;

describe('sweepX', () => {
  it('starts at the left edge', () => {
    expect(sweepX(0, W, PERIOD)).toBeCloseTo(0);
  });

  it('reaches the right edge halfway through the period', () => {
    expect(sweepX(PERIOD / 2, W, PERIOD)).toBeCloseTo(W);
  });

  it('comes back to the left edge after a full period', () => {
    expect(sweepX(PERIOD, W, PERIOD)).toBeCloseTo(0);
  });

  it('moves left-to-right in the first half and right-to-left in the second', () => {
    expect(sweepX(PERIOD * 0.3, W, PERIOD)).toBeGreaterThan(sweepX(PERIOD * 0.2, W, PERIOD));
    expect(sweepX(PERIOD * 0.8, W, PERIOD)).toBeLessThan(sweepX(PERIOD * 0.7, W, PERIOD));
  });
});
