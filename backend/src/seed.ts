/**
 * Seed script: npm run seed          -> adds sample data (safe to run many times)
 *              npm run seed -- --reset -> wipes the database first
 *
 * DEVELOPMENT ONLY. The passwords below are public on purpose - never use them in production.
 */
import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MenuItem, MenuItemSchema } from './menu/menu-item.schema';
import { Outlet, OutletSchema } from './outlets/outlet.schema';
import { Role } from './common/enums';
import { User, UserSchema } from './users/user.schema';

const DEV_PASSWORD = 'Password123!'; // DEVELOPMENT-ONLY password for all seeded accounts

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri)
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env first.');
  await mongoose.connect(uri);

  const UserModel = mongoose.model(User.name, UserSchema);
  const OutletModel = mongoose.model(Outlet.name, OutletSchema);
  const MenuModel = mongoose.model(MenuItem.name, MenuItemSchema);

  if (process.argv.includes('--reset')) {
    await Promise.all([
      UserModel.deleteMany({}),
      OutletModel.deleteMany({}),
      MenuModel.deleteMany({}),
    ]);
    // carts, orders, payments are also cleared on reset
    for (const name of ['carts', 'orders', 'payments']) {
      await mongoose.connection.collection(name).deleteMany({});
    }
    console.log('Database cleared.');
  }

  // ---- Outlets (upsert by name) ----
  const outletData = [
    {
      name: 'Shawarma Shack',
      description:
        'Fresh grilled shawarmas, wraps and plates. A hostel favourite.',
      location: 'Main Canteen Block, Ground Floor',
    },
    {
      name: 'Brew Lab',
      description:
        'Hot and cold coffee, tea and light snacks to power your study sessions.',
      location: 'Library Plaza',
    },
  ];
  const outlets: Record<string, any> = {};
  for (const o of outletData) {
    outlets[o.name] = await OutletModel.findOneAndUpdate(
      { name: o.name },
      { $setOnInsert: { ...o, image: '', isOpen: true, isActive: true } },
      { upsert: true, new: true },
    );
  }

  // ---- Menu items (upsert by outlet + name) ----
  const menu: [string, string, string, number, string][] = [
    [
      'Shawarma Shack',
      'Chicken Shawarma',
      'Juicy grilled chicken, garlic sauce and pickles in a toasted wrap.',
      120,
      'Wraps',
    ],
    [
      'Shawarma Shack',
      'Beef Shawarma',
      'Slow-roasted beef with tahini and fresh veggies.',
      150,
      'Wraps',
    ],
    [
      'Shawarma Shack',
      'Cheese Shawarma',
      'Chicken shawarma loaded with melted cheese.',
      140,
      'Wraps',
    ],
    [
      'Shawarma Shack',
      'Shawarma Plate',
      'Shawarma meat with rice, salad, hummus and garlic sauce.',
      180,
      'Plates',
    ],
    [
      'Brew Lab',
      'Cappuccino',
      'Espresso with steamed milk and a thick foam top.',
      80,
      'Coffee',
    ],
    [
      'Brew Lab',
      'Cold Coffee',
      'Chilled coffee blended with milk and ice cream.',
      90,
      'Coffee',
    ],
    ['Brew Lab', 'Tea', 'Classic masala chai, made fresh.', 30, 'Tea'],
    [
      'Brew Lab',
      'Sandwich',
      'Grilled veg sandwich with cheese and mint chutney.',
      70,
      'Snacks',
    ],
  ];
  for (const [outletName, name, description, price, category] of menu) {
    await MenuModel.findOneAndUpdate(
      { outletId: outlets[outletName]._id, name },
      {
        $setOnInsert: {
          description,
          price,
          category,
          image: '',
          available: true,
        },
      },
      { upsert: true },
    );
  }

  // ---- Users (upsert by email) ----
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);
  const users: { name: string; email: string; role: Role; outlet?: string }[] =
    [
      { name: 'Admin User', email: 'admin@example.com', role: Role.ADMIN },
      {
        name: 'Student User',
        email: 'student@example.com',
        role: Role.STUDENT,
      },
      {
        name: 'Faculty User',
        email: 'faculty@example.com',
        role: Role.FACULTY,
      },
      {
        name: 'Hosteller User',
        email: 'hosteller@example.com',
        role: Role.HOSTELLER,
      },
      {
        name: 'Shawarma Shack Staff',
        email: 'shawarma@example.com',
        role: Role.OUTLET_STAFF,
        outlet: 'Shawarma Shack',
      },
      {
        name: 'Brew Lab Staff',
        email: 'brewlab@example.com',
        role: Role.OUTLET_STAFF,
        outlet: 'Brew Lab',
      },
    ];
  for (const u of users) {
    await UserModel.findOneAndUpdate(
      { email: u.email },
      {
        $setOnInsert: { passwordHash, isActive: true },
        $set: {
          name: u.name,
          role: u.role,
          ...(u.outlet ? { outletId: outlets[u.outlet]._id } : {}),
        },
      },
      { upsert: true },
    );
  }

  console.log('Seed complete.');
  console.log(`Seeded accounts (password for ALL: ${DEV_PASSWORD}):`);
  users.forEach((u) => console.log(`  ${u.role.padEnd(13)} ${u.email}`));
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
