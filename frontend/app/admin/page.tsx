'use client';

import { useMutation, useQuery } from '@apollo/client';
import { useState } from 'react';
import DashboardCard from '@/components/DashboardCard';
import EmptyState from '@/components/EmptyState';
import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { formatDate, formatPrice, getErrorMessage, roleLabel, shortId } from '@/lib/format';
import { useToast } from '@/lib/toast';
import { cardClass, inputClass, primaryBtn, secondaryBtn } from '@/lib/ui';
import {
  ADMIN_ORDERS, ADMIN_OUTLETS, ADMIN_STATS, ADMIN_USERS, ASSIGN_OUTLET_STAFF,
  CREATE_OUTLET, SET_USER_ACTIVE, SYSTEM_ACTIVITY, UPDATE_OUTLET,
} from '@/services/admin';
import { ActivityEntry, AdminStats, Order, Outlet, User } from '@/types';

type Tab = 'overview' | 'users' | 'outlets' | 'orders' | 'activity';
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'outlets', label: 'Outlets' },
  { id: 'orders', label: 'Orders' },
  { id: 'activity', label: 'System Activity' },
];

export default function AdminPage() {
  const { ready } = useRequireAuth(['ADMIN']);
  const [tab, setTab] = useState<Tab>('overview');
  if (!ready) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin dashboard</h1>
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold ${tab === t.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'overview' && <Overview />}
      {tab === 'users' && <UsersTab />}
      {tab === 'outlets' && <OutletsTab />}
      {tab === 'orders' && <OrdersTab />}
      {tab === 'activity' && <ActivityTab />}
    </div>
  );
}

function Overview() {
  const stats = useQuery<{ adminStats: AdminStats }>(ADMIN_STATS, { pollInterval: 15000 });
  const activity = useQuery<{ systemActivity: ActivityEntry[] }>(SYSTEM_ACTIVITY);
  if (stats.loading && !stats.data) return <LoadingSpinner />;
  if (stats.error && !stats.data) return <ErrorMessage message={getErrorMessage(stats.error)} onRetry={() => stats.refetch()} />;
  const s = stats.data!.adminStats;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard icon="👥" label="Total users" value={s.totalUsers} tone="blue" />
        <DashboardCard icon="🏪" label="Total outlets" value={s.totalOutlets} tone="purple" />
        <DashboardCard icon="📦" label="Total orders" value={s.totalOrders} tone="orange" />
        <DashboardCard icon="💰" label="Total order value" value={formatPrice(s.totalOrderValue)} tone="green" />
      </div>
      <div className={cardClass}>
        <h2 className="mb-3 text-lg font-bold">Latest activity</h2>
        <ActivityList entries={activity.data?.systemActivity.slice(0, 6) ?? []} />
      </div>
    </div>
  );
}

