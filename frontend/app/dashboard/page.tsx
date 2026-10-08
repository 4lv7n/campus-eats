'use client';

import { useQuery } from '@apollo/client';
import Link from 'next/link';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';
import OrderCard from '@/components/OrderCard';
import OutletCard from '@/components/OutletCard';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { isFinalStatus, roleLabel } from '@/lib/format';
import { cardClass } from '@/lib/ui';
import { MY_ORDERS } from '@/services/orders';
import { OUTLETS } from '@/services/outlets';
import { Order, Outlet } from '@/types';

export default function DashboardPage() {
  const { ready, user } = useRequireAuth(['STUDENT', 'FACULTY', 'HOSTELLER']);
  const orders = useQuery<{ myOrders: Order[] }>(MY_ORDERS, { skip: !ready, pollInterval: 10000 });
  const outlets = useQuery<{ outlets: Outlet[] }>(OUTLETS, { skip: !ready });

  if (!ready || !user) return <LoadingSpinner />;

  const all = orders.data?.myOrders ?? [];
  const current = all.filter((o) => !isFinalStatus(o.orderStatus));
  const recent = all.filter((o) => isFinalStatus(o.orderStatus)).slice(0, 3);

  const actions = [
    { href: '/outlets', icon: '🍽️', label: 'Browse outlets' },
    { href: '/cart', icon: '🛒', label: 'View cart' },
    { href: '/orders', icon: '🧾', label: 'Order history' },
    { href: '/profile', icon: '👤', label: 'My profile' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user.name.split(' ')[0]}! 👋</h1>
        <p className="mt-1 text-slate-500">{roleLabel[user.role]} · What are you craving today?</p>
      </div>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {actions.map((a) => (
          <Link key={a.href} href={a.href} className={`${cardClass} text-center transition hover:border-orange-300 hover:shadow-md`}>
            <div className="text-3xl">{a.icon}</div>
            <p className="mt-1 text-sm font-semibold">{a.label}</p>
          </Link>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Current orders</h2>
        {orders.loading && !orders.data ? (
          <LoadingSpinner />
        ) : current.length === 0 ? (
          <EmptyState icon="⏳" title="No active orders" text="Orders that are being prepared will show up here." actionLabel="Order food" actionHref="/outlets" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">{current.map((o) => <OrderCard key={o.id} order={o} />)}</div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-xl font-bold">Recent orders</h2>
          <Link href="/orders" className="text-sm font-medium text-orange-600 hover:underline">See all →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">Your finished orders will appear here.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">{recent.map((o) => <OrderCard key={o.id} order={o} />)}</div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold">Available outlets</h2>
        {outlets.loading && !outlets.data ? (
          <LoadingSpinner />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{outlets.data?.outlets.map((o) => <OutletCard key={o.id} outlet={o} />)}</div>
        )}
      </section>
    </div>
  );
}
