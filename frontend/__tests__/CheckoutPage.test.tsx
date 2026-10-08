import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckoutPage from '@/app/checkout/page';
import { CART } from '@/services/cart';
import { CREATE_ORDER } from '@/services/orders';

const push = jest.fn();
let mockCart: unknown;
jest.mock('next/navigation', () => ({ useRouter: () => ({ push, replace: jest.fn() }) }));
jest.mock('@/hooks/useRequireAuth', () => ({ useRequireAuth: () => ({ ready: true, user: { id: 'u1' } }) }));
jest.mock('@/hooks/useCart', () => ({ useCart: () => ({ cart: mockCart, loading: false }) }));

const cart = {
  id: 'c1', outletId: 'o1', outletName: 'Shawarma Shack', total: 260,
  items: [
    { menuItemId: 'm1', name: 'Chicken Shawarma', image: '', price: 120, quantity: 1 },
    { menuItemId: 'm2', name: 'Beef Shawarma', image: '', price: 140, quantity: 1 },
  ],
};

function setup(mocks: MockedResponse[] = []) {
  render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <CheckoutPage />
    </MockedProvider>,
  );
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCart = cart;
  });

  it('does not allow checkout with an empty cart', () => {
    mockCart = { ...cart, items: [] };
    setup();
    expect(screen.getByText('Nothing to check out')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /place order/i })).not.toBeInTheDocument();
  });

  it('shows outlet, items, quantity, total, payment method and payment status', () => {
    setup();
    expect(screen.getByText('Shawarma Shack')).toBeInTheDocument();
    expect(screen.getByText('Chicken Shawarma')).toBeInTheDocument();
    expect(screen.getByText('₹260')).toBeInTheDocument();
    expect(screen.getByLabelText(/^UPI/)).toBeChecked();
    expect(screen.getByText('Pending')).toBeInTheDocument(); // payment status
  });

  it('places the order with the chosen payment method and redirects to the tracking page', async () => {
    setup([
      {
        request: { query: CREATE_ORDER, variables: { input: { paymentMethod: 'CASH', simulatePaymentFailure: false } } },
        result: { data: { createOrder: { id: 'order123', userId: 'u1', userName: 'S', outletId: 'o1', outletName: 'Shawarma Shack', totalAmount: 260, paymentMethod: 'CASH', paymentStatus: 'PENDING', orderStatus: 'PENDING', createdAt: '', updatedAt: '', items: [] } } },
      },
      { request: { query: CART }, result: { data: { cart } } },
    ]);
    await userEvent.click(screen.getByLabelText(/Cash at counter/));
    await userEvent.click(screen.getByRole('button', { name: /place order/i }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/orders/order123'));
    await waitFor(() => expect(screen.getByRole('button', { name: /place order/i })).toBeEnabled());
  });

  it('shows the error and stays on the page when payment fails', async () => {
    setup([
      {
        request: { query: CREATE_ORDER, variables: { input: { paymentMethod: 'UPI', simulatePaymentFailure: true } } },
        result: { errors: [{ message: 'Payment failed. Your cart is saved - please try again.' } as never] },
      },
    ]);
    await userEvent.click(screen.getByLabelText(/simulate a payment failure/i));
    await userEvent.click(screen.getByRole('button', { name: /place order/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Payment failed/);
    expect(push).not.toHaveBeenCalled();
  });
});
