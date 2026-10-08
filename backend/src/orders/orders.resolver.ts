import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { CUSTOMER_ROLES, OrderStatus, Role } from '../common/enums';
import { GqlAuthGuard, RolesGuard } from '../common/guards';
import { CreateOrderInput, UpdateOrderStatusInput } from './dto/order.input';
import { OutletStats } from './order-stats';
import { Order } from './order.schema';
import { OrdersService } from './orders.service';

@Resolver(() => Order)
@UseGuards(GqlAuthGuard, RolesGuard)
export class OrdersResolver {
  constructor(private ordersService: OrdersService) {}

  // ---- customers ----
  @Mutation(() => Order)
  @Roles(...CUSTOMER_ROLES)
  createOrder(
    @CurrentUser() user: AuthUser,
    @Args('input') input: CreateOrderInput,
  ) {
    return this.ordersService.createOrder(user, input);
  }

  @Query(() => [Order])
  @Roles(...CUSTOMER_ROLES)
  myOrders(@CurrentUser() user: AuthUser) {
    return this.ordersService.myOrders(user.id);
  }

  // ---- anyone logged in, but the service checks they are allowed to see THIS order ----
  @Query(() => Order)
  order(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.ordersService.findOneForUser(user, id);
  }

  // customer (cancel), staff (workflow), admin
  @Mutation(() => Order)
  updateOrderStatus(
    @CurrentUser() user: AuthUser,
    @Args('input') input: UpdateOrderStatusInput,
  ) {
    return this.ordersService.updateStatus(user, input.orderId, input.status);
  }

  // ---- outlet staff ----
  @Query(() => [Order])
  @Roles(Role.OUTLET_STAFF)
  outletOrders(
    @CurrentUser() user: AuthUser,
    @Args('statuses', { type: () => [OrderStatus], nullable: true })
    statuses?: OrderStatus[],
  ) {
    return this.ordersService.outletOrders(user, statuses);
  }

  @Query(() => OutletStats)
  @Roles(Role.OUTLET_STAFF)
  outletStats(@CurrentUser() user: AuthUser) {
    return this.ordersService.outletStats(user);
  }
}
