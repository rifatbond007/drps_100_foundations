/**
 * Horizontal position of the auto-playing spotlight: eases from the left
 * edge (0) to the right edge (`width`) and back once per `periodMs`.
 */
export function sweepX(elapsedMs: number, width: number, periodMs: number): number {
  const phase = ((elapsedMs % periodMs) / periodMs) * 2 * Math.PI;
  return (width * (1 - Math.cos(phase))) / 2;
}
