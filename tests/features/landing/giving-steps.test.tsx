import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GivingSteps } from '@/features/landing/giving-steps';

beforeAll(() => {
  // jsdom has no layout or SVG geometry; stub just enough to run the effects.
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
  Object.assign(window.SVGElement.prototype, {
    getTotalLength: () => 100,
    getPointAtLength: () => ({ x: 0, y: 0 }),
  });
  window.matchMedia = vi.fn().mockReturnValue({ matches: true }); // reduced motion
});

const steps = [1, 2, 3].map((n) => ({ title: `Step ${n}`, body: `Body ${n}` }));

describe('GivingSteps', () => {
  it('renders every step in order', () => {
    render(<GivingSteps steps={steps} />);
    expect(screen.getAllByRole('heading').map((h) => h.textContent)).toEqual([
      'Step 1',
      'Step 2',
      'Step 3',
    ]);
  });

  it('shows all steps fully for reduced-motion users', () => {
    render(<GivingSteps steps={steps} />);
    const cards = screen.getAllByRole('heading').map((h) => h.parentElement as HTMLElement);
    expect(cards.map((c) => c.style.opacity)).toEqual(['1', '1', '1']);
  });
});