function ActivityList({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) return <p className="text-sm text-slate-500">Nothing has happened yet.</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {entries.map((a, i) => (
        <li key={i} className="flex items-start gap-3 py-2 text-sm">
          <span aria-hidden>{a.type === 'ORDER' ? '📦' : '👤'}</span>
          <span className="flex-1">{a.message}</span>
          <span className="shrink-0 text-xs text-slate-400">{formatDate(a.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}

function ActivityTab() {
  const { data, loading, error, refetch } = useQuery<{ systemActivity: ActivityEntry[] }>(SYSTEM_ACTIVITY, { pollInterval: 15000 });
  if (loading && !data) return <LoadingSpinner />;
  if (error && !data) return <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />;
  return <div className={cardClass}><ActivityList entries={data?.systemActivity ?? []} /></div>;
}

// ---------------- Users ----------------
function UsersTab() {
  const toast = useToast();
  const users = useQuery<{ adminUsers: User[] }>(ADMIN_USERS);
  const outlets = useQuery<{ adminOutlets: Outlet[] }>(ADMIN_OUTLETS);
  const [setActive] = useMutation(SET_USER_ACTIVE);
  const [assign] = useMutation(ASSIGN_OUTLET_STAFF);

  async function toggle(u: User) {
    try {
      await setActive({ variables: { userId: u.id, isActive: !u.isActive } });
      toast('success', `${u.name} ${u.isActive ? 'deactivated' : 'activated'}`);
    } catch (e) {
      toast('error', getErrorMessage(e));
    }
  }

  async function makeStaff(u: User, outletId: string) {
    if (!outletId) return;
    try {
      await assign({ variables: { userId: u.id, outletId } });
      toast('success', `${u.name} is now staff of that outlet`);
      await users.refetch();
    } catch (e) {
      toast('error', getErrorMessage(e));
    }
  }

  if (users.loading && !users.data) return <LoadingSpinner />;
  if (users.error && !users.data) return <ErrorMessage message={getErrorMessage(users.error)} onRetry={() => users.refetch()} />;
  const outletName = (id?: string | null) => outlets.data?.adminOutlets.find((o) => o.id === id)?.name;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Role</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Assign to outlet</th>
            <th className="px-4 py-3 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {users.data!.adminUsers.map((u) => (
            <tr key={u.id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-medium">{u.name}</td>
              <td className="px-4 py-3 text-slate-500">{u.email}</td>
              <td className="px-4 py-3">
                {roleLabel[u.role]}
                {u.role === 'OUTLET_STAFF' && outletName(u.outletId) && <span className="block text-xs text-slate-400">{outletName(u.outletId)}</span>}
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
              </td>
              <td className="px-4 py-3">
                {u.role !== 'ADMIN' && (
                  <select aria-label={`Assign ${u.name} to an outlet`} value="" onChange={(e) => makeStaff(u, e.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs">
                    <option value="">Make outlet staff...</option>
                    {outlets.data?.adminOutlets.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                {u.role !== 'ADMIN' && (
                  <button onClick={() => toggle(u)} className={`font-medium hover:underline ${u.isActive ? 'text-red-600' : 'text-emerald-600'}`}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- Outlets ----------------
interface OutletForm { id?: string; name: string; description: string; location: string; image: string }
const EMPTY_OUTLET: OutletForm = { name: '', description: '', location: '', image: '' };

function OutletsTab() {
  const toast = useToast();
  const { data, loading, error, refetch } = useQuery<{ adminOutlets: Outlet[] }>(ADMIN_OUTLETS);
  const [createOutlet, { loading: creating }] = useMutation(CREATE_OUTLET);
  const [updateOutlet, { loading: updating }] = useMutation(UPDATE_OUTLET);
  const [form, setForm] = useState<OutletForm | null>(null);
  const [formError, setFormError] = useState('');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setFormError('');
    try {
      const { id, ...fields } = form;
      if (id) await updateOutlet({ variables: { input: { id, ...fields } } });
      else await createOutlet({ variables: { input: fields } });
      toast('success', id ? 'Outlet updated' : 'Outlet added');
      setForm(null);
      await refetch();
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  }

  async function toggleActive(o: Outlet) {
    try {
      await updateOutlet({ variables: { input: { id: o.id, isActive: !o.isActive } } });
      toast('success', `${o.name} ${o.isActive ? 'disabled' : 'enabled'}`);
      await refetch();
    } catch (err) {
      toast('error', getErrorMessage(err));
    }
  }

  if (loading && !data) return <LoadingSpinner />;
  if (error && !data) return <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />;
  const outlets = data?.adminOutlets ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Outlets ({outlets.length})</h2>
        <button className={primaryBtn} onClick={() => { setFormError(''); setForm(EMPTY_OUTLET); }}>+ Add outlet</button>
      </div>
      {outlets.length === 0 ? <EmptyState icon="🏪" title="No outlets yet" /> : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Counter</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {outlets.map((o) => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{o.name}</td>
                  <td className="px-4 py-3 text-slate-500">{o.location || '-'}</td>
                  <td className="px-4 py-3">{o.isOpen ? 'Open' : 'Closed'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${o.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{o.isActive ? 'Active' : 'Disabled'}</span>
                  </td>
                  <td className="space-x-3 px-4 py-3 text-right">
                    <button disabled={updating} className="font-medium text-blue-600 hover:underline"
                      onClick={() => { setFormError(''); setForm({ id: o.id, name: o.name, description: o.description, location: o.location, image: o.image }); }}>Edit</button>
                    <button disabled={updating} onClick={() => toggleActive(o)} className={`font-medium hover:underline ${o.isActive ? 'text-red-600' : 'text-emerald-600'}`}>
                      {o.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!form} title={form?.id ? 'Edit outlet' : 'Add outlet'} onClose={() => setForm(null)}>
        {form && (
          <form onSubmit={save} className="space-y-3">
            {formError && <ErrorMessage message={formError} />}
            <div>
              <label htmlFor="o-name" className="mb-1 block text-sm font-medium">Name</label>
              <input id="o-name" required minLength={2} className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="o-desc" className="mb-1 block text-sm font-medium">Description</label>
              <textarea id="o-desc" rows={2} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label htmlFor="o-loc" className="mb-1 block text-sm font-medium">Location on campus</label>
              <input id="o-loc" className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <label htmlFor="o-img" className="mb-1 block text-sm font-medium">Image URL (optional)</label>
              <input id="o-img" className={inputClass} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className={secondaryBtn} onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" disabled={creating || updating} className={primaryBtn}>{creating || updating ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

// ---------------- Orders ----------------
function OrdersTab() {
  const { data, loading, error, refetch } = useQuery<{ adminOrders: Order[] }>(ADMIN_ORDERS, { pollInterval: 15000 });
  if (loading && !data) return <LoadingSpinner />;
  if (error && !data) return <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />;
  const orders = data?.adminOrders ?? [];
  if (orders.length === 0) return <EmptyState icon="🧾" title="No orders yet" />;
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Order</th>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Outlet</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Payment</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Placed</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-mono text-xs">#{shortId(o.id)}</td>
              <td className="px-4 py-3">{o.userName}</td>
              <td className="px-4 py-3">{o.outletName}</td>
              <td className="px-4 py-3 text-right font-medium">{formatPrice(o.totalAmount)}</td>
              <td className="px-4 py-3 text-slate-500">{o.paymentMethod} · {o.paymentStatus}</td>
              <td className="px-4 py-3"><StatusBadge status={o.orderStatus} /></td>
              <td className="px-4 py-3 text-slate-500">{formatDate(o.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

