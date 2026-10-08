'use client';

import { useQuery } from '@apollo/client';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';
import FoodCard from '@/components/FoodCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import OutletCard from '@/components/OutletCard';
import SearchBar from '@/components/SearchBar';
import { useCart } from '@/hooks/useCart';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/lib/auth';
import { getErrorMessage, isCustomer } from '@/lib/format';
import { useToast } from '@/lib/toast';
import { MENU_ITEMS, OUTLETS } from '@/services/outlets';
import { MenuItem, Outlet } from '@/types';
import { useRouter } from 'next/navigation';

function OutletsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  const { addItem, adding } = useCart();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const term = useDebounce(search.trim());

  // Search by outlet name AND by food name at the same time.
  const outlets = useQuery<{ outlets: Outlet[] }>(OUTLETS, { variables: { search: term || undefined } });
  const food = useQuery<{ menuItems: MenuItem[] }>(MENU_ITEMS, { variables: { search: term }, skip: !term });

  async function handleAdd(item: MenuItem) {
    if (!user) {
      toast('error', 'Please log in to add food to your cart.');
      router.push('/login');
      return;
    }
    if (!isCustomer(user.role)) return toast('error', 'Only students, faculty and hostellers can order food.');
    await addItem(item.id, item.name);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Campus outlets</h1>
        <p className="mt-1 text-slate-500">Pick an outlet, or search for a dish across all of them.</p>
        <SearchBar value={search} onChange={setSearch} className="mt-4 max-w-xl" />
      </div>

      <section>
        <h2 className="mb-3 text-xl font-bold">Outlets</h2>
        {outlets.loading && !outlets.data ? (
          <LoadingSpinner />
        ) : outlets.error && !outlets.data ? (
          <ErrorMessage message={getErrorMessage(outlets.error)} onRetry={() => outlets.refetch()} />
        ) : outlets.data?.outlets.length === 0 ? (
          <EmptyState icon="🔍" title="No outlets match your search" text="Try a different name, or look at the food results below." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {outlets.data?.outlets.map((o) => <OutletCard key={o.id} outlet={o} />)}
          </div>
        )}
      </section>

      {term && (
        <section>
          <h2 className="mb-3 text-xl font-bold">Food matching &ldquo;{term}&rdquo;</h2>
          {food.loading && !food.data ? (
            <LoadingSpinner />
          ) : food.data?.menuItems.length === 0 ? (
            <EmptyState icon="🔍" title="No food found" text="Try another dish name." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {food.data?.menuItems.map((item) => <FoodCard key={item.id} item={item} onAdd={handleAdd} busy={adding} />)}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

// useSearchParams() must be inside <Suspense> in the Next.js App Router
export default function OutletsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <OutletsContent />
    </Suspense>
  );
}
