# 🍔 CAMPUS EATS — Campus Food Delivery System

> **Food from your campus, delivered to you.**

A campus-only food ordering platform. Students, faculty and hostellers order from food outlets *inside* the campus (like **Shawarma Shack** and **Brew Lab**); outlet staff accept and prepare the orders; an admin manages the whole system.

This is a **Web Technologies college project**. It is a real, working full-stack app, but written in a simple style so you can explain every part in a viva.

---

## 1. Features

**Customers (Student / Faculty / Hosteller)**
Register · Login · Logout · Profile · Browse outlets · View menu · Search food & outlets · Filter by category / price / availability · Cart (add, remove, change quantity, total) · Checkout · Mock payment (UPI / Card / Cash) · Place order · Live order tracking · Order history · Cancel a pending order

**Outlet staff** (`/outlet-dashboard`)
Dashboard statistics · Incoming orders · Accept / Reject · Preparing → Ready → Completed · Add / Edit / Delete menu items · Enable / disable availability · Open / close the outlet · *Can only touch their own outlet*

**Admin** (`/admin`)
Totals (users, outlets, orders, order value) · Manage users (activate / deactivate, see roles, assign outlet staff) · Add / edit / disable outlets · View all orders · System activity feed

---

## 2. Technology stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS |
| API style | **GraphQL** (Apollo Server on the backend, Apollo Client on the frontend) |
| Backend | NestJS, Node.js, TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT, bcrypt password hashing, role guards |
| Tests | Jest, Supertest, React Testing Library |

## 3. Architecture

```
  Browser (Next.js pages + React components)
        │   GraphQL over HTTP  (Authorization: Bearer <JWT>)
        ▼
  NestJS  ── Guards (JWT + Role) ──► Resolvers ──► Services ──► Mongoose
        │                                                          │
        ▼                                                          ▼
  schema.gql (auto-generated)                                  MongoDB
```

* **Resolver** = receives the GraphQL request, checks the guards, calls a service.
* **Service** = *all the business logic* (rules, validation, database work).
* **Schema** = one TypeScript class that is both the MongoDB schema *and* the GraphQL type (code-first).

## 4. Folder structure

```
campus-food-delivery/
├── backend/                 NestJS API
│   └── src/
│       ├── auth/            register, login, JWT strategy
│       ├── users/           User schema, "me", profile
│       ├── outlets/         Outlet schema, public list, admin create/update
│       ├── menu/            MenuItem schema, search/filter, staff CRUD
│       ├── cart/            Cart (one outlet per cart)
│       ├── orders/          create order, status workflow, staff stats
│       ├── payments/        payment gateway abstraction + mock gateway
│       ├── admin/           admin stats, users, activity
│       ├── common/          enums, guards, @Roles, @CurrentUser, helpers
│       ├── seed.ts          sample data script
│       └── app.module.ts    wires everything together
│   └── test/                end-to-end tests
├── frontend/                Next.js app
│   ├── app/                 pages (one folder = one URL)
│   ├── components/          Navbar, FoodCard, OrderStatusTracker, ...
│   ├── services/            all GraphQL queries/mutations
│   ├── lib/                 Apollo client, auth context, helpers
│   ├── hooks/               useCart, useRequireAuth, useDebounce
│   ├── types/               TypeScript types
│   └── __tests__/           frontend tests
├── docker-compose.yml       optional Docker setup
├── .env.example             all environment variables
└── README.md
```

## 5. Installation

**You need:** Node.js 20 or newer, Git, and MongoDB (see section 7).

```bash
git clone <your-repo-url> campus-food-delivery
cd campus-food-delivery

# backend
cd backend
npm install
cp .env.example .env        # then edit .env (set JWT_SECRET!)

# frontend
cd ../frontend
npm install
cp .env.example .env.local
```

## 6. Environment variables

| Variable | Where | Meaning |
|---|---|---|
| `PORT` | backend | API port (default `4000`) |
| `MONGODB_URI` | backend | MongoDB connection string |
| `JWT_SECRET` | backend | Secret used to sign login tokens. **Make it long and random. Never commit it.** |
| `JWT_EXPIRES_IN` | backend | Token lifetime (default `7d`) |
| `FRONTEND_URL` | backend | Website allowed to call the API (CORS) |
| `NEXT_PUBLIC_API_URL` | frontend | API base URL |
| `NEXT_PUBLIC_GRAPHQL_URL` | frontend | GraphQL URL (`http://localhost:4000/graphql`) |

Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

