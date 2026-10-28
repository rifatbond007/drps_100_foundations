import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { EventsDeck, type EventTicket } from '@/features/landing/events-deck';

const items: EventTicket[] = [1, 2, 3].map((id) => ({
  id,
  status: 'upcoming',
  statusLabel: 'Upcoming',
  day: String(id),
  month: 'Dec 2026',
  title: `Event ${id}`,
  location: 'Dhaka',
}));

const labels = { region: 'Events', prev: 'Previous event', next: 'Next event' };
const announced = () => document.querySelector('[aria-live="polite"]')?.textContent;

describe('EventsDeck', () => {
  it('starts on the first event and wraps around both ways', () => {
    render(<EventsDeck items={items} labels={labels} />);
    expect(announced()).toBe('Event 1');
    fireEvent.click(screen.getByRole('button', { name: 'Previous event' }));
    expect(announced()).toBe('Event 3');
    fireEvent.click(screen.getByRole('button', { name: 'Next event' }));
    expect(announced()).toBe('Event 1');
  });

  it('jumps to an event from its date chip and with the arrow keys', () => {
    render(<EventsDeck items={items} labels={labels} />);
    fireEvent.click(screen.getByRole('button', { name: 'Event 2' }));
    expect(announced()).toBe('Event 2');
    expect(screen.getByRole('button', { name: 'Event 2' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.keyDown(screen.getByRole('region', { name: 'Events' }), { key: 'ArrowRight' });
    expect(announced()).toBe('Event 3');
  });

  it('hides all but the front ticket from assistive tech', () => {
    render(<EventsDeck items={items} labels={labels} />);
    const tickets = document.querySelectorAll('article');
    expect([...tickets].filter((t) => t.getAttribute('aria-hidden') === 'false')).toHaveLength(1);
  });
});
