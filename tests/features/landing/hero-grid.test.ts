import { describe, expect, it } from 'vitest';
import { HERO_GRID, HERO_PHOTOS } from '@/features/landing/hero-grid';

const overlaps = (
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe('HERO_GRID', () => {
  it('reproduces the 25-tile reference layout', () => {
    expect(HERO_GRID.tiles).toHaveLength(25);
  });

  it('keeps every tile inside the frame', () => {
    for (const t of HERO_GRID.tiles) {
      expect(t.x).toBeGreaterThanOrEqual(0);
      expect(t.y).toBeGreaterThanOrEqual(0);
      expect(t.x + t.w).toBeLessThanOrEqual(HERO_GRID.width);
      expect(t.y + t.h).toBeLessThanOrEqual(HERO_GRID.height);
    }
  });

  it('never overlaps tiles', () => {
    const tiles = HERO_GRID.tiles;
    for (let i = 0; i < tiles.length; i++) {
      for (let j = i + 1; j < tiles.length; j++) {
        expect(overlaps(tiles[i]!, tiles[j]!), `tiles ${i} and ${j}`).toBe(false);
      }
    }
  });

  it('has a distinct photo for every tile', () => {
    expect(HERO_PHOTOS.length).toBeGreaterThanOrEqual(HERO_GRID.tiles.length);
    expect(new Set(HERO_PHOTOS).size).toBe(HERO_PHOTOS.length);
  });
});
