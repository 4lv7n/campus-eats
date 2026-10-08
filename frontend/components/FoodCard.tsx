'use client';

import { formatPrice } from '@/lib/format';
import { MenuItem } from '@/types';
import FoodImage from './FoodImage';

interface Props {
  item: MenuItem;
  onAdd: (item: MenuItem) => void;
  outletClosed?: boolean;
  busy?: boolean;
}

export default function FoodCard({ item, onAdd, outletClosed = false, busy = false }: Props) {
  const canAdd = item.available && !outletClosed;
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative">
        <FoodImage src={item.image} name={item.name} category={item.category} className={`h-36 w-full ${item.available ? '' : 'opacity-50 grayscale'}`} />
        <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-slate-600">{item.category}</span>
        {!item.available && <span className="absolute right-2 top-2 rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white">Unavailable</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-slate-800">{item.name}</h3>
        {item.outletName && <p className="text-xs text-slate-400">{item.outletName}</p>}
        <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">{item.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-bold text-slate-800">{formatPrice(item.price)}</span>
          <button
            onClick={() => onAdd(item)}
            disabled={!canAdd || busy}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {!item.available ? 'Unavailable' : outletClosed ? 'Outlet closed' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
