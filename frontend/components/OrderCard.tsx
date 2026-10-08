import Link from 'next/link';
import { formatDate, formatPrice, shortId } from '@/lib/format';
import { Order } from '@/types';
import StatusBadge from './StatusBadge';

export default function OrderCard({ order }: { order: Order }) {
  const summary = order.items.map((i) => `${i.quantity} × ${i.name}`).join(', ');
  return (
    <Link href={`/orders/${order.id}`} className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-slate-800">{order.outletName}</p>
          <p className="text-xs text-slate-400">
            Order #{shortId(order.id)} · {formatDate(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.orderStatus} />
      </div>
      <p className="mt-2 line-clamp-1 text-sm text-slate-500">{summary}</p>
      <p className="mt-2 font-bold text-slate-800">{formatPrice(order.totalAmount)}</p>
    </Link>
  );
}
