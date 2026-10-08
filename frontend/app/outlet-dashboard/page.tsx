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
import { formatDate, formatPrice, getErrorMessage, shortId } from '@/lib/format';
import { useToast } from '@/lib/toast';
import { cardClass, inputClass, primaryBtn, secondaryBtn } from '@/lib/ui';
import { OUTLET_ORDERS, OUTLET_STATS, UPDATE_ORDER_STATUS } from '@/services/orders';
import { CREATE_MENU_ITEM, DELETE_MENU_ITEM, MENU_ITEMS, OUTLET, SET_MY_OUTLET_OPEN, UPDATE_MENU_ITEM } from '@/services/outlets';
import { MenuItem, Order, OrderStatus, Outlet, OutletStats } from '@/types';

type Tab = 'overview' | 'orders' | 'menu';

// What buttons does the staff see for each order status? (matches the backend workflow)
const NEXT_ACTIONS: Partial<Record<OrderStatus, { label: string; status: OrderStatus; style: string }[]>> = {
  PENDING: [
    { label: 'Accept', status: 'ACCEPTED', style: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: 'Reject', status: 'REJECTED', style: 'bg-red-600 hover:bg-red-700' },
  ],
  ACCEPTED: [{ label: 'Start preparing', status: 'PREPARING', style: 'bg-indigo-600 hover:bg-indigo-700' }],
  PREPARING: [{ label: 'Mark ready', status: 'READY', style: 'bg-orange-500 hover:bg-orange-600' }],
  READY: [{ label: 'Complete', status: 'COMPLETED', style: 'bg-slate-700 hover:bg-slate-800' }],
};

export default function OutletDashboardPage() {
  const { ready, user } = useRequireAuth(['OUTLET_STAFF']);
  const [tab, setTab] = useState<Tab>('overview');

  if (!ready || !user) return <LoadingSpinner />;
  if (!user.outletId) {
    return <EmptyState icon="🏪" title="No outlet assigned" text="Ask an admin to assign your account to an outlet." />;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'Orders' },
    { id: 'menu', label: 'Menu' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Outlet dashboard</h1>
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold ${tab === t.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'overview' && <Overview outletId={user.outletId} />}
      {tab === 'orders' && <OrdersTab />}
      {tab === 'menu' && <MenuTab outletId={user.outletId} />}
    </div>
  );
}

