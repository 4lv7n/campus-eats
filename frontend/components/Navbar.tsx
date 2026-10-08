'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/lib/auth';
import { homeFor, isCustomer } from '@/lib/format';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false); // mobile menu

  // links depend on who is logged in
  const links = !user
    ? [{ href: '/outlets', label: 'Outlets' }]
    : isCustomer(user.role)
      ? [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/outlets', label: 'Outlets' },
          { href: '/orders', label: 'My Orders' },
          { href: '/profile', label: 'Profile' },
        ]
      : [
          { href: homeFor(user.role), label: user.role === 'ADMIN' ? 'Admin Panel' : 'Outlet Dashboard' },
          { href: '/profile', label: 'Profile' },
        ];

  const linkClass = (href: string) =>
    `rounded-lg px-3 py-2 text-sm font-medium ${pathname === href ? 'bg-orange-50 text-orange-600' : 'text-slate-600 hover:bg-slate-100'}`;

  function handleLogout() {
    logout();
    setOpen(false);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3" aria-label="Main">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-orange-600">
          🍔 CAMPUS EATS
        </Link>

        {/* desktop links */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(l.href)}>
              {l.label}
            </Link>
          ))}
          {user && isCustomer(user.role) && (
            <Link href="/cart" className={`${linkClass('/cart')} relative`} aria-label={`Cart, ${itemCount} items`}>
              🛒 Cart
              {itemCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-bold text-white">{itemCount}</span>}
            </Link>
          )}
          {loading ? null : user ? (
            <button onClick={handleLogout} className="ml-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
              Logout
            </button>
          ) : (
            <>
              <Link href="/login" className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Login
              </Link>
              <Link href="/register" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                Register
              </Link>
            </>
          )}
        </div>

        {/* mobile: cart + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {user && isCustomer(user.role) && (
            <Link href="/cart" className="relative rounded-lg p-2 text-xl" aria-label={`Cart, ${itemCount} items`}>
              🛒
              {itemCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-xs font-bold text-white">{itemCount}</span>}
            </Link>
          )}
          <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle menu" className="rounded-lg border border-slate-300 px-3 py-2 text-lg leading-none">
            {open ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {open && (
        <div className="flex flex-col gap-1 border-t border-slate-100 px-4 pb-4 pt-2 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={linkClass(l.href)}>
              {l.label}
            </Link>
          ))}
          {user ? (
            <button onClick={handleLogout} className="rounded-lg border border-slate-300 px-3 py-2 text-left text-sm font-medium text-slate-700">
              Logout ({user.name})
            </button>
          ) : (
            <div className="mt-1 flex gap-2">
              <Link href="/login" onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center text-sm font-medium">
                Login
              </Link>
              <Link href="/register" onClick={() => setOpen(false)} className="flex-1 rounded-lg bg-orange-500 px-3 py-2 text-center text-sm font-semibold text-white">
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
