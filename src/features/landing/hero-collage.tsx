import Image from 'next/image';
import { cn } from '@/lib/utils';
import { HERO_GRID, HERO_PHOTOS } from './hero-grid';

const pct = (value: number, total: number) => `${(value / total) * 100}%`;

// Largest tiles get the strongest photos.
const BY_AREA = HERO_GRID.tiles
  .map((tile, i) => ({ tile, i }))
  .sort((a, b) => b.tile.w * b.tile.h - a.tile.w * a.tile.h);
const PHOTO_FOR = new Map(BY_AREA.map(({ i }, rank) => [i, HERO_PHOTOS[rank]!]));

/** Collage of community portraits laid out on the reference grid. */
export function HeroCollage({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const { width, height, tiles } = HERO_GRID;
  return (
    <div
      aria-hidden
      className={cn('relative w-full', className)}
      style={{ aspectRatio: `${width} / ${height}`, ...style }}
    >
      {tiles.map((tile, i) => (
        <div
          key={i}
          className="absolute overflow-hidden rounded-[3px] bg-muted sm:rounded-md"
          style={{
            left: pct(tile.x, width),
            top: pct(tile.y, height),
            width: pct(tile.w, width),
            height: pct(tile.h, height),
          }}
        >
          <Image
            src={PHOTO_FOR.get(i)!}
            alt=""
            fill
            priority={i < 8}
            sizes={`(min-width: 900px) ${Math.round((tile.w / width) * 860)}px, ${Math.round((tile.w / width) * 100)}vw`}
            className="object-cover transition-transform duration-700 hover:scale-105"
          />
        </div>
      ))}
    </div>
  );
}
