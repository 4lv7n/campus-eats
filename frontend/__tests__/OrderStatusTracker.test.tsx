import { render, screen } from '@testing-library/react';
import OrderStatusTracker from '@/components/OrderStatusTracker';

describe('OrderStatusTracker (order tracking)', () => {
  it('shows all five steps and highlights the current one', () => {
    render(<OrderStatusTracker status="PREPARING" />);
    ['Order Placed', 'Accepted', 'Preparing', 'Ready', 'Completed'].forEach((label) => expect(screen.getByText(label)).toBeInTheDocument());
    const current = screen.getByText('Preparing').closest('li');
    expect(current).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Accepted').closest('li')).not.toHaveAttribute('aria-current');
  });

  it('marks earlier steps as done with a tick', () => {
    render(<OrderStatusTracker status="READY" />);
    expect(screen.getAllByText('✓')).toHaveLength(3); // placed, accepted, preparing
  });

  it('shows a clear banner instead of the steps when rejected or cancelled', () => {
    const { rerender } = render(<OrderStatusTracker status="REJECTED" />);
    expect(screen.getByRole('alert')).toHaveTextContent(/rejected/i);
    rerender(<OrderStatusTracker status="CANCELLED" />);
    expect(screen.getByRole('alert')).toHaveTextContent(/cancelled/i);
    expect(screen.queryByText('Preparing')).not.toBeInTheDocument();
  });
});
