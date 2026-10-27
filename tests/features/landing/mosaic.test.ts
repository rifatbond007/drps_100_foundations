import { describe, expect, it } from 'vitest';
import { buildMosaic, insideLens } from '@/features/landing/mosaic-layout';

const opts = { cols: 28, rows: 10, seed: 7 };

describe('buildMosaic', () => {
  const tiles = buildMosaic(opts);

  it('is deterministic (same markup on server and client)', () => {
    expect(buildMosaic(opts)).toEqual(tiles);
  });

  it('never overlaps tiles', () => {
    const seen = new Set<string>();
    for (const t of tiles) {
      for (let c = t.col; c < t.col + t.size; c++) {
        for (let r = t.row; r < t.row + t.size; r++) {
          const key = `${c},${r}`;
          expect(seen.has(key)).toBe(false);
          seen.add(key);
        }
      }
    }
  });

  it('keeps every tile inside the lens shape', () => {
    for (const t of tiles) {
      for (let c = t.col; c < t.col + t.size; c++) {
        for (let r = t.row; r < t.row + t.size; r++) {
          expect(insideLens(c, r, opts.cols, opts.rows)).toBe(true);
        }
      }
    }
  });

  it('mixes tile sizes like the reference collage', () => {
    const sizes = new Set(tiles.map((t) => t.size));
    expect(sizes.size).toBeGreaterThanOrEqual(3);
  });
});
