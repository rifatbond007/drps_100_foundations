'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TiltProps {
  children: ReactNode;
  className?: string;
  /** Maximum rotation in degrees at the card's edges. */
  max?: number;
  /** Soft light that follows the pointer across the surface. */
  glare?: boolean;
}

/**
 * Card that tilts in 3D toward the mouse, with an optional glare. Mouse
 * only — touch and reduced-motion users get a still card. Values are written
 * to CSS variables, so pointer moves don't re-render.
 */
export function Tilt({ children, className, max = 8, glare = true }: TiltProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      el.style.setProperty('--rx', `${(0.5 - y) * max}deg`);
      el.style.setProperty('--ry', `${(x - 0.5) * max}deg`);
      el.style.setProperty('--gx', `${x * 100}%`);
      el.style.setProperty('--gy', `${y * 100}%`);
      el.dataset.tilting = 'true';
    });
  };

  const onPointerLeave = () => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    delete el.dataset.tilting;
  };

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn(
        'group/tilt relative transition-[transform,box-shadow] duration-500 ease-out will-change-transform [transform:perspective(1000px)_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))] data-[tilting=true]:duration-150',
        className
      )}
    >
      {children}
      {glare && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-data-[tilting=true]/tilt:opacity-100"
          style={{
            background:
              'radial-gradient(circle at var(--gx, 50%) var(--gy, 50%), rgb(255 255 255 / 0.22), transparent 55%)',
          }}
        />
      )}
    </div>
  );
}
