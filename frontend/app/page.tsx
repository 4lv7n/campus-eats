'use client';

import { useQuery } from '@apollo/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';
import FoodCard from '@/components/FoodCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import OutletCard from '@/components/OutletCard';
import SearchBar from '@/components/SearchBar';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/lib/auth';
import { getErrorMessage, homeFor, isCustomer } from '@/lib/format';
import { useToast } from '@/lib/toast';
import { MENU_ITEMS, OUTLETS } from '@/services/outlets';
import { MenuItem, Outlet } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem, adding } = useCart();
  const toast = useToast();
  const [search, setSearch] = useState('');

  const outlets = useQuery<{ outlets: Outlet[] }>(OUTLETS);
  const featured = useQuery<{ menuItems: MenuItem[] }>(MENU_ITEMS, { variables: { availableOnly: true } });

  function goSearch() {
    router.push(search.trim() ? `/outlets?search=${encodeURIComponent(search.trim())}` : '/outlets');
  }

  async function handleAdd(item: MenuItem) {
    if (!user) {
      toast('error', 'Please log in to add food to your cart.');
      router.push('/login');
      return;
    }
    if (!isCustomer(user.role)) {
      toast('error', 'Only students, faculty and hostellers can order food.');
      return;
    }
    await addItem(item.id, item.name);
  }

  return (
    <div className="space-y-12">
      {/* hero */}
      <section className="rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 px-5 py-10 text-white sm:px-10 sm:py-14">
        <p className="text-sm font-semibold uppercase tracking-widest text-orange-100">Campus Eats</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">Food from your campus, delivered to you.</h1>
        <p className="mt-3 max-w-xl text-orange-50">Order from the outlets inside your campus - skip the queue, pick up when it&apos;s ready.</p>
        <div className="mt-6 max-w-xl">
          <SearchBar value={search} onChange={setSearch} onSubmit={goSearch} placeholder="Search for shawarma, coffee, sandwich..." />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {user ? (
            <Link href={homeFor(user.role)} className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-50">
              Go to my dashboard
            </Link>
          ) : (
            <>
              <Link href="/register" className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-orange-600 hover:bg-orange-50">
                Register
              </Link>
              <Link href="/login" className="rounded-lg border border-white/70 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
                Login
              </Link>
            </>
          )}
        </div>
      </section>

      {/* outlets */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Campus outlets</h2>
          <Link href="/outlets" className="text-sm font-medium text-orange-600 hover:underline">
            View all →
          </Link>
        </div>
        {outlets.loading && !outlets.data ? (
          <LoadingSpinner />
        ) : outlets.error && !outlets.data ? (
          <ErrorMessage message={getErrorMessage(outlets.error)} onRetry={() => outlets.refetch()} />
        ) : outlets.data?.outlets.length === 0 ? (
          <EmptyState title="No outlets yet" text="Outlets will show up here once they are added." />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {outlets.data?.outlets.map((o) => <OutletCard key={o.id} outlet={o} />)}
          </div>
        )}
      </section>

      {/* featured food */}
      <section>
        <h2 className="mb-4 text-2xl font-bold">Featured food</h2>
        {featured.loading && !featured.data ? (
          <LoadingSpinner />
        ) : featured.error && !featured.data ? (
          <ErrorMessage message={getErrorMessage(featured.error)} onRetry={() => featured.refetch()} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.data?.menuItems.slice(0, 4).map((item) => (
              <FoodCard key={item.id} item={item} onAdd={handleAdd} busy={adding} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
