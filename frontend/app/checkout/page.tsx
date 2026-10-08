'use client';

import { useMutation } from '@apollo/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useCart } from '@/hooks/useCart';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { formatPrice, getErrorMessage } from '@/lib/format';
import { cardClass, primaryBtn } from '@/lib/ui';
import { CART } from '@/services/cart';
import { CREATE_ORDER } from '@/services/orders';
import { PaymentMethod } from '@/types';

const METHODS: { value: PaymentMethod; label: string; hint: string }[] = [
  { value: 'UPI', label: 'UPI', hint: 'Demo payment - succeeds instantly' },
  { value: 'CARD', label: 'Card', hint: 'Demo payment - succeeds instantly' },
  { value: 'CASH', label: 'Cash at counter', hint: 'Pay when you collect your order' },
];

export default function CheckoutPage() {
  const { ready } = useRequireAuth(['STUDENT', 'FACULTY', 'HOSTELLER']);
  const router = useRouter();
  const { cart, loading } = useCart();
  const [method, setMethod] = useState<PaymentMethod>('UPI');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [error, setError] = useState('');
  const [createOrder, { loading: placing }] = useMutation(CREATE_ORDER, { refetchQueries: [CART] });

  if (!ready || (loading && !cart)) return <LoadingSpinner />;

  // Do not allow checkout with an empty cart.
  if (!cart || cart.items.length === 0) {
    return <EmptyState icon="🛒" title="Nothing to check out" text="Your cart is empty." actionLabel="Browse outlets" actionHref="/outlets" />;
  }

  async function placeOrder() {
    setError('');
    try {
      const { data } = await createOrder({ variables: { input: { paymentMethod: method, simulatePaymentFailure: simulateFailure } } });
      router.push(`/orders/${data.createOrder.id}`); // go to the tracking page
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className={cardClass}>
            <h2 className="text-lg font-bold">Outlet</h2>
            <p className="mt-1 text-slate-600">{cart.outletName}</p>
          </section>

          <section className={cardClass}>
            <h2 className="mb-3 text-lg font-bold">Your items</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="py-2 font-medium">Item</th>
                    <th className="py-2 text-right font-medium">Price</th>
                    <th className="py-2 text-right font-medium">Qty</th>
                    <th className="py-2 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.items.map((l) => (
                    <tr key={l.menuItemId} className="border-b border-slate-100">
                      <td className="py-2">{l.name}</td>
                      <td className="py-2 text-right">{formatPrice(l.price)}</td>
                      <td className="py-2 text-right">{l.quantity}</td>
                      <td className="py-2 text-right font-medium">{formatPrice(l.price * l.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Link href="/cart" className="mt-3 inline-block text-sm text-orange-600 hover:underline">← Edit cart</Link>
          </section>

          <section className={cardClass}>
            <h2 className="mb-3 text-lg font-bold">Payment method</h2>
            <div className="space-y-2" role="radiogroup" aria-label="Payment method">
              {METHODS.map((m) => (
                <label key={m.value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${method === m.value ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}>
                  <input type="radio" name="payment" value={m.value} checked={method === m.value} onChange={() => setMethod(m.value)} className="h-4 w-4 accent-orange-500" />
                  <span>
                    <span className="block font-medium">{m.label}</span>
                    <span className="block text-xs text-slate-500">{m.hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <label className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <input type="checkbox" checked={simulateFailure} onChange={(e) => setSimulateFailure(e.target.checked)} className="h-4 w-4 accent-red-500" />
              Demo only: simulate a payment failure
            </label>
          </section>
        </div>

        <aside className={`${cardClass} h-fit space-y-4`}>
          <h2 className="text-lg font-bold">Summary</h2>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Payment status</span>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
              {method === 'CASH' ? 'Pay at counter' : 'Pending'}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-3 text-xl font-bold">
            <span>Total</span>
            <span>{formatPrice(cart.total)}</span>
          </div>
          {error && <ErrorMessage message={error} />}
          <button onClick={placeOrder} disabled={placing} className={`${primaryBtn} w-full`}>
            {placing ? 'Placing order...' : 'PLACE ORDER'}
          </button>
        </aside>
      </div>
    </div>
  );
}
