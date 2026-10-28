import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Tilt } from '@/features/landing/tilt';

const mockReducedMotion = (matches: boolean) => {
  window.matchMedia = vi.fn().mockReturnValue({ matches });
};

const renderCard = () => {
  render(<Tilt>card</Tilt>);
  const el = screen.getByText('card') as HTMLElement;
  el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;
  return el;
};

// jsdom's PointerEvent drops pointerType, so build the event by hand.
const move = (el: HTMLElement, pointerType: string) => {
  const e = new MouseEvent('pointermove', { bubbles: true, clientX: 100, clientY: 0 });
  Object.defineProperty(e, 'pointerType', { value: pointerType });
  fireEvent(el, e);
};

beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0);
    return 0;
  });
});

describe('Tilt', () => {
  it('tilts toward the mouse and settles back on leave', () => {
    mockReducedMotion(false);
    const el = renderCard();
    move(el, 'mouse');
    // Top-right corner: tips back and to the right.
    expect(el.style.getPropertyValue('--rx')).toBe('4deg');
    expect(el.style.getPropertyValue('--ry')).toBe('4deg');
    fireEvent.pointerLeave(el);
    expect(el.style.getPropertyValue('--rx')).toBe('0deg');
  });

  it('stays still for touch and reduced-motion users', () => {
    mockReducedMotion(false);
    const el = renderCard();
    move(el, 'touch');
    expect(el.style.getPropertyValue('--rx')).toBe('');

    mockReducedMotion(true);
    move(el, 'mouse');
    expect(el.style.getPropertyValue('--rx')).toBe('');
  });
});
