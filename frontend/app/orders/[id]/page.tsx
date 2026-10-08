'use client';

import { useMutation, useQuery } from '@apollo/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import OrderStatusTracker from '@/components/OrderStatusTracker';
import StatusBadge from '@/components/StatusBadge';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { formatDate, formatPrice, getErrorMessage, isFinalStatus, shortId } from '@/lib/format';
import { cardClass, secondaryBtn } from '@/lib/ui';
import { ORDER, UPDATE_ORDER_STATUS } from '@/services/orders';
import { Order, PaymentStatus } from '@/types';

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  SUCCESS: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-800',
  FAILED: 'bg-red-100 text-red-700',
};

export default function OrderDetailPage() {
  const { ready, user } = useRequireAuth();
  const { id } = useParams<{ id: string }>();
  const [cancelError, setCancelError] = useState('');

  // pollInterval: re-ask the server every 5 seconds so the tracker updates by itself
  const { data, loading, error, refetch } = useQuery<{ order: Order; orderPayment: { transactionId: string } | null }>(ORDER, {
    variables: { id },
    skip: !ready,
    pollInterval: 5000,
  });
  const [updateStatus, { loading: cancelling }] = useMutation(UPDATE_ORDER_STATUS);

  if (!ready || (loading && !data)) return <LoadingSpinner label="Loading your order..." />;
  if (error && !data) return <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />;
  if (!data) return null;

  const { order, orderPayment } = data;
  const isOwner = order.userId === user?.id; // cancel button is only for the customer's own pending order

  async function cancel() {
    setCancelError('');
    try {
      await updateStatus({ variables: { input: { orderId: order.id, status: 'CANCELLED' } } });
      await refetch();
    } catch (e) {
      setCancelError(getErrorMessage(e));
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/orders" className="text-sm text-orange-600 hover:underline">← All orders</Link>

      <div className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">Order #{shortId(order.id)}</h1>
          <StatusBadge status={order.orderStatus} />
        </div>
        <div className="mt-6 sm:px-4">
          <OrderStatusTracker status={order.orderStatus} />
        </div>
        {order.orderStatus === 'READY' && <p className="mt-5 rounded-lg bg-emerald-50 px-4 py-3 text-center font-semibold text-emerald-700">🛎️ Your order is ready - please collect it from {order.outletName}!</p>}
        {!isFinalStatus(order.orderStatus) && <p className="mt-4 text-center text-xs text-slate-400">This page updates automatically.</p>}
      </div>

      <div className={`${cardClass} space-y-4`}>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Order ID</dt><dd className="break-all font-mono text-xs">{order.id}</dd></div>
          <div><dt className="text-slate-500">Outlet</dt><dd className="font-medium">{order.outletName}</dd></div>
          <div><dt className="text-slate-500">Placed on</dt><dd>{formatDate(order.createdAt)}</dd></div>
          <div>
            <dt className="text-slate-500">Payment</dt>
            <dd className="flex flex-wrap items-center gap-2">
              <span>{order.paymentMethod}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAYMENT_COLORS[order.paymentStatus]}`}>{order.paymentStatus}</span>
            </dd>
          </div>
          {orderPayment && <div><dt className="text-slate-500">Transaction reference</dt><dd className="font-mono text-xs">{orderPayment.transactionId}</dd></div>}
        </dl>

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
              {order.items.map((i) => (
                <tr key={i.menuItemId} className="border-b border-slate-100">
                  <td className="py-2">{i.name}</td>
                  <td className="py-2 text-right">{formatPrice(i.price)}</td>
                  <td className="py-2 text-right">{i.quantity}</td>
                  <td className="py-2 text-right">{formatPrice(i.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(order.totalAmount)}</span>
        </div>
      </div>

      {cancelError && <ErrorMessage message={cancelError} />}
      {order.orderStatus === 'PENDING' && isOwner && (
        <button onClick={cancel} disabled={cancelling} className={secondaryBtn}>
          {cancelling ? 'Cancelling...' : 'Cancel order'}
        </button>
      )}
    </div>
  );
}
