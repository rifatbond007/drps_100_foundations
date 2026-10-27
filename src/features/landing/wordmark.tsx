import { cn } from '@/lib/utils';

/**
 * Oversized outlined wordmark (hairline stroke, no fill) that spans the
 * full width at any screen size.
 */
export function Wordmark({ text, className }: { text: string; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 1000 190" className={cn('block w-full', className)}>
      <text
        x="500"
        y="168"
        textAnchor="middle"
        textLength="990"
        lengthAdjust="spacingAndGlyphs"
        fontSize="228"
        fontWeight="700"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        vectorEffect="non-scaling-stroke"
        style={{ fontFamily: 'var(--font-hind), system-ui, sans-serif' }}
      >
        {text}
      </text>
    </svg>
  );
}
