import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge, PriorityBadge } from '../components/Badge';

describe('StatusBadge', () => {
  it('renders a human-readable label for in_progress', () => {
    render(<StatusBadge status="in_progress" />);
    expect(screen.getByText('In progress')).toBeInTheDocument();
  });

  it('falls back to the raw value for unknown statuses', () => {
    render(<StatusBadge status="mystery" />);
    expect(screen.getByText('mystery')).toBeInTheDocument();
  });
});

describe('PriorityBadge', () => {
  it('renders Urgent for urgent priority', () => {
    render(<PriorityBadge priority="urgent" />);
    expect(screen.getByText('Urgent')).toBeInTheDocument();
  });
});
