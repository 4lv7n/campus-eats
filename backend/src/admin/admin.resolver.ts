import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Roles } from '../common/decorators';
import { Role } from '../common/enums';
import { GqlAuthGuard, RolesGuard } from '../common/guards';
import { Order } from '../orders/order.schema';
import { OrdersService } from '../orders/orders.service';
import { Outlet } from '../outlets/outlet.schema';
import { OutletsService } from '../outlets/outlets.service';
import { User } from '../users/user.schema';
import { UsersService } from '../users/users.service';
import { AdminService } from './admin.service';
import { ActivityEntry, AdminStats } from './admin.types';

// EVERY operation in this class is admin-only (guards are on the class).
@Resolver()
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminResolver {
  constructor(
    private adminService: AdminService,
    private usersService: UsersService,
    private ordersService: OrdersService,
    private outletsService: OutletsService,
  ) {}

  @Query(() => AdminStats)
  adminStats() {
    return this.adminService.stats();
  }

  @Query(() => [User])
  adminUsers() {
    return this.usersService.listAll();
  }

  @Query(() => [Order])
  adminOrders() {
    return this.ordersService.adminOrders();
  }

  // Includes disabled outlets (the public "outlets" query hides them).
  @Query(() => [Outlet])
  adminOutlets() {
    return this.outletsService.findAll();
  }

  @Query(() => [ActivityEntry])
  systemActivity() {
    return this.adminService.activity();
  }

  @Mutation(() => User)
  setUserActive(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('isActive') isActive: boolean,
  ) {
    return this.usersService.setActive(userId, isActive);
  }

  // Turn an existing user into staff of one outlet.
  @Mutation(() => User)
  assignOutletStaff(
    @Args('userId', { type: () => ID }) userId: string,
    @Args('outletId', { type: () => ID }) outletId: string,
  ) {
    return this.usersService.assignOutlet(userId, outletId);
  }
}
