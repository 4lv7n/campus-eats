import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CartItem from '@/components/CartItem';

const line = { menuItemId: 'm1', name: 'Cappuccino', image: '', price: 80, quantity: 2 };

describe('CartItem (cart)', () => {
  it('shows price, quantity and the line subtotal', () => {
    render(<CartItem line={line} onQuantity={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByText('₹80 each')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity')).toHaveTextContent('2');
    expect(screen.getByText('₹160')).toBeInTheDocument(); // 80 x 2
  });

  it('increase / decrease / remove call the right handlers', async () => {
    const onQuantity = jest.fn();
    const onRemove = jest.fn();
    render(<CartItem line={line} onQuantity={onQuantity} onRemove={onRemove} />);
    await userEvent.click(screen.getByLabelText('Increase Cappuccino'));
    expect(onQuantity).toHaveBeenLastCalledWith('m1', 3);
    await userEvent.click(screen.getByLabelText('Decrease Cappuccino'));
    expect(onQuantity).toHaveBeenLastCalledWith('m1', 1);
    await userEvent.click(screen.getByText('Remove'));
    expect(onRemove).toHaveBeenCalledWith('m1');
  });

  it('cannot go above 20 of one item', () => {
    render(<CartItem line={{ ...line, quantity: 20 }} onQuantity={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.getByLabelText('Increase Cappuccino')).toBeDisabled();
  });
});
