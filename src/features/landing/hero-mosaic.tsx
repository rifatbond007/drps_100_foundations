import {
  BookOpen,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Home,
  Siren,
  Sprout,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { buildMosaic } from './mosaic-layout';

const COLS = 28;
const ROWS = 10;
const TILES = buildMosaic({ cols: COLS, rows: ROWS, seed: 7 });
// What the community's giving turns into — one icon per larger tile.
const ICONS: LucideIcon[] = [
  BookOpen,
  HeartPulse,
  HandHeart,
  Users,
  GraduationCap,
  Home,
  Siren,
  Sprout,
];

/**
 * The hero's lens-shaped collage: each square is a member of the community
 * or something their giving pays for. `hollow` clears the centre so the
 * headline can sit inside it.
 */
export function HeroMosaic({
  hollow = false,
  className,
}: {
  hollow?: boolean;
  className?: string;
}) {
  // Soft fade toward the centre so the copy sits on a calm surface.
  const mask = hollow
    ? 'radial-gradient(ellipse 36% 52% at 50% 50%, rgb(0 0 0 / 0.25) 45%, black 90%)'
    : undefined;

  return (
    <div
      aria-hidden
      className={cn('grid gap-[3px] sm:gap-1.5', className)}
      style={{
        gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
        aspectRatio: `${COLS} / ${ROWS}`,
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    >
      {TILES.map(({ col, row, size, tone }, i) => {
        // Inside the "pupil" behind the headline only quiet tiles are drawn.
        const cx = (col + size / 2 - COLS / 2) / (COLS * 0.27);
        const cy = (row + size / 2 - ROWS / 2) / (ROWS * 0.5);
        const quiet = hollow && cx * cx + cy * cy < 1;
        const Icon = !quiet && size > 1 && tone < 0.5 ? ICONS[i % ICONS.length] : null;
        const solid = !quiet && size > 1 && tone < 0.14;
        return (
          <div
            key={`${col}-${row}`}
            style={{
              gridColumn: `${col + 1} / span ${size}`,
              gridRow: `${row + 1} / span ${size}`,
            }}
            className={cn(
              'flex items-center justify-center rounded-[4px] sm:rounded-md',
              solid
                ? 'bg-primary text-primary-foreground'
                : Icon
                  ? 'bg-primary-soft text-primary/70'
                  : quiet
                    ? 'bg-muted/50'
                    : tone < 0.75
                      ? 'bg-primary/10'
                      : 'bg-muted'
            )}
          >
            {Icon && (
              <Icon className={size === 3 ? 'size-[40%]' : 'size-[45%]'} strokeWidth={1.75} />
            )}
          </div>
        );
      })}
    </div>
  );
}
