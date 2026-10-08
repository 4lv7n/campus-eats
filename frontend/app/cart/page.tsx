'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CartItem from '@/components/CartItem';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useCart } from '@/hooks/useCart';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { formatPrice, getErrorMessage } from '@/lib/format';
import { cardClass, primaryBtn, secondaryBtn } from '@/lib/ui';

export default function CartPage() {
  const { ready } = useRequireAuth(['STUDENT', 'FACULTY', 'HOSTELLER']);
  const router = useRouter();
  const { cart, loading, error, setQuantity, removeItem, clear } = useCart();

  if (!ready || (loading && !cart)) return <LoadingSpinner />;
  if (error && !cart) return <ErrorMessage message={getErrorMessage(error)} />;

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Your cart</h1>

      {isEmpty ? (
        <EmptyState icon="🛒" title="Your cart is empty" text="Browse the campus outlets and add something tasty." actionLabel="Browse outlets" actionHref="/outlets" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            <p className="text-sm text-slate-500">
              Ordering from <span className="font-semibold text-slate-700">{cart.outletName}</span>
            </p>
            {cart.items.map((line) => (
              <CartItem key={line.menuItemId} line={line} onQuantity={setQuantity} onRemove={removeItem} />
            ))}
            <button onClick={clear} className="text-sm text-red-600 hover:underline">Clear cart</button>
          </div>

          <aside className={`${cardClass} h-fit space-y-4`}>
            <h2 className="text-lg font-bold">Order summary</h2>
            <dl className="space-y-2 text-sm">
              {cart.items.map((l) => (
                <div key={l.menuItemId} className="flex justify-between gap-2">
                  <dt className="text-slate-500">{l.quantity} × {l.name}</dt>
                  <dd>{formatPrice(l.price * l.quantity)}</dd>
                </div>
              ))}
            </dl>
            <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold">
              <span>Total</span>
              <span>{formatPrice(cart.total)}</span>
            </div>
            <button onClick={() => router.push('/checkout')} className={`${primaryBtn} w-full`}>Proceed to Checkout</button>
            <Link href="/outlets" className={`${secondaryBtn} block w-full text-center`}>Continue Shopping</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
