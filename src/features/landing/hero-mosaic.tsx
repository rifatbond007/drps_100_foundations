import Image from 'next/image';
import { cn } from '@/lib/utils';
import { assignPhotos, buildMosaic } from './mosaic-layout';

const GRID = { cols: 20, rows: 7, seed: 13 };
// Open area behind the headline (grid cells): the middle 8 columns, all
// but the top and bottom rows, so tiles still close the lens above and below.
const HOLE = { x0: 6, x1: 14, y0: 1, y1: 6 };
// Placeholder portraits — see public/images/hero/README.md to replace them.
const PHOTO_COUNT = 31;
const PHOTOS = Array.from(
  { length: PHOTO_COUNT },
  (_, i) => `/images/hero/${String(i + 1).padStart(2, '0')}.jpg`
);
const FULL = assignPhotos(buildMosaic(GRID), PHOTO_COUNT);
const FRAMED = assignPhotos(buildMosaic({ ...GRID, hole: HOLE }), PHOTO_COUNT);

/**
 * The hero's lens-shaped collage of community portraits. With `hollow`,
 * the centre is left open so the headline sits inside the "eye".
 */
export function HeroMosaic({
  hollow = false,
  className,
}: {
  hollow?: boolean;
  className?: string;
}) {
  const placed = hollow ? FRAMED : FULL;

  return (
    <div
      aria-hidden
      className={cn('grid gap-1 sm:gap-1.5', className)}
      style={{
        gridTemplateColumns: `repeat(${GRID.cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${GRID.rows}, minmax(0, 1fr))`,
        aspectRatio: `${GRID.cols} / ${GRID.rows}`,
      }}
    >
      {placed.map(({ tile: { col, row, size, tone }, photo }) => (
        <div
          key={`${col}-${row}`}
          style={{ gridColumn: `${col + 1} / span ${size}`, gridRow: `${row + 1} / span ${size}` }}
          className={cn(
            'relative overflow-hidden rounded-md sm:rounded-lg',
            photo === null && (tone < 0.35 ? 'bg-primary/85' : 'bg-primary-soft')
          )}
        >
          {photo !== null && (
            <Image
              src={PHOTOS[photo]!}
              alt=""
              fill
              sizes={`(min-width: 768px) ${size * 64}px, ${size * 20}px`}
              className="object-cover transition-transform duration-700 hover:scale-105"
            />
          )}
        </div>
      ))}
    </div>
  );
}
