'use client';

import { useQuery } from '@apollo/client';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import OrderCard from '@/components/OrderCard';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { getErrorMessage } from '@/lib/format';
import { MY_ORDERS } from '@/services/orders';
import { Order } from '@/types';

export default function OrdersPage() {
  const { ready } = useRequireAuth(['STUDENT', 'FACULTY', 'HOSTELLER']);
  const { data, loading, error, refetch } = useQuery<{ myOrders: Order[] }>(MY_ORDERS, { skip: !ready, pollInterval: 15000 });

  if (!ready || (loading && !data)) return <LoadingSpinner />;
  if (error && !data) return <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />;

  const orders = data?.myOrders ?? [];
  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-bold">Order history</h1>
      {orders.length === 0 ? (
        <EmptyState icon="🧾" title="No orders yet" text="Your orders will appear here after you place one." actionLabel="Order food" actionHref="/outlets" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {orders.map((o) => <OrderCard key={o.id} order={o} />)}
        </div>
      )}
    </div>
  );
}
