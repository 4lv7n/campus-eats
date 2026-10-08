/**
 * @jest-environment node
 *
 * LIVE API TEST - runs the REAL GraphQL documents from services/*.ts against a running backend.
 * It catches typos in queries (wrong field names, wrong variable types) that mocked tests cannot.
 *
 * Needs: MongoDB running, `npm run seed` done in /backend, and the backend started on port 4000.
 *   LIVE_API_URL=http://localhost:4000/graphql npm test -- live-api
 * Without LIVE_API_URL the test is skipped (so plain `npm test` still works anywhere).
 */
import { DocumentNode, print } from 'graphql';
import * as admin from '@/services/admin';
import * as auth from '@/services/auth';
import * as cart from '@/services/cart';
import * as orders from '@/services/orders';
import * as outlets from '@/services/outlets';

const URL = process.env.LIVE_API_URL;
const run = URL ? describe : describe.skip;

async function call<T = any>(doc: DocumentNode, variables: Record<string, unknown> = {}, token?: string): Promise<T> {
  const res = await fetch(URL!, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ query: print(doc), variables }),
  });
  const body = await res.json();
  if (body.errors) throw new Error(body.errors[0].message);
  return body.data as T;
}

async function login(email: string) {
  const d = await call(auth.LOGIN, { input: { email, password: 'Password123!' } });
  return d.login.accessToken as string;
}

