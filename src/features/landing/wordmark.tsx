'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { WORDMARK } from './wordmark-path';
import { sweepX } from './wordmark-sweep';

// Spotlight radius in wordmark units (≈ the X.com footer's 142/1392 ratio).
const GLOW_RADIUS = Math.round(WORDMARK.width * 0.1);
const SWEEP_PERIOD_MS = 7000;
// The sweep overshoots each end a little so the edge letters light fully.
const SWEEP_MARGIN = GLOW_RADIUS * 0.5;
// Fraction of the remaining distance the spotlight covers per frame.
const EASE = 0.12;

/**
 * Hairline outlined wordmark, after the X.com help-centre footer: the
 * outline draws itself in on view, and a soft spotlight revealing a bolder
 * outline sweeps left to right and back on its own. While the pointer is
 * over the wordmark, the spotlight follows the pointer instead.
 */
export function Wordmark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const glowRef = useRef<SVGGElement>(null);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const [drawn, setDrawn] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const el = svgRef.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    setAutoplay(!reduced);
    if (!el || typeof IntersectionObserver === 'undefined') {
      setDrawn(true);
      return;
    }

    let frame = 0;
    let visible = false;
    let start = performance.now();
    const pos = { x: 0, y: WORDMARK.height / 2 };

    const tick = (now: number) => {
      const target = pointer.current ?? {
        x: sweepX(now - start, WORDMARK.width + SWEEP_MARGIN * 2, SWEEP_PERIOD_MS) - SWEEP_MARGIN,
        y: WORDMARK.height / 2,
      };
      pos.x += (target.x - pos.x) * EASE;
      pos.y += (target.y - pos.y) * EASE;
      glowRef.current?.setAttribute('transform', `translate(${pos.x} ${pos.y})`);
      if (visible) frame = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = !!entry?.isIntersecting;
        if (visible) {
          setDrawn(true);
          if (!reduced || pointer.current) {
            start = performance.now();
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(tick);
          }
        } else {
          cancelAnimationFrame(frame);
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  const toSvgPoint = (event: React.PointerEvent<SVGSVGElement>) => {
    const ctm = svgRef.current?.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  const outline = {
    d: WORDMARK.d,
    fill: 'none',
    stroke: 'currentColor',
    vectorEffect: 'non-scaling-stroke',
  } as const;

  return (
    <svg
      ref={svgRef}
      aria-hidden
      viewBox={`0 0 ${WORDMARK.width} ${WORDMARK.height}`}
      className={cn('block overflow-visible', className)}
      style={{ aspectRatio: `${WORDMARK.width} / ${WORDMARK.height}` }}
      onPointerEnter={(e) => {
        pointer.current = toSvgPoint(e);
        setHovering(true);
      }}
      onPointerMove={(e) => {
        pointer.current = toSvgPoint(e);
        // Without the animation loop (reduced motion), place the spotlight directly.
        if (!autoplay && pointer.current) {
          glowRef.current?.setAttribute(
            'transform',
            `translate(${pointer.current.x} ${pointer.current.y})`
          );
        }
      }}
      onPointerLeave={() => {
        pointer.current = null;
        setHovering(false);
      }}
    >
      <defs>
        <radialGradient id={`${id}-glow`}>
          <stop offset="0%" stopColor="white" />
          <stop offset="40%" stopColor="white" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask
          id={`${id}-mask`}
          maskUnits="userSpaceOnUse"
          x={-GLOW_RADIUS * 2}
          y={-GLOW_RADIUS * 2}
          width={WORDMARK.width + GLOW_RADIUS * 4}
          height={WORDMARK.height + GLOW_RADIUS * 4}
        >
          <g ref={glowRef} transform={`translate(0 ${WORDMARK.height / 2})`}>
            <circle r={GLOW_RADIUS} fill={`url(#${id}-glow)`} />
          </g>
        </mask>
      </defs>

      {/* Base hairline that traces itself in. */}
      <path
        {...outline}
        pathLength={1}
        strokeWidth={1}
        strokeDasharray="1 1"
        className="text-foreground/40 [transition:stroke-dashoffset_2400ms_cubic-bezier(0.22,1,0.36,1)]"
        style={{ strokeDashoffset: drawn ? 0 : 1 }}
      />

      {/* Bolder outline revealed under the spotlight. */}
      <g
        mask={`url(#${id}-mask)`}
        className={cn(
          'transition-opacity duration-700 ease-out',
          drawn && (autoplay || hovering) ? 'opacity-100' : 'opacity-0'
        )}
      >
        <path {...outline} strokeWidth={2.5} className="text-foreground/20" />
        <path {...outline} strokeWidth={1.5} className="text-foreground/50" />
        <path {...outline} strokeWidth={0.75} className="text-foreground" />
      </g>
    </svg>
  );
}
