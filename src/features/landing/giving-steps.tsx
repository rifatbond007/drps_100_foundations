'use client';

import { useEffect, useRef, useState } from 'react';
import { LogIn, ReceiptText, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = [LogIn, Smartphone, ReceiptText];

// Path progress is 0 when the list's top reaches this fraction of the
// viewport, and 1 when the last step's coin gets there.
const TRIGGER = 0.7;

interface GivingStepsProps {
  steps: { title: string; body: string }[];
}

/**
 * The giving steps joined by a curved path that draws itself as the page
 * scrolls, led by a glowing dot. As the path reaches a step, its number
 * coin flips over in 3D and its card swings up into place.
 */
export function GivingSteps({ steps }: GivingStepsProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pathRef = useRef<SVGPathElement>(null);
  const progressRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);
  const [geometry, setGeometry] = useState({
    d: '',
    width: 0,
    height: 0,
    lastY: 0,
    stops: [] as number[],
  });
  const [reached, setReached] = useState(-1);

  // Build the path through the coin centres; rebuild whenever the list resizes.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const box = list.getBoundingClientRect();
      const points = nodeRefs.current.map((node) => {
        const r = node!.getBoundingClientRect();
        return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2 };
      });
      let d = `M ${points[0]!.x} ${points[0]!.y}`;
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1]!;
        const b = points[i]!;
        const mid = (b.y - a.y) / 2;
        d += ` C ${a.x} ${a.y + mid}, ${b.x} ${b.y - mid}, ${b.x} ${b.y}`;
      }
      const last = points[points.length - 1]!.y;
      setGeometry({
        d,
        width: box.width,
        height: box.height,
        lastY: last,
        stops: points.map((p) => (last ? p.y / last : 0)),
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  // Tie the path's drawn length to scroll position.
  useEffect(() => {
    const list = listRef.current;
    const path = pathRef.current;
    if (!list || !path || !geometry.d) return;
    const length = path.getTotalLength();
    const progress = progressRef.current!;
    progress.style.strokeDasharray = `${length}`;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    const update = () => {
      const top = list.getBoundingClientRect().top;
      const p = reduced
        ? 1
        : Math.min(1, Math.max(0, (window.innerHeight * TRIGGER - top) / geometry.lastY));
      progress.style.strokeDashoffset = `${length * (1 - p)}`;
      const point = path.getPointAtLength(length * p);
      dotRef.current?.setAttribute('transform', `translate(${point.x} ${point.y})`);
      dotRef.current?.setAttribute('opacity', p > 0 && p < 1 ? '1' : '0');
      setReached(geometry.stops.findLastIndex((stop) => p >= stop - 0.001));
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [geometry]);

  return (
    <ol ref={listRef} className="relative flex flex-col gap-10 sm:gap-14">
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-visible"
        width={geometry.width}
        height={geometry.height}
      >
        <defs>
          <linearGradient id="giving-path" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(110 231 183)" />
            <stop offset="100%" stopColor="rgb(16 185 129)" />
          </linearGradient>
        </defs>
        {/* Faint track showing the whole route. */}
        <path
          ref={pathRef}
          d={geometry.d}
          fill="none"
          stroke="rgb(255 255 255 / 0.12)"
          strokeWidth={2}
          strokeDasharray="4 8"
        />
        {/* The part already travelled. */}
        <path
          ref={progressRef}
          d={geometry.d}
          fill="none"
          stroke="url(#giving-path)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle ref={dotRef} r={7} fill="rgb(167 243 208)" opacity={0}>
          <animate attributeName="r" values="6;9;6" dur="1.6s" repeatCount="indefinite" />
        </circle>
      </svg>

      {steps.map(({ title, body }, i) => {
        const Icon = ICONS[i] ?? LogIn;
        const active = i <= reached;
        const number = String(i + 1).padStart(2, '0');
        return (
          <li
            key={title}
            // Alternate indents so the path weaves between the steps.
            className={cn(
              'relative flex items-start gap-5 sm:gap-7',
              i % 2 === 1 && 'ml-10 sm:ml-28'
            )}
          >
            <div
              ref={(el) => {
                nodeRefs.current[i] = el;
              }}
              className="relative z-10 size-14 shrink-0 [perspective:600px]"
            >
              {/* Coin: the lit face turns toward the viewer once the path arrives. */}
              <div
                className="relative size-full transition-transform duration-700 [transform-style:preserve-3d] motion-reduce:transition-none"
                style={{ transform: active ? 'rotateY(0deg)' : 'rotateY(180deg)' }}
              >
                <span className="tabular absolute inset-0 flex items-center justify-center rounded-full border border-emerald-200/60 bg-emerald-400 text-lg font-bold text-emerald-950 shadow-[0_0_32px_-4px_rgb(52_211_153/0.8)] [backface-visibility:hidden]">
                  {number}
                </span>
                <span className="tabular absolute inset-0 flex items-center justify-center rounded-full border border-white/15 bg-[hsl(162_40%_13%)] text-lg font-bold text-white/30 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  {number}
                </span>
              </div>
            </div>
            <div className="min-w-0 flex-1 [perspective:1000px]">
              <div
                className="origin-top rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-sm transition-[transform,opacity] duration-700 motion-reduce:transition-none sm:p-6"
                style={{
                  transform: active ? 'none' : 'rotateX(55deg) translateY(24px)',
                  opacity: active ? 1 : 0.25,
                  transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
                }}
              >
                <h3 className="flex items-center gap-2.5 text-xl font-semibold">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-300">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  {title}
                </h3>
                <p className="mt-3 text-white/70">{body}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
