import { OrderStatus, Role } from '../common/enums';

// The order workflow as data: "from this status, which statuses can come next?"
//   PENDING -> ACCEPTED -> PREPARING -> READY -> COMPLETED
//   PENDING -> REJECTED  (outlet says no)
//   PENDING -> CANCELLED (customer changes mind)
const STAFF_FLOW: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.PENDING]: [OrderStatus.ACCEPTED, OrderStatus.REJECTED],
  [OrderStatus.ACCEPTED]: [OrderStatus.PREPARING],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.COMPLETED],
};

const FINAL_STATUSES = [
  OrderStatus.COMPLETED,
  OrderStatus.REJECTED,
  OrderStatus.CANCELLED,
];

export function allowedNextStatuses(
  role: Role,
  current: OrderStatus,
): OrderStatus[] {
  if (role === Role.OUTLET_STAFF) return STAFF_FLOW[current] ?? [];
  if (role === Role.ADMIN) {
    const next = STAFF_FLOW[current] ?? [];
    return FINAL_STATUSES.includes(current)
      ? []
      : [...next, OrderStatus.CANCELLED];
  }
  // Customers may only cancel while the order is still PENDING.
  return current === OrderStatus.PENDING ? [OrderStatus.CANCELLED] : [];
}
