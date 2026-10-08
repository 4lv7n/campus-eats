'use client';

import { useMutation } from '@apollo/client';
import { useState } from 'react';
import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/lib/auth';
import { getErrorMessage, roleLabel } from '@/lib/format';
import { useToast } from '@/lib/toast';
import { cardClass, inputClass, primaryBtn } from '@/lib/ui';
import { UPDATE_PROFILE } from '@/services/auth';

export default function ProfilePage() {
  const { ready, user } = useRequireAuth();
  const { setUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [updateProfile, { loading }] = useMutation(UPDATE_PROFILE);

  if (!ready || !user) return <LoadingSpinner />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const input: Record<string, string> = { name: (name ?? user!.name).trim() };
    if (newPassword) {
      input.currentPassword = currentPassword;
      input.newPassword = newPassword;
    }
    try {
      const { data } = await updateProfile({ variables: { input } });
      setUser(data.updateProfile);
      setCurrentPassword('');
      setNewPassword('');
      toast('success', 'Profile updated');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="text-3xl font-bold">My profile</h1>
      <div className={cardClass}>
        <dl className="mb-5 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Email</dt><dd className="break-all font-medium">{user.email}</dd></div>
          <div><dt className="text-slate-500">Role</dt><dd className="font-medium">{roleLabel[user.role]}</dd></div>
        </dl>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <ErrorMessage message={error} />}
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">Name</label>
            <input id="name" minLength={2} required value={name ?? user.name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <fieldset className="space-y-3 rounded-lg border border-slate-200 p-3">
            <legend className="px-1 text-sm font-medium text-slate-600">Change password (optional)</legend>
            <input type="password" placeholder="Current password" aria-label="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} autoComplete="current-password" />
            <input type="password" placeholder="New password (min 6 characters)" aria-label="New password" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} autoComplete="new-password" />
          </fieldset>
          <button type="submit" disabled={loading} className={primaryBtn}>{loading ? 'Saving...' : 'Save changes'}</button>
        </form>
      </div>
    </div>
  );
}
