'use client';

import { useMutation } from '@apollo/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ErrorMessage from '@/components/ErrorMessage';
import { useAuth } from '@/lib/auth';
import { getErrorMessage, homeFor } from '@/lib/format';
import { cardClass, inputClass, primaryBtn } from '@/lib/ui';
import { REGISTER } from '@/services/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'STUDENT' });
  const [error, setError] = useState('');
  const [registerMutation, { loading }] = useMutation(REGISTER);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    // check in the browser first, so the user gets instant feedback
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    try {
      const { name, email, password, role } = form;
      const { data } = await registerMutation({ variables: { input: { name, email, password, role } } });
      login(data.register.accessToken, data.register.user); // registering also logs you in
      router.push(homeFor(data.register.user.role));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className={cardClass}>
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">Students, faculty and hostellers can order from campus outlets.</p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && <ErrorMessage message={error} />}
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">Full name</label>
            <input id="name" required minLength={2} value={form.name} onChange={(e) => set('name', e.target.value)} className={inputClass} autoComplete="name" />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
            <input id="email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} autoComplete="email" />
          </div>
          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium">I am a</label>
            <select id="role" value={form.role} onChange={(e) => set('role', e.target.value)} className={inputClass}>
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
              <option value="HOSTELLER">Hosteller</option>
            </select>
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
            <input id="password" type="password" required value={form.password} onChange={(e) => set('password', e.target.value)} className={inputClass} autoComplete="new-password" />
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1 block text-sm font-medium">Confirm password</label>
            <input id="confirm" type="password" required value={form.confirm} onChange={(e) => set('confirm', e.target.value)} className={inputClass} autoComplete="new-password" />
          </div>
          <button type="submit" disabled={loading} className={`${primaryBtn} w-full`}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-orange-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
