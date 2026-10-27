'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { WORDMARK } from './wordmark-path';

// Spotlight radius in wordmark units (≈ the X.com footer's 142/1392 ratio).
const GLOW_RADIUS = Math.round(WORDMARK.width * 0.1);

/**
 * Hairline outlined wordmark, after the X.com help-centre footer: the
 * outline draws itself in when scrolled into view, and a soft spotlight
 * that follows the pointer reveals a bolder outline underneath.
 */
export function Wordmark({ className }: { className?: string }) {
  const id = useId().replace(/:/g, '');
  const svgRef = useRef<SVGSVGElement>(null);
  const glowRef = useRef<SVGGElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const el = svgRef.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!el || reduced || typeof IntersectionObserver === 'undefined') {
      setDrawn(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setDrawn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const moveGlow = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm || !glowRef.current) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(ctm.inverse());
    glowRef.current.setAttribute('transform', `translate(${point.x} ${point.y})`);
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
      onPointerEnter={() => setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      onPointerMove={moveGlow}
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
          x={-GLOW_RADIUS}
          y={-GLOW_RADIUS}
          width={WORDMARK.width + GLOW_RADIUS * 2}
          height={WORDMARK.height + GLOW_RADIUS * 2}
        >
          <g ref={glowRef} transform={`translate(${WORDMARK.width / 2} ${WORDMARK.height / 2})`}>
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

      {/* Bolder outline revealed under the pointer. */}
      <g
        mask={`url(#${id}-mask)`}
        className={cn(
          'transition-opacity duration-500 ease-out',
          hovering ? 'opacity-100' : 'opacity-0'
        )}
      >
        <path {...outline} strokeWidth={2.5} className="text-foreground/20" />
        <path {...outline} strokeWidth={1.5} className="text-foreground/50" />
        <path {...outline} strokeWidth={0.75} className="text-foreground" />
      </g>
    </svg>
  );
}
