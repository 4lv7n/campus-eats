import { OrderStatus, Role } from '../common/enums';
import { allowedNextStatuses } from './order-workflow';

describe('order workflow rules (unit)', () => {
  it('staff can move an order forward one step at a time', () => {
    expect(allowedNextStatuses(Role.OUTLET_STAFF, OrderStatus.PENDING)).toEqual(
      [OrderStatus.ACCEPTED, OrderStatus.REJECTED],
    );
    expect(
      allowedNextStatuses(Role.OUTLET_STAFF, OrderStatus.ACCEPTED),
    ).toEqual([OrderStatus.PREPARING]);
    expect(
      allowedNextStatuses(Role.OUTLET_STAFF, OrderStatus.PREPARING),
    ).toEqual([OrderStatus.READY]);
    expect(allowedNextStatuses(Role.OUTLET_STAFF, OrderStatus.READY)).toEqual([
      OrderStatus.COMPLETED,
    ]);
  });

  it('staff cannot skip steps or touch finished orders', () => {
    expect(
      allowedNextStatuses(Role.OUTLET_STAFF, OrderStatus.PENDING),
    ).not.toContain(OrderStatus.READY);
    expect(
      allowedNextStatuses(Role.OUTLET_STAFF, OrderStatus.COMPLETED),
    ).toEqual([]);
    expect(
      allowedNextStatuses(Role.OUTLET_STAFF, OrderStatus.REJECTED),
    ).toEqual([]);
  });

  it('customers can only cancel a PENDING order', () => {
    expect(allowedNextStatuses(Role.STUDENT, OrderStatus.PENDING)).toEqual([
      OrderStatus.CANCELLED,
    ]);
    expect(allowedNextStatuses(Role.STUDENT, OrderStatus.ACCEPTED)).toEqual([]);
  });
});
