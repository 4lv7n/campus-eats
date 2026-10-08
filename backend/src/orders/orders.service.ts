import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CartService } from '../cart/cart.service';
import { AuthUser } from '../common/auth-user';
import {
  CUSTOMER_ROLES,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Role,
} from '../common/enums';
import { assertObjectId, roundMoney } from '../common/helpers';
import { MenuService } from '../menu/menu.service';
import { OutletsService } from '../outlets/outlets.service';
import { PaymentsService } from '../payments/payments.service';
import { allowedNextStatuses } from './order-workflow';
import { Order, OrderDocument } from './order.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private cartService: CartService,
    private menuService: MenuService,
    private outletsService: OutletsService,
    private paymentsService: PaymentsService,
  ) {}

  // ---------- CREATE ORDER (cart -> order) ----------
  async createOrder(
    user: AuthUser,
    input: { paymentMethod: PaymentMethod; simulatePaymentFailure?: boolean },
  ) {
    // 1. The cart must have something in it.
    const cart = await this.cartService.getCart(user.id);
    if (cart.items.length === 0 || !cart.outletId) {
      throw new BadRequestException('Your cart is empty.');
    }

    // 2. The outlet must exist, be active and be open.
    const outlet = await this.outletsService.findByIdOrThrow(
      cart.outletId.toString(),
    );
    if (!outlet.isActive)
      throw new BadRequestException('This outlet is not available.');
    if (!outlet.isOpen)
      throw new BadRequestException(`${outlet.name} is closed right now.`);

    // 3. Re-check every item against the database (never trust the cart's old data).
    const menuItems = await this.menuService.findByIds(
      cart.items.map((i) => i.menuItemId),
    );
    const orderItems = cart.items.map((line) => {
      const menuItem = menuItems.find((m) => m._id.equals(line.menuItemId));
      if (!menuItem || !menuItem.outletId.equals(outlet._id)) {
        throw new BadRequestException(
          `"${line.name}" is no longer on the menu. Please remove it from your cart.`,
        );
      }
      if (!menuItem.available) {
        throw new BadRequestException(
          `"${menuItem.name}" is currently unavailable. Please remove it from your cart.`,
        );
      }
      return {
        menuItemId: menuItem._id,
        name: menuItem.name, // snapshot
        price: menuItem.price, // snapshot (current price from DB)
        quantity: line.quantity,
        subtotal: roundMoney(menuItem.price * line.quantity),
      };
    });
    const totalAmount = roundMoney(
      orderItems.reduce((sum, i) => sum + i.subtotal, 0),
    );

    // 4. Pay. The order id is created first so the Payment record can point at it.
    const orderId = new Types.ObjectId();
    const payment = await this.paymentsService.charge({
      orderId,
      userId: user.id,
      amount: totalAmount,
      method: input.paymentMethod,
      simulateFailure: input.simulatePaymentFailure,
    });
    if (payment.paymentStatus === PaymentStatus.FAILED) {
      // No order is created and the cart is kept so the user can retry.
      throw new BadRequestException(
        'Payment failed. Your cart is saved - please try again.',
      );
    }

    // 5. Save the order and empty the cart.
    const order = await this.orderModel.create({
      _id: orderId,
      userId: new Types.ObjectId(user.id),
      userName: user.name,
      outletId: outlet._id,
      outletName: outlet.name,
      items: orderItems,
      totalAmount,
      paymentMethod: input.paymentMethod,
      paymentStatus: payment.paymentStatus,
      orderStatus: OrderStatus.PENDING,
    });
    await this.cartService.clearCart(user.id);
    return order;
  }

  // ---------- READ ----------
  myOrders(userId: string) {
    return this.orderModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 });
  }

  // Who may see an order? The customer who made it, the staff of THAT outlet, or an admin.
  async findOneForUser(user: AuthUser, orderId: string) {
    const order = await this.orderModel.findById(
      assertObjectId(orderId, 'order ID'),
    );
    if (!order) throw new NotFoundException('Order not found.');
    this.assertCanView(user, order);
    return order;
  }

  private assertCanView(user: AuthUser, order: OrderDocument) {
    const isOwner = order.userId.toString() === user.id;
    const isOutletStaff =
      user.role === Role.OUTLET_STAFF &&
      user.outletId === order.outletId.toString();
    if (!(isOwner || isOutletStaff || user.role === Role.ADMIN)) {
      throw new ForbiddenException('You can only view your own orders.');
    }
  }

  outletOrders(user: AuthUser, statuses?: OrderStatus[]) {
    if (!user.outletId)
      throw new ForbiddenException('No outlet is assigned to your account.');
    const filter: Record<string, unknown> = {
      outletId: new Types.ObjectId(user.outletId),
    };
    if (statuses && statuses.length > 0) filter.orderStatus = { $in: statuses };
    return this.orderModel.find(filter).sort({ createdAt: -1 });
  }

  async outletStats(user: AuthUser) {
    if (!user.outletId)
      throw new ForbiddenException('No outlet is assigned to your account.');
    const outletId = new Types.ObjectId(user.outletId);
    const count = (status: OrderStatus) =>
      this.orderModel.countDocuments({ outletId, orderStatus: status });

    const [
      totalOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      menuItems,
      revenue,
    ] = await Promise.all([
      this.orderModel.countDocuments({ outletId }),
      count(OrderStatus.PENDING),
      count(OrderStatus.PREPARING),
      count(OrderStatus.READY),
      this.menuService.countByOutlet(user.outletId),
      this.orderModel.aggregate([
        { $match: { outletId, orderStatus: OrderStatus.COMPLETED } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);
    return {
      totalOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      menuItems,
      totalRevenue: revenue[0]?.total ?? 0,
    };
  }

  // ---------- UPDATE STATUS ----------
  async updateStatus(user: AuthUser, orderId: string, newStatus: OrderStatus) {
    const order = await this.orderModel.findById(
      assertObjectId(orderId, 'order ID'),
    );
    if (!order) throw new NotFoundException('Order not found.');

    // Who is this person to this order?
    if (CUSTOMER_ROLES.includes(user.role)) {
      if (order.userId.toString() !== user.id)
        throw new ForbiddenException('You can only change your own orders.');
    } else if (user.role === Role.OUTLET_STAFF) {
      if (user.outletId !== order.outletId.toString()) {
        throw new ForbiddenException(
          'This order belongs to a different outlet.',
        );
      }
    }

    // Is the step allowed by the workflow?
    const allowed = allowedNextStatuses(user.role, order.orderStatus);
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `An order that is ${order.orderStatus} cannot be changed to ${newStatus}.`,
      );
    }

    order.orderStatus = newStatus;

    // Cash orders are paid at the counter, so mark the payment done on completion.
    if (
      newStatus === OrderStatus.COMPLETED &&
      order.paymentStatus === PaymentStatus.PENDING
    ) {
      await this.paymentsService.markPaid(order._id);
      order.paymentStatus = PaymentStatus.SUCCESS;
    }
    return order.save();
  }

  // ---------- ADMIN ----------
  adminOrders() {
    return this.orderModel.find().sort({ createdAt: -1 }).limit(200);
  }

  async totals() {
    const [count, value] = await Promise.all([
      this.orderModel.countDocuments(),
      // Rejected/cancelled orders are not real sales.
      this.orderModel.aggregate([
        {
          $match: {
            orderStatus: {
              $nin: [OrderStatus.REJECTED, OrderStatus.CANCELLED],
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);
    return { count, value: value[0]?.total ?? 0 };
  }

  recent(limit: number) {
    return this.orderModel.find().sort({ updatedAt: -1 }).limit(limit);
  }
}
