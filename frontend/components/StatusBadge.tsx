import { statusLabel } from '@/lib/format';
import { OrderStatus } from '@/types';

const COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-indigo-100 text-indigo-800',
  READY: 'bg-emerald-100 text-emerald-800',
  COMPLETED: 'bg-slate-200 text-slate-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${COLORS[status]}`}>{statusLabel[status]}</span>;
}