`.env` files are in `.gitignore` — only `.env.example` is committed.

## 7. MongoDB setup (choose one)

* **A. Installed locally** — install *MongoDB Community Server*, start it, and use `mongodb://127.0.0.1:27017/campus_food`.
* **B. MongoDB Atlas (free cloud)** — create a free cluster, add your IP, copy the connection string into `MONGODB_URI`.
* **C. Docker** — `docker run -d -p 27017:27017 --name mongo mongo:7`

## 8. Run the project

Open **two terminals**.

```bash
# Terminal 1 — backend
cd backend
npm run seed          # first time only: creates sample data
npm run start:dev     # API on http://localhost:4000/graphql
```

```bash
# Terminal 2 — frontend
cd frontend
npm run dev           # website on http://localhost:3000
```

`npm run seed -- --reset` wipes the database first. Running seed twice is safe.

## 9. GraphQL endpoint

Open **http://localhost:4000/graphql** in a browser to use Apollo Sandbox. The schema file `backend/schema.gql` is generated automatically when the backend starts.

Example — log in:

```graphql
mutation {
  login(input: { email: "student@example.com", password: "Password123!" }) {
    accessToken
    user { name role }
  }
}
```

Then send the token as an HTTP header `Authorization: Bearer <accessToken>` and try:

```graphql
{ cart { total items { name quantity } }  myOrders { id orderStatus } }
```

**Queries:** `me, outlets, outlet, menuItems, menuItem, cart, myOrders, order, orderPayment, outletOrders, outletStats, adminStats, adminUsers, adminOutlets, adminOrders, systemActivity`
**Mutations:** `register, login, updateProfile, addToCart, updateCartItem, removeFromCart, clearCart, createOrder, updateOrderStatus, createMenuItem, updateMenuItem, deleteMenuItem, createOutlet, updateOutlet, setMyOutletOpen, setUserActive, assignOutletStaff`

## 10. Development accounts (⚠️ DEVELOPMENT ONLY)

All seeded accounts use the password **`Password123!`** — these are public demo credentials, never use them in production.

| Role | Email |
|---|---|
| Admin | admin@example.com |
| Student | student@example.com |
| Faculty | faculty@example.com |
| Hosteller | hosteller@example.com |
| Outlet staff (Shawarma Shack) | shawarma@example.com |
| Outlet staff (Brew Lab) | brewlab@example.com |

## 11. Testing

```bash
cd backend
npm run typecheck && npm run lint
npx jest src                 # unit tests (no database needed)
npm run test:e2e             # end-to-end tests — NEEDS MongoDB running

cd ../frontend
npm run typecheck && npm run lint
npm test                     # component tests (no backend needed)
```

* **Backend e2e (43 tests)** boot the real app and cover registration, login, JWT, role authorization, menu CRUD, cart, order creation, payment failure, price snapshots, the order status workflow and cross-outlet / cross-user protection. They use a separate database called `campus_food_test` and **wipe it** — never point `MONGODB_URI_TEST` at real data.
* **Frontend tests (17)** cover login, food cards (menu), cart items, checkout and the order tracker.
* **Live API test** — runs every real frontend GraphQL query against a running backend, to catch typos:
  `LIVE_API_URL=http://localhost:4000/graphql npm test -- live-api` (after seeding).

## 12. Docker (optional)

```bash
cp .env.example .env          # set JWT_SECRET
docker compose up --build
docker compose exec backend npm run seed:prod     # first time only
```

Website: http://localhost:3000 · API: http://localhost:4000/graphql. Docker is *not* needed for development.

## 13. Git / GitHub workflow

```bash
git init                                  # (already done if you cloned)
git add .
git commit -m "Describe what you changed"
# create an EMPTY repository on github.com, then:
git remote add origin https://github.com/<you>/campus-food-delivery.git
git branch -M main
git push -u origin main
```

Tips: commit small and often; use a branch per feature (`git checkout -b feature/search`); check `git status` before committing and make sure **no `.env` file** is listed.

