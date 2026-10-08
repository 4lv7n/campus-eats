'use client';

import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';
import FilterBar, { Filters } from '@/components/FilterBar';
import FoodCard from '@/components/FoodCard';
import FoodImage from '@/components/FoodImage';
import LoadingSpinner from '@/components/LoadingSpinner';
import SearchBar from '@/components/SearchBar';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/lib/auth';
import { getErrorMessage, isCustomer } from '@/lib/format';
import { useToast } from '@/lib/toast';
import { MENU_ITEMS, OUTLET } from '@/services/outlets';
import { MenuItem, Outlet } from '@/types';

export default function OutletDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();
  const { addItem, adding, itemCount } = useCart();

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Filters>({ category: '', maxPrice: '', availableOnly: false });

  const outletQuery = useQuery<{ outlet: Outlet }>(OUTLET, { variables: { id } });
  const menuQuery = useQuery<{ menuItems: MenuItem[] }>(MENU_ITEMS, { variables: { outletId: id } });

  const items = useMemo(() => menuQuery.data?.menuItems ?? [], [menuQuery.data]);
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))).sort(), [items]);

  // Filtering happens in the browser: the whole menu of one outlet is small.
  const visible = items.filter((item) => {
    if (search.trim() && !item.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
    if (filters.category && item.category !== filters.category) return false;
    if (filters.maxPrice && item.price > Number(filters.maxPrice)) return false;
    if (filters.availableOnly && !item.available) return false;
    return true;
  });

  async function handleAdd(item: MenuItem) {
    if (!user) {
      toast('error', 'Please log in to add food to your cart.');
      router.push('/login');
      return;
    }
    if (!isCustomer(user.role)) return toast('error', 'Only students, faculty and hostellers can order food.');
    await addItem(item.id, item.name);
  }

  if (outletQuery.loading && !outletQuery.data) return <LoadingSpinner />;
  if (outletQuery.error || !outletQuery.data) {
    return <ErrorMessage message={outletQuery.error ? getErrorMessage(outletQuery.error) : 'Outlet not found.'} />;
  }
  const outlet = outletQuery.data.outlet;

  return (
    <div className="space-y-6">
      <Link href="/outlets" className="text-sm text-orange-600 hover:underline">← All outlets</Link>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <FoodImage src={outlet.image} name={outlet.name} category={outlet.name.includes('Brew') ? 'coffee' : 'wraps'} className="h-44 w-full sm:h-56" />
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">{outlet.name}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${outlet.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
              {outlet.isOpen ? '● Open' : '● Closed'}
            </span>
          </div>
          <p className="mt-2 text-slate-600">{outlet.description}</p>
          <p className="mt-1 text-sm text-slate-400">📍 {outlet.location}</p>
          {!outlet.isOpen && <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">This outlet is closed right now. You can browse the menu but cannot order.</p>}
        </div>
      </div>

      <div className="space-y-3">
        <SearchBar value={search} onChange={setSearch} placeholder={`Search ${outlet.name} menu...`} className="max-w-xl" />
        <FilterBar filters={filters} categories={categories} onChange={setFilters} />
      </div>

      {menuQuery.loading && !menuQuery.data ? (
        <LoadingSpinner label="Loading menu..." />
      ) : menuQuery.error && !menuQuery.data ? (
        <ErrorMessage message={getErrorMessage(menuQuery.error)} onRetry={() => menuQuery.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title="Menu coming soon" text="This outlet has not added any food yet." />
      ) : visible.length === 0 ? (
        <EmptyState icon="🔍" title="No food matches your filters" text="Try clearing the filters or searching for something else." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item) => <FoodCard key={item.id} item={item} onAdd={handleAdd} outletClosed={!outlet.isOpen} busy={adding} />)}
        </div>
      )}

      {itemCount > 0 && (
        <Link href="/cart" className="fixed bottom-4 right-4 z-20 rounded-full bg-orange-500 px-5 py-3 font-semibold text-white shadow-lg hover:bg-orange-600">
          🛒 View cart ({itemCount})
        </Link>
      )}
    </div>
  );
}