run('frontend GraphQL documents against the live backend', () => {
  let student: string, staff: string, adminToken: string;
  let wrapId: string, orderId: string;

  beforeAll(async () => {
    [student, staff, adminToken] = await Promise.all([login('student@example.com'), login('shawarma@example.com'), login('admin@example.com')]);
  });

  it('public browsing: outlets, outlet, menuItems (search + filters)', async () => {
    const o = await call(outlets.OUTLETS, {});
    expect(o.outlets.map((x: any) => x.name)).toEqual(expect.arrayContaining(['Shawarma Shack', 'Brew Lab']));
    const shack = o.outlets.find((x: any) => x.name === 'Shawarma Shack');
    expect((await call(outlets.OUTLET, { id: shack.id })).outlet.name).toBe('Shawarma Shack');
    const menu = await call(outlets.MENU_ITEMS, { outletId: shack.id });
    expect(menu.menuItems.length).toBeGreaterThanOrEqual(4);
    wrapId = menu.menuItems.find((m: any) => m.name === 'Chicken Shawarma').id;
    expect((await call(outlets.MENU_ITEMS, { search: 'coffee' })).menuItems.length).toBeGreaterThan(0);
    expect((await call(outlets.MENU_ITEMS, { maxPrice: 50, availableOnly: true })).menuItems.every((m: any) => m.price <= 50)).toBe(true);
  });

  it('me / profile', async () => {
    expect((await call(auth.ME, {}, student)).me.role).toBe('STUDENT');
  });

  it('cart: clear, add, update, remove', async () => {
    await call(cart.CLEAR_CART, {}, student);
    const added = await call(cart.ADD_TO_CART, { input: { menuItemId: wrapId, quantity: 2 } }, student);
    expect(added.addToCart.total).toBe(240);
    const upd = await call(cart.UPDATE_CART_ITEM, { input: { menuItemId: wrapId, quantity: 3 } }, student);
    expect(upd.updateCartItem.total).toBe(360);
    expect((await call(cart.CART, {}, student)).cart.items).toHaveLength(1);
    const removed = await call(cart.REMOVE_FROM_CART, { menuItemId: wrapId }, student);
    expect(removed.removeFromCart.items).toHaveLength(0);
    await call(cart.ADD_TO_CART, { input: { menuItemId: wrapId, quantity: 1 } }, student);
  });

  it('checkout creates an order; tracking + history queries work', async () => {
    const created = await call(orders.CREATE_ORDER, { input: { paymentMethod: 'UPI' } }, student);
    orderId = created.createOrder.id;
    expect(created.createOrder.orderStatus).toBe('PENDING');
    expect(created.createOrder.paymentStatus).toBe('SUCCESS');
    const detail = await call(orders.ORDER, { id: orderId }, student);
    expect(detail.order.outletName).toBe('Shawarma Shack');
    expect(detail.orderPayment.transactionId).toMatch(/^MOCK-/);
    expect((await call(orders.MY_ORDERS, {}, student)).myOrders.some((o: any) => o.id === orderId)).toBe(true);
  });

  it('outlet staff: stats, incoming orders, full workflow, menu CRUD', async () => {
    expect((await call(orders.OUTLET_STATS, {}, staff)).outletStats.menuItems).toBeGreaterThanOrEqual(4);
    const incoming = await call(orders.OUTLET_ORDERS, { statuses: ['PENDING'] }, staff);
    expect(incoming.outletOrders.some((o: any) => o.id === orderId)).toBe(true);
    for (const status of ['ACCEPTED', 'PREPARING', 'READY', 'COMPLETED']) {
      const r = await call(orders.UPDATE_ORDER_STATUS, { input: { orderId, status } }, staff);
      expect(r.updateOrderStatus.orderStatus).toBe(status);
    }
    const created = await call(outlets.CREATE_MENU_ITEM, { input: { name: 'Live Test Item', price: 55, category: 'Test' } }, staff);
    const id = created.createMenuItem.id;
    expect((await call(outlets.UPDATE_MENU_ITEM, { input: { id, available: false, price: 60 } }, staff)).updateMenuItem.available).toBe(false);
    expect((await call(outlets.DELETE_MENU_ITEM, { id }, staff)).deleteMenuItem).toBe(true);
    expect((await call(outlets.SET_MY_OUTLET_OPEN, { isOpen: true }, staff)).setMyOutletOpen.isOpen).toBe(true);
  });

  it('admin: stats, users, outlets, orders, activity, outlet management, user toggle', async () => {
    const stats = (await call(admin.ADMIN_STATS, {}, adminToken)).adminStats;
    expect(stats.totalUsers).toBeGreaterThanOrEqual(6);
    expect(stats.totalOrders).toBeGreaterThanOrEqual(1);
    const users = (await call(admin.ADMIN_USERS, {}, adminToken)).adminUsers;
    expect(users.find((u: any) => u.email === 'shawarma@example.com').role).toBe('OUTLET_STAFF');
    expect(JSON.stringify(users)).not.toMatch(/passwordHash|\$2[aby]\$/);
    expect((await call(admin.ADMIN_ORDERS, {}, adminToken)).adminOrders.length).toBeGreaterThan(0);
    expect((await call(admin.SYSTEM_ACTIVITY, {}, adminToken)).systemActivity.length).toBeGreaterThan(0);

    const kiosk = (await call(admin.CREATE_OUTLET, { input: { name: `Live Kiosk ${Date.now()}`, location: 'Gate 2' } }, adminToken)).createOutlet;
    const off = await call(admin.UPDATE_OUTLET, { input: { id: kiosk.id, isActive: false } }, adminToken);
    expect(off.updateOutlet.isActive).toBe(false);
    expect((await call(admin.ADMIN_OUTLETS, {}, adminToken)).adminOutlets.some((o: any) => o.id === kiosk.id)).toBe(true);
    expect((await call(outlets.OUTLETS, {})).outlets.some((o: any) => o.id === kiosk.id)).toBe(false);

    const hosteller = users.find((u: any) => u.email === 'hosteller@example.com');
    expect((await call(admin.SET_USER_ACTIVE, { userId: hosteller.id, isActive: false }, adminToken)).setUserActive.isActive).toBe(false);
    expect((await call(admin.SET_USER_ACTIVE, { userId: hosteller.id, isActive: true }, adminToken)).setUserActive.isActive).toBe(true);
  });

  it('security: customers are blocked from admin and staff operations', async () => {
    await expect(call(admin.ADMIN_USERS, {}, student)).rejects.toThrow(/permission/i);
    await expect(call(orders.OUTLET_ORDERS, {}, student)).rejects.toThrow(/permission/i);
    await expect(call(admin.ADMIN_STATS, {})).rejects.toThrow();
    // another outlet's staff cannot touch this outlet's order
    const brew = await login('brewlab@example.com');
    await expect(call(orders.UPDATE_ORDER_STATUS, { input: { orderId, status: 'ACCEPTED' } }, brew)).rejects.toThrow();
  });
});
