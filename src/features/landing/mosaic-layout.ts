/**
 * Lens-shaped mosaic of squares for the hero background: tall in the
 * middle, tapering to a point at both ends, packed with 1–3 cell squares.
 * Seeded so server and client render identical markup.
 */
export interface MosaicTile {
  col: number;
  row: number;
  size: 1 | 2 | 3;
  /** Stable 0–1 value per tile, used to pick a colour/icon. */
  tone: number;
}

interface MosaicOptions {
  cols: number;
  rows: number;
  seed: number;
}

/** mulberry32 — tiny deterministic PRNG. */
function random(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Whether grid cell (col, row) falls inside the lens outline. */
export function insideLens(col: number, row: number, cols: number, rows: number): boolean {
  const t = (col + 0.5 - cols / 2) / (cols / 2);
  const halfHeight = (rows / 2) * Math.pow(Math.max(0, 1 - t * t), 0.55);
  return Math.abs(row + 0.5 - rows / 2) <= halfHeight;
}

export function buildMosaic({ cols, rows, seed }: MosaicOptions): MosaicTile[] {
  const rand = random(seed);
  const taken = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false));
  const fits = (col: number, row: number, size: number) => {
    if (col + size > cols || row + size > rows) return false;
    for (let c = col; c < col + size; c++) {
      for (let r = row; r < row + size; r++) {
        if (taken[r]![c] || !insideLens(c, r, cols, rows)) return false;
      }
    }
    return true;
  };

  const tiles: MosaicTile[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (taken[row]![col] || !insideLens(col, row, cols, rows)) continue;
      const roll = rand();
      const preferred = roll < 0.3 ? 3 : roll < 0.75 ? 2 : 1;
      const size = ([3, 2, 1] as const).find((s) => s <= preferred && fits(col, row, s));
      if (!size) continue;
      for (let c = col; c < col + size; c++) {
        for (let r = row; r < row + size; r++) taken[r]![c] = true;
      }
      tiles.push({ col, row, size, tone: rand() });
    }
  }
  return tiles;
}
