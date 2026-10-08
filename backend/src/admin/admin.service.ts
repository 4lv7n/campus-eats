import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { OutletsService } from '../outlets/outlets.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
  constructor(
    private usersService: UsersService,
    private outletsService: OutletsService,
    private ordersService: OrdersService,
  ) {}

  async stats() {
    const [totalUsers, totalOutlets, orders] = await Promise.all([
      this.usersService.count(),
      this.outletsService.count(),
      this.ordersService.totals(),
    ]);
    return {
      totalUsers,
      totalOutlets,
      totalOrders: orders.count,
      totalOrderValue: orders.value,
    };
  }

  // "System activity" = newest signups + newest order changes, merged into one timeline.
  async activity() {
    const [users, orders] = await Promise.all([
      this.usersService.recent(10),
      this.ordersService.recent(10),
    ]);
    const entries = [
      ...users.map((u) => ({
        type: 'USER_JOINED',
        message: `${u.name} joined as ${u.role}`,
        createdAt: u.createdAt,
      })),
      ...orders.map((o) => ({
        type: 'ORDER',
        message: `Order #${o.id.slice(-6).toUpperCase()} from ${o.userName} at ${o.outletName} (Rs ${o.totalAmount}) is ${o.orderStatus}`,
        createdAt: o.updatedAt,
      })),
    ];
    return entries
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20);
  }
}
