import { ApolloError } from '@apollo/client';
import { OrderStatus, Role } from '@/types';

export const formatPrice = (n: number) => `₹${Number.isInteger(n) ? n : n.toFixed(2)}`;

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Short readable order number, e.g. "A1B2C3"
export const shortId = (id: string) => id.slice(-6).toUpperCase();

// Turn any Apollo error into one friendly sentence for the user.
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApolloError) {
    if (error.networkError) return 'Cannot reach the server. Please check your connection and try again.';
    if (error.graphQLErrors.length > 0) return error.graphQLErrors[0].message;
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export const roleLabel: Record<Role, string> = {
  STUDENT: 'Student',
  FACULTY: 'Faculty',
  HOSTELLER: 'Hosteller',
  OUTLET_STAFF: 'Outlet Staff',
  ADMIN: 'Admin',
};

export const statusLabel: Record<OrderStatus, string> = {
  PENDING: 'Order Placed',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY: 'Ready for pickup',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

export const isCustomer = (role?: Role) => role === 'STUDENT' || role === 'FACULTY' || role === 'HOSTELLER';
export const isFinalStatus = (s: OrderStatus) => ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(s);

// Where should each role land after login?
export const homeFor = (role: Role) =>
  role === 'ADMIN' ? '/admin' : role === 'OUTLET_STAFF' ? '/outlet-dashboard' : '/dashboard';