---

## 14. Viva cheat-sheet — "how does it work?"

**Authentication.** `register` hashes the password with bcrypt and saves the user. `login` compares the password with the hash and returns a **JWT** (signed with `JWT_SECRET`, contains the user id). The frontend stores it in `localStorage` and Apollo Client adds `Authorization: Bearer <token>` to every request.

**Authorization (3 layers).**
1. `GqlAuthGuard` — is the token valid? Is the user still active?
2. `RolesGuard` + `@Roles(...)` — does the role match? (a student calling `adminUsers` gets *FORBIDDEN*)
3. **Ownership checks in services** — a customer only sees *their* orders; staff only manage *their outlet's* menu and orders (`user.outletId === item.outletId`).

**Order workflow.** `PENDING → ACCEPTED → PREPARING → READY → COMPLETED` (+ `REJECTED` by the outlet, `CANCELLED` by the customer while still `PENDING`). The allowed steps are stored as data in `orders/order-workflow.ts`; the service rejects any other jump.

**Placing an order (`createOrder`).** Cart must not be empty → outlet must be active and open → every item is re-checked in the database (exists, same outlet, available) → payment runs through the gateway → order is saved with **snapshots** of item name and price → cart is cleared. If payment fails, no order is created and the cart is kept.

**Payment abstraction.** `PaymentsService` only talks to the `PaymentGateway` interface. `MockPaymentGateway` is the demo implementation (UPI/Card succeed, Cash stays `PENDING` until the order is completed). To add Razorpay/Stripe later you write one new class and change one line in `payments.module.ts`.

**Why GraphQL?** One endpoint; the page asks for exactly the fields it needs; the schema is typed and generated from our classes.

**CRUD example.** Menu items: *Create* `createMenuItem`, *Read* `menuItems`, *Update* `updateMenuItem`, *Delete* `deleteMenuItem`.

**MongoDB.** Collections: `users, outlets, menuitems, carts, orders, payments`. Orders embed their items (a snapshot), so history never changes.

---

## 15. Assumptions I made (where the spec was open)

* **Only Student / Faculty / Hosteller can self-register.** Staff and admin accounts are created by the seed script or an admin (`assignOutletStaff` turns a user into staff of an outlet). Otherwise anyone could register as admin.
* **Staff ↔ outlet link:** the `User` model has an extra optional `outletId` field.
* **One outlet per cart** (an order belongs to exactly one outlet). Adding food from another outlet shows a clear message.
* **Extra fields** beyond the spec: `Order.userName/outletName/paymentMethod` (snapshots), cart item `name/image`, `Cart.outletId/outletName`.
* **Payment methods:** `UPI`, `CARD`, `CASH`. Cash is paid at the counter; the payment becomes `SUCCESS` when staff complete the order. A "simulate payment failure" checkbox on checkout is a **demo-only** feature.
* **Images:** food/outlet images are optional URLs; when empty the UI shows a colourful emoji placeholder (so nothing depends on external image hosts).
* **Currency:** ₹ (Indian rupees).
* **Order tracking** refreshes by polling every 5 seconds (simple; no WebSockets).
* **Search:** the home/outlets pages search through the server (`menuItems(search)`); the single-outlet menu filters in the browser because one menu is small.

## 16. Known limitations (be honest in the viva)

* **Page protection in the frontend is for user experience only.** Tokens live in `localStorage`, so the Next.js pages check the role in the browser. The **real security is in the backend guards** — even if someone opens `/admin`, every API call is rejected unless they are an admin. A production app would use httpOnly cookies.
* **No refunds** — rejected/cancelled orders are not refunded in the mock payment flow.
* No rate limiting, email verification or password reset.
* The "simulate payment failure" option should be removed before real use.
* Admin orders list shows the latest 200 orders (no pagination).

## 17. Future improvements

Real payment provider (Razorpay/Stripe) · Refunds · WebSocket / GraphQL subscriptions for instant order updates · Image upload · Ratings & reviews · Order scheduling and pickup slots · Email/SMS notifications · Pagination · httpOnly-cookie auth · Rate limiting · Admin ability to create staff accounts directly.
#   c a m p u s - e a t s  
 