// ---------------- Overview: stats + open/close switch ----------------
function Overview({ outletId }: { outletId: string }) {
  const toast = useToast();
  const stats = useQuery<{ outletStats: OutletStats }>(OUTLET_STATS, { pollInterval: 10000 });
  const outlet = useQuery<{ outlet: Outlet }>(OUTLET, { variables: { id: outletId } });
  const [setOpen, { loading }] = useMutation(SET_MY_OUTLET_OPEN);

  if (stats.loading && !stats.data) return <LoadingSpinner />;
  if (stats.error && !stats.data) return <ErrorMessage message={getErrorMessage(stats.error)} onRetry={() => stats.refetch()} />;
  const s = stats.data!.outletStats;
  const o = outlet.data?.outlet;

  async function toggle() {
    try {
      await setOpen({ variables: { isOpen: !o?.isOpen } });
      await outlet.refetch();
      toast('success', o?.isOpen ? 'Outlet is now closed' : 'Outlet is now open');
    } catch (e) {
      toast('error', getErrorMessage(e));
    }
  }

  return (
    <div className="space-y-6">
      {o && (
        <div className={`${cardClass} flex flex-wrap items-center justify-between gap-3`}>
          <div>
            <h2 className="text-lg font-bold">{o.name}</h2>
            <p className="text-sm text-slate-500">{o.isOpen ? 'Open - customers can order now' : 'Closed - customers cannot order'}</p>
          </div>
          <button onClick={toggle} disabled={loading} className={o.isOpen ? secondaryBtn : primaryBtn}>
            {o.isOpen ? 'Close outlet' : 'Open outlet'}
          </button>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard icon="📦" label="Total orders" value={s.totalOrders} />
        <DashboardCard icon="🕒" label="Pending orders" value={s.pendingOrders} tone="orange" />
        <DashboardCard icon="👨‍🍳" label="Preparing" value={s.preparingOrders} tone="purple" />
        <DashboardCard icon="🛎️" label="Ready" value={s.readyOrders} tone="green" />
        <DashboardCard icon="🍔" label="Menu items" value={s.menuItems} tone="blue" />
        <DashboardCard icon="💰" label="Revenue (completed)" value={formatPrice(s.totalRevenue)} tone="green" />
      </div>
    </div>
  );
}

// ---------------- Orders tab ----------------
const FILTERS: { label: string; statuses?: OrderStatus[] }[] = [
  { label: 'Incoming', statuses: ['PENDING'] },
  { label: 'In progress', statuses: ['ACCEPTED', 'PREPARING', 'READY'] },
  { label: 'Finished', statuses: ['COMPLETED', 'REJECTED', 'CANCELLED'] },
  { label: 'All' },
];

function OrdersTab() {
  const toast = useToast();
  const [filterIndex, setFilterIndex] = useState(0);
  const { data, loading, error, refetch } = useQuery<{ outletOrders: Order[] }>(OUTLET_ORDERS, {
    variables: { statuses: FILTERS[filterIndex].statuses },
    pollInterval: 8000, // new orders show up automatically
  });
  const [updateStatus, { loading: updating }] = useMutation(UPDATE_ORDER_STATUS, { refetchQueries: [OUTLET_STATS] });

  async function change(orderId: string, status: OrderStatus) {
    try {
      await updateStatus({ variables: { input: { orderId, status } } });
      toast('success', `Order #${shortId(orderId)} is now ${status.toLowerCase()}`);
      await refetch();
    } catch (e) {
      toast('error', getErrorMessage(e));
    }
  }

  const orders = data?.outletOrders ?? [];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f, i) => (
          <button key={f.label} onClick={() => setFilterIndex(i)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${filterIndex === i ? 'bg-orange-500 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'}`}>
            {f.label}
          </button>
        ))}
      </div>
      {loading && !data ? <LoadingSpinner /> : error && !data ? (
        <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : orders.length === 0 ? (
        <EmptyState icon="📭" title="No orders here" text="New orders will appear automatically." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {orders.map((o) => (
            <div key={o.id} className={cardClass}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold">#{shortId(o.id)} · {o.userName}</p>
                  <p className="text-xs text-slate-400">{formatDate(o.createdAt)} · {o.paymentMethod} ({o.paymentStatus})</p>
                </div>
                <StatusBadge status={o.orderStatus} />
              </div>
              <ul className="mt-3 space-y-1 text-sm text-slate-600">
                {o.items.map((i) => <li key={i.menuItemId}>{i.quantity} × {i.name}</li>)}
              </ul>
              <p className="mt-2 font-bold">{formatPrice(o.totalAmount)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(NEXT_ACTIONS[o.orderStatus] ?? []).map((a) => (
                  <button key={a.status} disabled={updating} onClick={() => change(o.id, a.status)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${a.style}`}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------- Menu tab: add / edit / delete / enable-disable ----------------
interface MenuForm { id?: string; name: string; description: string; price: string; category: string; image: string; available: boolean }
const EMPTY_FORM: MenuForm = { name: '', description: '', price: '', category: '', image: '', available: true };

function MenuTab({ outletId }: { outletId: string }) {
  const toast = useToast();
  const { data, loading, error, refetch } = useQuery<{ menuItems: MenuItem[] }>(MENU_ITEMS, { variables: { outletId } });
  const [createItem, { loading: creating }] = useMutation(CREATE_MENU_ITEM);
  const [updateItem, { loading: updating }] = useMutation(UPDATE_MENU_ITEM);
  const [deleteItem] = useMutation(DELETE_MENU_ITEM);

  const [form, setForm] = useState<MenuForm | null>(null); // null = modal closed
  const [formError, setFormError] = useState('');
  const [toDelete, setToDelete] = useState<MenuItem | null>(null);

  const afterChange = async () => {
    await refetch();
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setFormError('');
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 1) return setFormError('Enter a valid price (at least 1).');
    try {
      if (form.id) {
        await updateItem({ variables: { input: { id: form.id, name: form.name, description: form.description, price, category: form.category || 'General', image: form.image, available: form.available } } });
        toast('success', 'Menu item updated');
      } else {
        await createItem({ variables: { input: { name: form.name, description: form.description, price, category: form.category || 'General', image: form.image, available: form.available } } });
        toast('success', 'Menu item added');
      }
      setForm(null);
      await afterChange();
    } catch (err) {
      setFormError(getErrorMessage(err));
    }
  }

  async function toggleAvailable(item: MenuItem) {
    try {
      await updateItem({ variables: { input: { id: item.id, available: !item.available } } });
      await afterChange();
    } catch (err) {
      toast('error', getErrorMessage(err));
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteItem({ variables: { id: toDelete.id } });
      toast('success', `${toDelete.name} deleted`);
      setToDelete(null);
      await afterChange();
    } catch (err) {
      toast('error', getErrorMessage(err));
    }
  }

  if (loading && !data) return <LoadingSpinner />;
  if (error && !data) return <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />;
  const items = data?.menuItems ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Your menu ({items.length})</h2>
        <button onClick={() => { setFormError(''); setForm(EMPTY_FORM); }} className={primaryBtn}>+ Add item</button>
      </div>

      {items.length === 0 ? (
        <EmptyState title="No menu items yet" text="Add your first item to start receiving orders." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Available</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-slate-500">{item.category}</td>
                  <td className="px-4 py-3 text-right">{formatPrice(item.price)}</td>
                  <td className="px-4 py-3">
                    <button role="switch" aria-checked={item.available} aria-label={`${item.name} available`} disabled={updating} onClick={() => toggleAvailable(item)}
                      className={`relative h-6 w-11 rounded-full transition ${item.available ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${item.available ? 'left-[22px]' : 'left-0.5'}`} />
                    </button>
                  </td>
                  <td className="space-x-3 px-4 py-3 text-right">
                    <button className="font-medium text-blue-600 hover:underline"
                      onClick={() => { setFormError(''); setForm({ id: item.id, name: item.name, description: item.description, price: String(item.price), category: item.category, image: item.image, available: item.available }); }}>
                      Edit
                    </button>
                    <button className="font-medium text-red-600 hover:underline" onClick={() => setToDelete(item)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!form} title={form?.id ? 'Edit menu item' : 'Add menu item'} onClose={() => setForm(null)}>
        {form && (
          <form onSubmit={save} className="space-y-3">
            {formError && <ErrorMessage message={formError} />}
            <div>
              <label htmlFor="m-name" className="mb-1 block text-sm font-medium">Name</label>
              <input id="m-name" required minLength={2} className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="m-desc" className="mb-1 block text-sm font-medium">Description</label>
              <textarea id="m-desc" rows={2} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="m-price" className="mb-1 block text-sm font-medium">Price (₹)</label>
                <input id="m-price" type="number" min={1} step="0.5" required className={inputClass} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
              <div>
                <label htmlFor="m-cat" className="mb-1 block text-sm font-medium">Category</label>
                <input id="m-cat" placeholder="e.g. Coffee" className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
            </div>
            <div>
              <label htmlFor="m-img" className="mb-1 block text-sm font-medium">Image URL (optional)</label>
              <input id="m-img" className={inputClass} value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} className="h-4 w-4 accent-orange-500" />
              Available to order
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setForm(null)} className={secondaryBtn}>Cancel</button>
              <button type="submit" disabled={creating || updating} className={primaryBtn}>{creating || updating ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!toDelete} title="Delete menu item?" onClose={() => setToDelete(null)}>
        <p className="text-sm text-slate-600">
          <strong>{toDelete?.name}</strong> will be removed from your menu. Past orders keep their details.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setToDelete(null)} className={secondaryBtn}>Cancel</button>
          <button onClick={confirmDelete} className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
