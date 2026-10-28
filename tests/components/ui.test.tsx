import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { donationStatusVariant } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

describe('Button', () => {
  it('is disabled and busy while loading', () => {
    render(<Button loading>Save</Button>);
    const button = screen.getByRole('button', { name: /save/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });
});

describe('donationStatusVariant', () => {
  it('maps each status to a badge variant', () => {
    expect(donationStatusVariant('PENDING')).toBe('warning');
    expect(donationStatusVariant('SUCCESS')).toBe('success');
    expect(donationStatusVariant('FAILED')).toBe('danger');
    expect(donationStatusVariant('CANCELLED')).toBe('neutral');
  });
});

describe('Progress', () => {
  it('clamps values above 100', () => {
    render(<Progress value={140} label="Raised" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});

describe('Field', () => {
  it('links the error text to the control', () => {
    render(
      <Field label="Phone" htmlFor="phone" error="Invalid phone">
        <Input id="phone" />
      </Field>
    );
    const input = screen.getByLabelText('Phone');
    const describedBy = input.getAttribute('aria-describedby') ?? '';
    expect(describedBy).not.toBe('');
    expect(document.getElementById(describedBy)?.textContent).toBe('Invalid phone');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});
