/**
 * Hero collage layout, traced from the owner's reference sketch: 25
 * rectangles of mixed sizes in an irregular cluster. Units are the
 * sketch's pixels; the component scales them to percentages.
 */
export interface GridTile {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const HERO_GRID = {
  width: 424,
  height: 228,
  tiles: [
    { x: 160, y: 0, w: 46, h: 54 },
    { x: 208, y: 17, w: 45, h: 52 },
    { x: 256, y: 28, w: 73, h: 41 },
    { x: 76, y: 36, w: 82, h: 62 },
    { x: 160, y: 57, w: 46, h: 41 },
    { x: 38, y: 69, w: 36, h: 29 },
    { x: 332, y: 51, w: 54, h: 52 },
    { x: 208, y: 71, w: 86, h: 62 },
    { x: 296, y: 71, w: 33, h: 32 },
    { x: 388, y: 94, w: 36, h: 32 },
    { x: 0, y: 101, w: 36, h: 50 },
    { x: 38, y: 101, w: 62, h: 37 },
    { x: 102, y: 101, w: 104, h: 71 },
    { x: 296, y: 106, w: 67, h: 52 },
    { x: 366, y: 106, w: 20, h: 20 },
    { x: 366, y: 129, w: 58, h: 29 },
    { x: 38, y: 141, w: 30, h: 31 },
    { x: 70, y: 141, w: 30, h: 31 },
    { x: 208, y: 136, w: 37, h: 36 },
    { x: 248, y: 136, w: 46, h: 59 },
    { x: 70, y: 174, w: 62, h: 36 },
    { x: 135, y: 174, w: 37, h: 36 },
    { x: 175, y: 174, w: 70, h: 54 },
    { x: 296, y: 161, w: 47, h: 46 },
    { x: 346, y: 161, w: 36, h: 37 },
  ] satisfies GridTile[],
} as const;

/**
 * Placeholder community portraits (public/images/hero, see README there),
 * strongest first: the largest tiles get the earliest photos.
 */
export const HERO_PHOTOS = [
  1, 6, 2, 3, 27, 5, 21, 14, 4, 8, 30, 7, 23, 13, 28, 29, 15, 18, 17, 16, 24, 26, 31, 19, 9, 10, 11,
  12, 20, 22, 25,
].map((n) => `/images/hero/${String(n).padStart(2, '0')}.jpg`);
