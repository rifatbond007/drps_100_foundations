import { describe, expect, it } from 'vitest';
import { assignPhotos, buildMosaic, inHole, insideLens } from '@/features/landing/mosaic-layout';

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

describe('assignPhotos', () => {
  const tiles = buildMosaic({ cols: 20, rows: 7, seed: 7 });

  it('uses each photo at most once and fills them all', () => {
    const used = assignPhotos(tiles, 16)
      .map((p) => p.photo)
      .filter((p) => p !== null);
    expect(new Set(used).size).toBe(used.length);
    expect(used.length).toBe(16);
  });
});

describe('hole', () => {
  const hole = { x0: 6, x1: 14, y0: 1, y1: 6 };
  const tiles = buildMosaic({ cols: 20, rows: 7, seed: 7, hole });

  it('packs no tile into the open area behind the headline', () => {
    for (const t of tiles) {
      for (let c = t.col; c < t.col + t.size; c++) {
        for (let r = t.row; r < t.row + t.size; r++) {
          expect(inHole(c, r, hole)).toBe(false);
        }
      }
    }
  });

  it('still frames the text with tiles above and below', () => {
    expect(tiles.some((t) => t.row === 0 && t.col >= 6 && t.col < 14)).toBe(true);
    expect(tiles.some((t) => t.row + t.size === 7 && t.col >= 6 && t.col < 14)).toBe(true);
  });
});

describe('symmetry', () => {
  it('mirrors the left half onto the right like the reference lens', () => {
    const grid = { cols: 20, rows: 7, seed: 7 };
    const tiles = buildMosaic(grid);
    const key = (c: number, r: number, s: number) => `${c},${r},${s}`;
    const all = new Set(tiles.map((t) => key(t.col, t.row, t.size)));
    for (const t of tiles) {
      expect(all.has(key(grid.cols - t.col - t.size, t.row, t.size))).toBe(true);
    }
  });
});
