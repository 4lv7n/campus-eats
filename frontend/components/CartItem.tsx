'use client';

import { formatPrice } from '@/lib/format';
import { CartLine } from '@/types';
import FoodImage from './FoodImage';

interface Props {
  line: CartLine;
  onQuantity: (menuItemId: string, quantity: number) => void;
  onRemove: (menuItemId: string) => void;
}

export default function CartItem({ line, onQuantity, onRemove }: Props) {
  const btn = 'flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-lg font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40';
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:gap-4 sm:p-4">
      <FoodImage src={line.image} name={line.name} className="h-16 w-16 shrink-0 rounded-lg sm:h-20 sm:w-20" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-slate-800">{line.name}</h3>
        <p className="text-sm text-slate-500">{formatPrice(line.price)} each</p>
        <div className="mt-2 flex items-center gap-3">
          <button aria-label={`Decrease ${line.name}`} className={btn} onClick={() => onQuantity(line.menuItemId, line.quantity - 1)}>
            −
          </button>
          <span className="w-6 text-center font-semibold" aria-label="Quantity">{line.quantity}</span>
          <button aria-label={`Increase ${line.name}`} className={btn} disabled={line.quantity >= 20} onClick={() => onQuantity(line.menuItemId, line.quantity + 1)}>
            +
          </button>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-slate-800">{formatPrice(line.price * line.quantity)}</p>
        <button onClick={() => onRemove(line.menuItemId)} className="mt-2 text-sm text-red-600 hover:underline">
          Remove
        </button>
      </div>
    </div>
  );
}
