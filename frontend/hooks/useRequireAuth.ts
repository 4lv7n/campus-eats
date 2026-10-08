'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { homeFor } from '@/lib/format';
import { Role } from '@/types';

// Protects a page: not logged in -> /login. Wrong role -> that role's own home page.
// (The REAL protection is the backend guards; this just gives a good user experience.)
export function useRequireAuth(allowedRoles?: Role[]) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const roleAllowed = !!user && (!allowedRoles || allowedRoles.includes(user.role));

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (!roleAllowed) router.replace(homeFor(user.role));
  }, [loading, user, roleAllowed, router]);

  return { user, ready: !loading && roleAllowed };
}
