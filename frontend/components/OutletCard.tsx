import Link from 'next/link';
import { Outlet } from '@/types';
import FoodImage from './FoodImage';

export default function OutletCard({ outlet }: { outlet: Outlet }) {
  return (
    <Link href={`/outlets/${outlet.id}`} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <FoodImage src={outlet.image} name={outlet.name} category={outlet.name.includes('Brew') ? 'coffee' : 'wraps'} className="h-40 w-full" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-slate-800 group-hover:text-orange-600">{outlet.name}</h3>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${outlet.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
            {outlet.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{outlet.description}</p>
        <p className="mt-2 text-xs text-slate-400">📍 {outlet.location || 'On campus'}</p>
      </div>
    </Link>
  );
}
