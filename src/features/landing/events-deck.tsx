'use client';

import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { EventStatus } from '@/lib/config/events';
import { cn } from '@/lib/utils';

export interface EventTicket {
  id: number;
  status: EventStatus;
  statusLabel: string;
  day: string;
  month: string;
  title: string;
  location: string;
}

interface EventsDeckProps {
  items: EventTicket[];
  labels: { region: string; prev: string; next: string };
}

const STATUS_VARIANT = { upcoming: 'primary', past: 'neutral', tba: 'warning' } as const;
const STUB_CLASS = {
  upcoming: 'bg-primary text-primary-foreground',
  past: 'bg-muted text-muted-foreground',
  tba: 'bg-warning-soft text-warning',
} as const;

// Each card further back in the stack sits this much higher and deeper.
const STEP_Y = 44;
const STEP_Z = 80;
// Horizontal drag distance that counts as a swipe.
const SWIPE_PX = 40;

/**
 * Events as a 3D stack of tickets: the active one in front, the rest
 * receding behind it. The stage tilts toward the mouse; arrows, date chips,
 * the keyboard and swipes flip through the stack.
 */
export function EventsDeck({ items, labels }: EventsDeckProps) {
  const [active, setActive] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<number | null>(null);
  const n = items.length;
  const go = (delta: number) => setActive((a) => (a + delta + n) % n);

  // Tilt is written straight to CSS variables so pointer moves don't re-render.
  const setTilt = (x: number, y: number) => {
    stageRef.current?.style.setProperty('--tilt-x', String(x));
    stageRef.current?.style.setProperty('--tilt-y', String(y));
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTilt((e.clientX - r.left) / r.width - 0.5, (e.clientY - r.top) / r.height - 0.5);
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (swipeStart.current === null) return;
    const dx = e.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) > SWIPE_PX) go(dx < 0 ? 1 : -1);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else return;
    e.preventDefault();
  };

  return (
    <div>
      <div
        ref={stageRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={labels.region}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setTilt(0, 0)}
        onPointerDown={(e) => (swipeStart.current = e.clientX)}
        onPointerUp={onPointerUp}
        className="relative h-[22rem] touch-pan-y select-none rounded-2xl [perspective:1400px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-[23rem]"
      >
        <div
          className="absolute inset-0 transition-transform duration-300 ease-out [transform-style:preserve-3d] motion-reduce:transition-none"
          style={{
            transform:
              'rotateX(calc(10deg - var(--tilt-y, 0) * 14deg)) rotateY(calc(-12deg + var(--tilt-x, 0) * 20deg))',
          }}
        >
          {items.map((item, i) => {
            const depth = (i - active + n) % n;
            return (
              <article
                key={item.id}
                aria-hidden={depth !== 0}
                onClick={depth ? () => setActive(i) : undefined}
                className={cn(
                  'absolute inset-x-0 bottom-0 h-56 transition-[transform,opacity] duration-500 [transform-style:preserve-3d] motion-reduce:transition-none sm:h-60',
                  depth && 'cursor-pointer'
                )}
                style={{
                  transform: `translate3d(0, ${-depth * STEP_Y}px, ${-depth * STEP_Z}px)`,
                  zIndex: n - depth,
                  transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
              >
                <Ticket item={item} depth={depth} />
              </article>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="hidden gap-2 sm:flex">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={i === active}
              aria-label={item.title}
              className={cn(
                'tabular rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                i === active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:border-primary/50 hover:text-foreground'
              )}
            >
              {item.day} {item.month}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="tabular mr-2 text-sm text-muted-foreground">
            {active + 1} / {n}
          </span>
          <DeckButton label={labels.prev} onClick={() => go(-1)}>
            <ChevronLeft className="size-5" aria-hidden />
          </DeckButton>
          <DeckButton label={labels.next} onClick={() => go(1)}>
            <ChevronRight className="size-5" aria-hidden />
          </DeckButton>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {items[active]?.title}
      </p>
    </div>
  );
}

function Ticket({ item, depth }: { item: EventTicket; depth: number }) {
  // Only the front ticket lifts its layers; the ones behind stay flat so the dimming overlay covers them.
  const lift = (z: number) => (depth === 0 ? { transform: `translateZ(${z}px)` } : undefined);
  return (
    <div className="relative flex h-full rounded-2xl border bg-card shadow-lift [transform-style:preserve-3d]">
      {/* Date stub; lifted toward the viewer so it parallaxes as the stage tilts. */}
      <div
        className={cn(
          'flex w-28 shrink-0 flex-col items-center justify-center rounded-l-2xl sm:w-36',
          STUB_CLASS[item.status]
        )}
      >
        <div className="text-center" style={lift(40)}>
          <p className="tabular text-5xl font-bold leading-none sm:text-6xl">{item.day}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider opacity-80">
            {item.month}
          </p>
        </div>
      </div>

      {/* Perforation, with notches cut where it meets the edges. */}
      <div className="relative border-l-2 border-dashed border-border">
        <span className="absolute -left-[13px] -top-px h-3 w-6 rounded-b-full border-x border-b bg-background" />
        <span className="absolute -bottom-px -left-[13px] h-3 w-6 rounded-t-full border-x border-t bg-background" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-7" style={lift(24)}>
        <Badge variant={STATUS_VARIANT[item.status]} className="w-fit">
          {item.statusLabel}
        </Badge>
        <h3 className="mt-3 text-balance text-xl font-bold leading-tight sm:text-2xl">
          {item.title}
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          {item.location}
        </p>
        <div className="mt-auto flex items-end justify-between gap-4 pt-4">
          <p className="whitespace-nowrap font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            drps101 · {String(item.id).padStart(3, '0')}
          </p>
          {/* Decorative barcode. */}
          <span
            aria-hidden
            className="h-8 w-14 shrink-0 opacity-60 sm:w-24"
            style={{
              background:
                'repeating-linear-gradient(90deg, hsl(var(--foreground)) 0 2px, transparent 2px 4px, hsl(var(--foreground)) 4px 5px, transparent 5px 8px)',
            }}
          />
        </div>
      </div>
      {depth > 0 && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-2xl bg-background"
          style={{ opacity: Math.min(0.75, depth * 0.25) }}
        />
      )}
    </div>
  );
}

function DeckButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-11 items-center justify-center rounded-full border bg-card shadow-card transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </button>
  );
}
