'use client';

import { useMutation } from '@apollo/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ErrorMessage from '@/components/ErrorMessage';
import { useAuth } from '@/lib/auth';
import { getErrorMessage, homeFor } from '@/lib/format';
import { inputClass, primaryBtn, cardClass } from '@/lib/ui';
import { LOGIN } from '@/services/auth';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loginMutation, { loading }] = useMutation(LOGIN);

  // already logged in? go to your own dashboard
  useEffect(() => {
    if (user) router.replace(homeFor(user.role));
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const { data } = await loginMutation({ variables: { input: { email, password } } });
      login(data.login.accessToken, data.login.user);
      router.push(homeFor(data.login.user.role));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className={cardClass}>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">Log in to order food from your campus outlets.</p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && <ErrorMessage message={error} />}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
            <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
            <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} autoComplete="current-password" />
          </div>
          <button type="submit" disabled={loading} className={`${primaryBtn} w-full`}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          New here?{' '}
          <Link href="/register" className="font-semibold text-orange-600 hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
