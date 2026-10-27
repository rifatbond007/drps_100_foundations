/**
 * Lens-shaped mosaic of squares for the hero background: tall in the
 * middle, tapering to a point at both ends, packed with 1–3 cell squares.
 * The left half is packed and mirrored, so the lens is symmetric. Seeded so
 * server and client render identical markup.
 */
export interface MosaicTile {
  col: number;
  row: number;
  size: 1 | 2 | 3;
  /** Stable 0–1 value per tile, used to pick a colour/icon. */
  tone: number;
}

/** A rectangle in grid cells, [x0, x1) × [y0, y1), kept free of tiles. */
export interface Hole {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

interface MosaicOptions {
  cols: number;
  rows: number;
  seed: number;
  /** Area left open (e.g. for the headline); tiles pack around it. */
  hole?: Hole;
}

export const inHole = (col: number, row: number, hole?: Hole): boolean =>
  !!hole && col >= hole.x0 && col < hole.x1 && row >= hole.y0 && row < hole.y1;

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

export function buildMosaic({ cols, rows, seed, hole }: MosaicOptions): MosaicTile[] {
  const rand = random(seed);
  const taken = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false));
  const fits = (col: number, row: number, size: number) => {
    if (col + size > cols || row + size > rows) return false;
    for (let c = col; c < col + size; c++) {
      for (let r = row; r < row + size; r++) {
        if (taken[r]![c] || !insideLens(c, r, cols, rows) || inHole(c, r, hole)) return false;
      }
    }
    return true;
  };

  // Pack only the left half; tiles may not cross the centre line.
  const half = Math.floor(cols / 2);
  const fitsLeft = (col: number, row: number, size: number) =>
    col + size <= half && fits(col, row, size);

  const tiles: MosaicTile[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < half; col++) {
      if (taken[row]![col] || !insideLens(col, row, cols, rows) || inHole(col, row, hole)) continue;
      const roll = rand();
      // Favour larger squares so each photo is big enough to read.
      const preferred = roll < 0.45 ? 3 : roll < 0.9 ? 2 : 1;
      const size = ([3, 2, 1] as const).find((s) => s <= preferred && fitsLeft(col, row, s));
      if (!size) continue;
      for (let c = col; c < col + size; c++) {
        for (let r = row; r < row + size; r++) taken[r]![c] = true;
      }
      tiles.push({ col, row, size, tone: rand() });
    }
  }
  const mirrored = tiles.map((t) => ({ ...t, col: cols - t.col - t.size, tone: rand() }));
  return [...tiles, ...mirrored];
}

export interface PlacedTile {
  tile: MosaicTile;
  /** Index into the photo set, or null for a plain accent tile. */
  photo: number | null;
}

/** Give each photo one tile, biggest tiles first so faces read well; the rest are accents. */
export function assignPhotos(tiles: MosaicTile[], photos: number): PlacedTile[] {
  const order = [...tiles].sort((a, b) => b.size - a.size || a.tone - b.tone);
  const photoFor = new Map(order.slice(0, photos).map((t, i) => [t, i]));
  return tiles.map((tile) => ({ tile, photo: photoFor.get(tile) ?? null }));
}
