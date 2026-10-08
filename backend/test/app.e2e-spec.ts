/**
 * End-to-end tests: boots the REAL NestJS app and talks to it over GraphQL/HTTP.
 * Needs a running MongoDB. It uses its own database (campus_food_test) and wipes it first.
 *   MONGODB_URI_TEST=mongodb://127.0.0.1:27017/campus_food_test   (default)
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { Connection, Model } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Role } from '../src/common/enums';
import { MenuItem } from '../src/menu/menu-item.schema';
import { Outlet } from '../src/outlets/outlet.schema';
import { User } from '../src/users/user.schema';

process.env.JWT_SECRET = 'test-secret-only-for-jest';
process.env.MONGODB_URI =
  process.env.MONGODB_URI_TEST || 'mongodb://127.0.0.1:27017/campus_food_test';

describe('Campus Eats API (e2e)', () => {
  let app: INestApplication;
  let outletA: any; // Shawarma-like outlet
  let outletB: any; // Brew-like outlet
  let itemA: any; // item at outlet A
  let itemB: any; // item at outlet B
  const tokens: Record<string, string> = {};

  // ---- helper: send a GraphQL request, optionally with a login token ----
  async function gql(query: string, variables: any = {}, token?: string) {
    const req = request(app.getHttpServer()).post('/graphql');
    if (token) req.set('Authorization', `Bearer ${token}`);
    const res = await req.send({ query, variables });
    return res.body as {
      data?: any;
      errors?: { message: string; extensions?: { code?: string } }[];
    };
  }
  const firstError = (r: any) => r.errors?.[0]?.message as string | undefined;

  async function login(email: string, password = 'Password123!') {
    const r = await gql(
      `mutation($i: LoginInput!){ login(input:$i){ accessToken user{ id role } } }`,
      { i: { email, password } },
    );
    return r.data.login.accessToken as string;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    // start from an empty database
    await (app.get(getConnectionToken()) as Connection).dropDatabase();

    const users = app.get<Model<any>>(getModelToken(User.name));
    const outlets = app.get<Model<any>>(getModelToken(Outlet.name));
    const menu = app.get<Model<any>>(getModelToken(MenuItem.name));

    outletA = await outlets.create({ name: 'Test Shack', isOpen: true });
    outletB = await outlets.create({ name: 'Test Brew', isOpen: true });
    itemA = await menu.create({
      outletId: outletA._id,
      name: 'Test Wrap',
      price: 100,
      category: 'Wraps',
    });
    itemB = await menu.create({
      outletId: outletB._id,
      name: 'Test Tea',
      price: 20,
      category: 'Tea',
    });

    const hash = await bcrypt.hash('Password123!', 4);
    await users.create([
      {
        name: 'Admin',
        email: 'admin@test.com',
        passwordHash: hash,
        role: Role.ADMIN,
      },
      {
        name: 'Staff A',
        email: 'staffa@test.com',
        passwordHash: hash,
        role: Role.OUTLET_STAFF,
        outletId: outletA._id,
      },
      {
        name: 'Staff B',
        email: 'staffb@test.com',
        passwordHash: hash,
        role: Role.OUTLET_STAFF,
        outletId: outletB._id,
      },
    ]);
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  // ================= REGISTRATION =================
  describe('registration', () => {
    const reg = `mutation($i: RegisterInput!){ register(input:$i){ accessToken user{ id name email role isActive } } }`;

    it('registers a student and returns a token', async () => {
      const r = await gql(reg, {
        i: {
          name: 'Stu One',
          email: 'Stu1@Test.com',
          password: 'secret123',
          role: 'STUDENT',
        },
      });
      expect(r.errors).toBeUndefined();
      expect(r.data.register.accessToken).toBeTruthy();
      expect(r.data.register.user.email).toBe('stu1@test.com'); // lower-cased
      expect(r.data.register.user.role).toBe('STUDENT');
    });

    it('stores a bcrypt hash, never the plain password', async () => {
      const users = app.get<Model<any>>(getModelToken(User.name));
      const u = await users.findOne({ email: 'stu1@test.com' });
      expect(u.passwordHash).not.toBe('secret123');
      expect(u.passwordHash.startsWith('$2')).toBe(true);
    });

    it('rejects a duplicate email', async () => {
      const r = await gql(reg, {
        i: {
          name: 'Again',
          email: 'stu1@test.com',
          password: 'secret123',
          role: 'STUDENT',
        },
      });
      expect(firstError(r)).toMatch(/already exists/i);
    });

    it('rejects self-registering as ADMIN or OUTLET_STAFF', async () => {
      const r1 = await gql(reg, {
        i: {
          name: 'Evil',
          email: 'evil@test.com',
          password: 'secret123',
          role: 'ADMIN',
        },
      });
      const r2 = await gql(reg, {
        i: {
          name: 'Evil',
          email: 'evil2@test.com',
          password: 'secret123',
          role: 'OUTLET_STAFF',
        },
      });
      expect(firstError(r1)).toMatch(/only register as/i);
      expect(firstError(r2)).toMatch(/only register as/i);
    });

    it('validates input (short password, bad email)', async () => {
      const r = await gql(reg, {
        i: {
          name: 'X',
          email: 'not-an-email',
          password: '123',
          role: 'STUDENT',
        },
      });
      expect(r.errors).toBeDefined();
    });

    it('never exposes passwordHash through GraphQL', async () => {
      const r = await gql(
        `mutation{ register(input:{name:"Hack",email:"hack@test.com",password:"secret123",role:STUDENT}){ user{ passwordHash } } }`,
      );
      expect(r.errors).toBeDefined(); // field does not exist in the schema
    });
  });

  // ================= LOGIN + JWT =================
  describe('login and JWT', () => {
    it('logs in with correct credentials', async () => {
      tokens.stu1 = await gql(
        `mutation{ login(input:{email:"stu1@test.com",password:"secret123"}){ accessToken } }`,
      ).then((r) => r.data.login.accessToken);
      expect(tokens.stu1.split('.')).toHaveLength(3); // header.payload.signature
    });

    it('rejects a wrong password and unknown email with the same message', async () => {
      const bad = await gql(
        `mutation{ login(input:{email:"stu1@test.com",password:"wrong"}){ accessToken } }`,
      );
      const none = await gql(
        `mutation{ login(input:{email:"nobody@test.com",password:"wrong"}){ accessToken } }`,
      );
      expect(firstError(bad)).toBe('Invalid email or password.');
      expect(firstError(none)).toBe('Invalid email or password.');
    });

    it('"me" works with a token and fails without one', async () => {
      const ok = await gql(`{ me{ email role } }`, {}, tokens.stu1);
      expect(ok.data.me.email).toBe('stu1@test.com');
      const noToken = await gql(`{ me{ email } }`);
      expect(noToken.errors?.[0].extensions?.code).toBe('UNAUTHENTICATED');
      const fake = await gql(`{ me{ email } }`, {}, 'not.a.token');
      expect(fake.errors?.[0].extensions?.code).toBe('UNAUTHENTICATED');
    });

    it('blocks a deactivated user immediately, even with a valid token', async () => {
      await gql(
        `mutation{ register(input:{name:"Temp",email:"temp@test.com",password:"secret123",role:STUDENT}){ user{ id } } }`,
      );
      const tempToken = await login('temp@test.com', 'secret123');
      const adminToken = await login('admin@test.com');
      const users = app.get<Model<any>>(getModelToken(User.name));
      const temp = await users.findOne({ email: 'temp@test.com' });
      const off = await gql(
        `mutation($id:ID!){ setUserActive(userId:$id,isActive:false){ isActive } }`,
        { id: temp.id },
        adminToken,
      );
      expect(off.data.setUserActive.isActive).toBe(false);
      expect((await gql(`{ me{ id } }`, {}, tempToken)).errors).toBeDefined();
      const again = await gql(
        `mutation{ login(input:{email:"temp@test.com",password:"secret123"}){ accessToken } }`,
      );
      expect(firstError(again)).toMatch(/deactivated/i);
    });
  });

  // ================= ROLE AUTHORIZATION =================
  describe('role-based authorization', () => {
    beforeAll(async () => {
      tokens.admin = await login('admin@test.com');
      tokens.staffA = await login('staffa@test.com');
      tokens.staffB = await login('staffb@test.com');
    });

    it('a student cannot call admin APIs', async () => {
      for (const q of [
        '{ adminUsers{ id } }',
        '{ adminOrders{ id } }',
        '{ adminStats{ totalUsers } }',
        '{ adminOutlets{ id } }',
      ]) {
        const r = await gql(q, {}, tokens.stu1);
        expect(r.errors?.[0].extensions?.code).toBe('FORBIDDEN');
      }
    });

    it('a student cannot create outlets or change users', async () => {
      const a = await gql(
        `mutation{ createOutlet(input:{name:"Hack Cafe"}){ id } }`,
        {},
        tokens.stu1,
      );
      expect(a.errors?.[0].extensions?.code).toBe('FORBIDDEN');
      const b = await gql(
        `mutation{ setUserActive(userId:"${itemA.id}",isActive:false){ id } }`,
        {},
        tokens.stu1,
      );
      expect(b.errors?.[0].extensions?.code).toBe('FORBIDDEN');
    });

    it('outlet staff cannot change users or create outlets', async () => {
      const a = await gql(
        `mutation{ setUserActive(userId:"${itemA.id}",isActive:false){ id } }`,
        {},
        tokens.staffA,
      );
      expect(a.errors?.[0].extensions?.code).toBe('FORBIDDEN');
      const b = await gql(
        `mutation{ createOutlet(input:{name:"Mine"}){ id } }`,
        {},
        tokens.staffA,
      );
      expect(b.errors?.[0].extensions?.code).toBe('FORBIDDEN');
    });

    it('admin can read all admin data and manage outlets', async () => {
      const stats = await gql(
        `{ adminStats{ totalUsers totalOutlets totalOrders totalOrderValue } }`,
        {},
        tokens.admin,
      );
      expect(stats.data.adminStats.totalUsers).toBeGreaterThanOrEqual(4);
      expect(stats.data.adminStats.totalOutlets).toBe(2);
      const created = await gql(
        `mutation{ createOutlet(input:{name:"New Kiosk"}){ id name isActive } }`,
        {},
        tokens.admin,
      );
      expect(created.data.createOutlet.name).toBe('New Kiosk');
      const disabled = await gql(
        `mutation($id:ID!){ updateOutlet(input:{id:$id,isActive:false}){ isActive } }`,
        { id: created.data.createOutlet.id },
        tokens.admin,
      );
      expect(disabled.data.updateOutlet.isActive).toBe(false);
      const publicList = await gql(`{ outlets{ name } }`);
      expect(publicList.data.outlets.map((o: any) => o.name)).not.toContain(
        'New Kiosk',
      ); // hidden from students
    });
  });

  // ================= MENU =================
  describe('menu', () => {
    it('anyone can browse, search and filter', async () => {
      const all = await gql(`{ menuItems{ name outletName } }`);
      expect(all.data.menuItems).toHaveLength(2);
      const search = await gql(`{ menuItems(search:"wrap"){ name } }`);
      expect(search.data.menuItems.map((m: any) => m.name)).toEqual([
        'Test Wrap',
      ]);
      const price = await gql(`{ menuItems(maxPrice:50){ name } }`);
      expect(price.data.menuItems.map((m: any) => m.name)).toEqual([
        'Test Tea',
      ]);
      const cat = await gql(`{ menuItems(category:"Wraps"){ name } }`);
      expect(cat.data.menuItems).toHaveLength(1);
      const byOutlet = await gql(
        `{ menuItems(outletId:"${outletB.id}"){ name } }`,
      );
      expect(byOutlet.data.menuItems[0].name).toBe('Test Tea');
    });

    it('staff creates items for THEIR outlet only (outletId in input is ignored)', async () => {
      const r = await gql(
        `mutation($i:CreateMenuItemInput!){ createMenuItem(input:$i){ id name price outletId available } }`,
        {
          i: {
            name: 'Staff Special',
            price: 150,
            category: 'Plates',
            outletId: outletB.id,
          },
        },
        tokens.staffA,
      );
      expect(r.errors).toBeUndefined();
      expect(r.data.createMenuItem.outletId).toBe(outletA.id); // forced to staff A's outlet
    });

    it('a student cannot create menu items', async () => {
      const r = await gql(
        `mutation{ createMenuItem(input:{name:"Nope",price:10}){ id } }`,
        {},
        tokens.stu1,
      );
      expect(r.errors?.[0].extensions?.code).toBe('FORBIDDEN');
    });

    it("staff cannot edit or delete ANOTHER outlet's items", async () => {
      const edit = await gql(
        `mutation{ updateMenuItem(input:{id:"${itemB.id}",price:1}){ id } }`,
        {},
        tokens.staffA,
      );
      expect(firstError(edit)).toMatch(/own outlet/i);
      const del = await gql(
        `mutation{ deleteMenuItem(id:"${itemB.id}") }`,
        {},
        tokens.staffA,
      );
      expect(firstError(del)).toMatch(/own outlet/i);
    });

    it('staff can edit, disable and delete their own items', async () => {
      const edit = await gql(
        `mutation{ updateMenuItem(input:{id:"${itemA.id}",price:110,available:false}){ price available } }`,
        {},
        tokens.staffA,
      );
      expect(edit.data.updateMenuItem).toEqual({
        price: 110,
        available: false,
      });
      await gql(
        `mutation{ updateMenuItem(input:{id:"${itemA.id}",price:100,available:true}){ id } }`,
        {},
        tokens.staffA,
      );
      const created = await gql(
        `mutation{ createMenuItem(input:{name:"Temp Item",price:5}){ id } }`,
        {},
        tokens.staffA,
      );
      const del = await gql(
        `mutation{ deleteMenuItem(id:"${created.data.createMenuItem.id}") }`,
        {},
        tokens.staffA,
      );
      expect(del.data.deleteMenuItem).toBe(true);
    });

    it('validates price and IDs', async () => {
      const neg = await gql(
        `mutation{ createMenuItem(input:{name:"Bad",price:-5}){ id } }`,
        {},
        tokens.staffA,
      );
      expect(firstError(neg)).toMatch(/price/i);
      const badId = await gql(
        `mutation{ updateMenuItem(input:{id:"abc",price:5}){ id } }`,
        {},
        tokens.staffA,
      );
      expect(firstError(badId)).toMatch(/invalid/i);
    });
  });

  // ================= CART =================
  describe('cart', () => {
    const ADD = `mutation($i:AddToCartInput!){ addToCart(input:$i){ outletName total items{ menuItemId name quantity price } } }`;

    it('adds items, merges duplicates and computes the total', async () => {
      await gql(ADD, { i: { menuItemId: itemA.id, quantity: 1 } }, tokens.stu1);
      const r = await gql(
        ADD,
        { i: { menuItemId: itemA.id, quantity: 2 } },
        tokens.stu1,
      );
      expect(r.data.addToCart.items).toHaveLength(1);
      expect(r.data.addToCart.items[0].quantity).toBe(3);
      expect(r.data.addToCart.total).toBe(300);
      expect(r.data.addToCart.outletName).toBe('Test Shack');
    });

    it('updates quantity and removes with quantity 0', async () => {
      const up = await gql(
        `mutation{ updateCartItem(input:{menuItemId:"${itemA.id}",quantity:5}){ total } }`,
        {},
        tokens.stu1,
      );
      expect(up.data.updateCartItem.total).toBe(500);
      const zero = await gql(
        `mutation{ updateCartItem(input:{menuItemId:"${itemA.id}",quantity:0}){ items{ name } } }`,
        {},
        tokens.stu1,
      );
      expect(zero.data.updateCartItem.items).toHaveLength(0);
    });

    it('rejects food from a second outlet while the cart has another outlet', async () => {
      await gql(ADD, { i: { menuItemId: itemA.id, quantity: 1 } }, tokens.stu1);
      const r = await gql(
        ADD,
        { i: { menuItemId: itemB.id, quantity: 1 } },
        tokens.stu1,
      );
      expect(firstError(r)).toMatch(/Your cart has items from Test Shack/);
    });

    it('rejects invalid quantity, invalid id, unknown item', async () => {
      expect(
        firstError(
          await gql(
            ADD,
            { i: { menuItemId: itemA.id, quantity: 0 } },
            tokens.stu1,
          ),
        ),
      ).toBeDefined();
      expect(
        firstError(
          await gql(
            ADD,
            { i: { menuItemId: itemA.id, quantity: 999 } },
            tokens.stu1,
          ),
        ),
      ).toMatch(/at most 20/);
      expect(
        firstError(
          await gql(
            ADD,
            { i: { menuItemId: 'zzz', quantity: 1 } },
            tokens.stu1,
          ),
        ),
      ).toBeDefined();
      expect(
        firstError(
          await gql(
            ADD,
            { i: { menuItemId: '507f1f77bcf86cd799439011', quantity: 1 } },
            tokens.stu1,
          ),
        ),
      ).toMatch(/not found/i);
    });

    it('refuses unavailable food', async () => {
      const menu = app.get<Model<any>>(getModelToken(MenuItem.name));
      const gone = await menu.create({
        outletId: outletA._id,
        name: 'Sold Out Thing',
        price: 50,
        available: false,
      });
      const r = await gql(
        ADD,
        { i: { menuItemId: gone.id, quantity: 1 } },
        tokens.stu1,
      );
      expect(firstError(r)).toMatch(/unavailable/i);
    });

    it('each user has a separate cart', async () => {
      await gql(
        `mutation{ register(input:{name:"Stu Two",email:"stu2@test.com",password:"secret123",role:HOSTELLER}){ accessToken } }`,
      );
      tokens.stu2 = await login('stu2@test.com', 'secret123');
      const mine = await gql(`{ cart{ items{ name } } }`, {}, tokens.stu2);
      expect(mine.data.cart.items).toHaveLength(0);
      const other = await gql(`{ cart{ items{ name } } }`, {}, tokens.stu1);
      expect(other.data.cart.items).toHaveLength(1);
    });

    it('staff and admin cannot use the cart (customers only)', async () => {
      expect(
        (await gql(`{ cart{ id } }`, {}, tokens.staffA)).errors?.[0].extensions
          ?.code,
      ).toBe('FORBIDDEN');
    });
  });

  // ================= ORDERS =================
  describe('orders', () => {
    let orderId: string;
    const CREATE = `mutation($i:CreateOrderInput!){ createOrder(input:$i){ id totalAmount paymentStatus orderStatus outletName items{ name price quantity subtotal } } }`;

    it('refuses to checkout an empty cart', async () => {
      const r = await gql(CREATE, { i: { paymentMethod: 'UPI' } }, tokens.stu2);
      expect(firstError(r)).toBe('Your cart is empty.');
    });

    it('a failed payment creates NO order and keeps the cart', async () => {
      const r = await gql(
        CREATE,
        { i: { paymentMethod: 'CARD', simulatePaymentFailure: true } },
        tokens.stu1,
      );
      expect(firstError(r)).toMatch(/Payment failed/);
      const cart = await gql(`{ cart{ items{ name } } }`, {}, tokens.stu1);
      expect(cart.data.cart.items).toHaveLength(1);
      const mine = await gql(`{ myOrders{ id } }`, {}, tokens.stu1);
      expect(mine.data.myOrders).toHaveLength(0);
    });

    it('creates an order from the cart (CASH -> payment PENDING) and empties the cart', async () => {
      const r = await gql(
        CREATE,
        { i: { paymentMethod: 'CASH' } },
        tokens.stu1,
      );
      expect(r.errors).toBeUndefined();
      const o = r.data.createOrder;
      orderId = o.id;
      expect(o.orderStatus).toBe('PENDING');
      expect(o.paymentStatus).toBe('PENDING');
      expect(o.totalAmount).toBe(100);
      expect(o.items[0]).toEqual({
        name: 'Test Wrap',
        price: 100,
        quantity: 1,
        subtotal: 100,
      });
      const cart = await gql(`{ cart{ items{ name } } }`, {}, tokens.stu1);
      expect(cart.data.cart.items).toHaveLength(0);
    });

    it('UPI payment succeeds immediately and a Payment record is stored', async () => {
      await gql(
        `mutation{ addToCart(input:{menuItemId:"${itemB.id}",quantity:2}){ id } }`,
        {},
        tokens.stu2,
      );
      const r = await gql(CREATE, { i: { paymentMethod: 'UPI' } }, tokens.stu2);
      expect(r.data.createOrder.paymentStatus).toBe('SUCCESS');
      expect(r.data.createOrder.totalAmount).toBe(40);
      const pay = await gql(
        `{ orderPayment(orderId:"${r.data.createOrder.id}"){ amount paymentMethod paymentStatus transactionId } }`,
        {},
        tokens.stu2,
      );
      expect(pay.data.orderPayment.transactionId).toMatch(/^MOCK-/);
      expect(pay.data.orderPayment.amount).toBe(40);
      // another user cannot read this payment
      const spy = await gql(
        `{ orderPayment(orderId:"${r.data.createOrder.id}"){ amount } }`,
        {},
        tokens.stu1,
      );
      expect(spy.errors?.[0].extensions?.code).toBe('FORBIDDEN');
    });

    it('order keeps its price snapshot when the menu price changes later', async () => {
      await gql(
        `mutation{ updateMenuItem(input:{id:"${itemA.id}",price:999,name:"Renamed Wrap"}){ id } }`,
        {},
        tokens.staffA,
      );
      const r = await gql(
        `{ order(id:"${orderId}"){ totalAmount items{ name price } } }`,
        {},
        tokens.stu1,
      );
      expect(r.data.order.items[0]).toEqual({ name: 'Test Wrap', price: 100 });
      expect(r.data.order.totalAmount).toBe(100);
      await gql(
        `mutation{ updateMenuItem(input:{id:"${itemA.id}",price:100,name:"Test Wrap"}){ id } }`,
        {},
        tokens.staffA,
      );
    });

    it('closed outlets cannot receive orders', async () => {
      await gql(
        `mutation{ addToCart(input:{menuItemId:"${itemB.id}",quantity:1}){ id } }`,
        {},
        tokens.stu2,
      );
      await gql(
        `mutation{ setMyOutletOpen(isOpen:false){ isOpen } }`,
        {},
        tokens.staffB,
      );
      const r = await gql(CREATE, { i: { paymentMethod: 'UPI' } }, tokens.stu2);
      expect(firstError(r)).toMatch(/closed/i);
      const add = await gql(
        `mutation{ addToCart(input:{menuItemId:"${itemB.id}",quantity:1}){ id } }`,
        {},
        tokens.stu2,
      );
      expect(firstError(add)).toMatch(/closed/i);
      await gql(
        `mutation{ setMyOutletOpen(isOpen:true){ isOpen } }`,
        {},
        tokens.staffB,
      );
      await gql(`mutation{ clearCart{ id } }`, {}, tokens.stu2);
    });

    it("only the owner, that outlet's staff and admin can view an order", async () => {
      expect(
        (await gql(`{ order(id:"${orderId}"){ id } }`, {}, tokens.stu1)).errors,
      ).toBeUndefined();
      expect(
        (await gql(`{ order(id:"${orderId}"){ id } }`, {}, tokens.staffA))
          .errors,
      ).toBeUndefined();
      expect(
        (await gql(`{ order(id:"${orderId}"){ id } }`, {}, tokens.admin))
          .errors,
      ).toBeUndefined();
      expect(
        (await gql(`{ order(id:"${orderId}"){ id } }`, {}, tokens.stu2))
          .errors?.[0].extensions?.code,
      ).toBe('FORBIDDEN');
      expect(
        (await gql(`{ order(id:"${orderId}"){ id } }`, {}, tokens.staffB))
          .errors?.[0].extensions?.code,
      ).toBe('FORBIDDEN');
    });

    it('order history only lists my own orders', async () => {
      const a = await gql(`{ myOrders{ id } }`, {}, tokens.stu1);
      const b = await gql(`{ myOrders{ id } }`, {}, tokens.stu2);
      expect(a.data.myOrders).toHaveLength(1);
      expect(b.data.myOrders).toHaveLength(1);
      expect(a.data.myOrders[0].id).not.toBe(b.data.myOrders[0].id);
    });

    // ----- status workflow -----
    const SET = (id: string, status: string) =>
      `mutation{ updateOrderStatus(input:{orderId:"${id}",status:${status}}){ orderStatus paymentStatus } }`;

    it("a student cannot accept, and cannot change someone else's order", async () => {
      expect(
        firstError(await gql(SET(orderId, 'ACCEPTED'), {}, tokens.stu1)),
      ).toMatch(/cannot be changed/i);
      expect(
        (await gql(SET(orderId, 'CANCELLED'), {}, tokens.stu2)).errors?.[0]
          .extensions?.code,
      ).toBe('FORBIDDEN');
    });

    it('staff of ANOTHER outlet cannot touch the order', async () => {
      expect(
        (await gql(SET(orderId, 'ACCEPTED'), {}, tokens.staffB)).errors?.[0]
          .extensions?.code,
      ).toBe('FORBIDDEN');
    });

    it('staff list incoming orders and see stats for their own outlet only', async () => {
      const list = await gql(
        `{ outletOrders(statuses:[PENDING]){ id outletName } }`,
        {},
        tokens.staffA,
      );
      expect(list.data.outletOrders.map((o: any) => o.id)).toContain(orderId);
      const other = await gql(`{ outletOrders{ id } }`, {}, tokens.staffB);
      expect(other.data.outletOrders.map((o: any) => o.id)).not.toContain(
        orderId,
      );
      const stats = await gql(
        `{ outletStats{ totalOrders pendingOrders menuItems } }`,
        {},
        tokens.staffA,
      );
      expect(stats.data.outletStats.pendingOrders).toBe(1);
      expect(stats.data.outletStats.menuItems).toBeGreaterThanOrEqual(2);
    });

    it('staff cannot skip steps', async () => {
      expect(
        firstError(await gql(SET(orderId, 'READY'), {}, tokens.staffA)),
      ).toMatch(/cannot be changed/i);
      expect(
        firstError(await gql(SET(orderId, 'COMPLETED'), {}, tokens.staffA)),
      ).toMatch(/cannot be changed/i);
    });

    it('walks the full workflow PENDING -> ACCEPTED -> PREPARING -> READY -> COMPLETED', async () => {
      for (const s of ['ACCEPTED', 'PREPARING', 'READY']) {
        const r = await gql(SET(orderId, s), {}, tokens.staffA);
        expect(r.data.updateOrderStatus.orderStatus).toBe(s);
      }
      const done = await gql(SET(orderId, 'COMPLETED'), {}, tokens.staffA);
      expect(done.data.updateOrderStatus.orderStatus).toBe('COMPLETED');
      // CASH order: paid at the counter, so payment becomes SUCCESS on completion
      expect(done.data.updateOrderStatus.paymentStatus).toBe('SUCCESS');
      // finished orders cannot change any more
      expect(
        firstError(await gql(SET(orderId, 'PREPARING'), {}, tokens.staffA)),
      ).toMatch(/cannot be changed/i);
    });

    it('staff can reject a pending order; customers can cancel a pending order only', async () => {
      await gql(
        `mutation{ addToCart(input:{menuItemId:"${itemA.id}",quantity:1}){ id } }`,
        {},
        tokens.stu1,
      );
      const o1 = (
        await gql(CREATE, { i: { paymentMethod: 'UPI' } }, tokens.stu1)
      ).data.createOrder.id;
      expect(
        (await gql(SET(o1, 'REJECTED'), {}, tokens.staffA)).data
          .updateOrderStatus.orderStatus,
      ).toBe('REJECTED');

      await gql(
        `mutation{ addToCart(input:{menuItemId:"${itemA.id}",quantity:1}){ id } }`,
        {},
        tokens.stu1,
      );
      const o2 = (
        await gql(CREATE, { i: { paymentMethod: 'UPI' } }, tokens.stu1)
      ).data.createOrder.id;
      expect(
        (await gql(SET(o2, 'CANCELLED'), {}, tokens.stu1)).data
          .updateOrderStatus.orderStatus,
      ).toBe('CANCELLED');

      await gql(
        `mutation{ addToCart(input:{menuItemId:"${itemA.id}",quantity:1}){ id } }`,
        {},
        tokens.stu1,
      );
      const o3 = (
        await gql(CREATE, { i: { paymentMethod: 'UPI' } }, tokens.stu1)
      ).data.createOrder.id;
      await gql(SET(o3, 'ACCEPTED'), {}, tokens.staffA);
      expect(
        firstError(await gql(SET(o3, 'CANCELLED'), {}, tokens.stu1)),
      ).toMatch(/cannot be changed/i); // too late
    });

    it('admin sees all orders, totals exclude rejected/cancelled, and activity feed works', async () => {
      const all = await gql(
        `{ adminOrders{ id orderStatus } adminStats{ totalOrders totalOrderValue } systemActivity{ type message } }`,
        {},
        tokens.admin,
      );
      expect(all.data.adminOrders.length).toBe(all.data.adminStats.totalOrders);
      expect(all.data.adminStats.totalOrderValue).toBeLessThan(
        all.data.adminOrders.length * 100 + 1000, // sanity only
      );
      expect(all.data.systemActivity.length).toBeGreaterThan(0);
    });
  });

  // ================= PROFILE =================
  describe('profile', () => {
    it('updates the name and changes password only with the correct current password', async () => {
      const ok = await gql(
        `mutation{ updateProfile(input:{name:"Stu Renamed"}){ name } }`,
        {},
        tokens.stu1,
      );
      expect(ok.data.updateProfile.name).toBe('Stu Renamed');
      const bad = await gql(
        `mutation{ updateProfile(input:{currentPassword:"nope",newPassword:"newpass123"}){ id } }`,
        {},
        tokens.stu1,
      );
      expect(firstError(bad)).toMatch(/incorrect/i);
      const good = await gql(
        `mutation{ updateProfile(input:{currentPassword:"secret123",newPassword:"newpass123"}){ id } }`,
        {},
        tokens.stu1,
      );
      expect(good.errors).toBeUndefined();
      expect(await login('stu1@test.com', 'newpass123')).toBeTruthy();
    });
  });
});
