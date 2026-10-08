import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FoodCard from '@/components/FoodCard';
import { MenuItem } from '@/types';

const item: MenuItem = {
  id: 'm1', outletId: 'o1', name: 'Chicken Shawarma', description: 'Tasty wrap', price: 120, image: '', category: 'Wraps', available: true,
};

describe('FoodCard (menu)', () => {
  it('shows name, description, price and category', () => {
    render(<FoodCard item={item} onAdd={jest.fn()} />);
    expect(screen.getByText('Chicken Shawarma')).toBeInTheDocument();
    expect(screen.getByText('Tasty wrap')).toBeInTheDocument();
    expect(screen.getByText('₹120')).toBeInTheDocument();
    expect(screen.getByText('Wraps')).toBeInTheDocument();
  });

  it('calls onAdd with the item when "Add to Cart" is clicked', async () => {
    const onAdd = jest.fn();
    render(<FoodCard item={item} onAdd={onAdd} />);
    await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(onAdd).toHaveBeenCalledWith(item);
  });

  it('disables the button when the food is unavailable', async () => {
    const onAdd = jest.fn();
    render(<FoodCard item={{ ...item, available: false }} onAdd={onAdd} />);
    const button = screen.getByRole('button', { name: /unavailable/i });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('disables the button when the outlet is closed', () => {
    render(<FoodCard item={item} onAdd={jest.fn()} outletClosed />);
    expect(screen.getByRole('button', { name: /outlet closed/i })).toBeDisabled();
  });
});
