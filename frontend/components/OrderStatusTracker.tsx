import { OrderStatus } from '@/types';

// The 5 normal steps of an order (REJECTED / CANCELLED are shown as a banner instead).
const STEPS: { status: OrderStatus; label: string; icon: string }[] = [
  { status: 'PENDING', label: 'Order Placed', icon: '📝' },
  { status: 'ACCEPTED', label: 'Accepted', icon: '👍' },
  { status: 'PREPARING', label: 'Preparing', icon: '👨‍🍳' },
  { status: 'READY', label: 'Ready', icon: '🛎️' },
  { status: 'COMPLETED', label: 'Completed', icon: '✅' },
];

export default function OrderStatusTracker({ status }: { status: OrderStatus }) {
  if (status === 'REJECTED' || status === 'CANCELLED') {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-lg font-bold text-red-700">{status === 'REJECTED' ? 'Order rejected by the outlet' : 'Order cancelled'}</p>
        <p className="mt-1 text-sm text-red-600">
          {status === 'REJECTED' ? 'The outlet could not take this order. Please try another time.' : 'This order was cancelled.'}
        </p>
      </div>
    );
  }

  const current = STEPS.findIndex((s) => s.status === status);
  return (
    <ol className="flex items-start justify-between" aria-label="Order progress">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={step.status} className="relative flex flex-1 flex-col items-center text-center" aria-current={active ? 'step' : undefined}>
            {/* line to the previous step */}
            {i > 0 && <div className={`absolute right-1/2 top-5 -z-0 h-1 w-full ${i <= current ? 'bg-orange-500' : 'bg-slate-200'}`} />}
            <div
              className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-lg ${
                active ? 'bg-orange-500 ring-4 ring-orange-200' : done ? 'bg-orange-500' : 'bg-slate-200 grayscale'
              }`}
            >
              {done ? <span className="text-white">✓</span> : step.icon}
            </div>
            <span className={`mt-2 text-xs sm:text-sm ${active ? 'font-bold text-orange-600' : done ? 'font-medium text-slate-700' : 'text-slate-400'}`}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
