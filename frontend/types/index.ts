// TypeScript shapes of the data we get back from the GraphQL API.

export type Role = 'STUDENT' | 'FACULTY' | 'HOSTELLER' | 'OUTLET_STAFF' | 'ADMIN';
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export type PaymentMethod = 'UPI' | 'CARD' | 'CASH';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  outletId?: string | null;
  createdAt?: string;
}

export interface Outlet {
  id: string;
  name: string;
  description: string;
  location: string;
  image: string;
  isOpen: boolean;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  outletId: string;
  outletName?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
}

export interface CartLine {
  menuItemId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Cart {
  id: string;
  outletId?: string | null;
  outletName?: string | null;
  items: CartLine[];
  total: number;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId?: string;
  userName: string;
  outletId: string;
  outletName: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OutletStats {
  totalOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  menuItems: number;
  totalRevenue: number;
}

export interface AdminStats {
  totalUsers: number;
  totalOutlets: number;
  totalOrders: number;
  totalOrderValue: number;
}

export interface ActivityEntry {
  type: string;
  message: string;
  createdAt: string;
}
