import { registerEnumType } from '@nestjs/graphql';

// The five kinds of people who use the system.
export enum Role {
  STUDENT = 'STUDENT',
  FACULTY = 'FACULTY',
  HOSTELLER = 'HOSTELLER',
  OUTLET_STAFF = 'OUTLET_STAFF',
  ADMIN = 'ADMIN',
}

// Roles that are allowed to order food.
export const CUSTOMER_ROLES = [Role.STUDENT, Role.FACULTY, Role.HOSTELLER];

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum PaymentMethod {
  UPI = 'UPI',
  CARD = 'CARD',
  CASH = 'CASH', // pay at the counter when collecting the order
}

registerEnumType(Role, { name: 'Role' });
registerEnumType(OrderStatus, { name: 'OrderStatus' });
registerEnumType(PaymentStatus, { name: 'PaymentStatus' });
registerEnumType(PaymentMethod, { name: 'PaymentMethod' });
