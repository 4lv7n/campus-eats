import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module';
import { OutletsModule } from '../outlets/outlets.module';
import { UsersModule } from '../users/users.module';
import { AdminResolver } from './admin.resolver';
import { AdminService } from './admin.service';

@Module({
  imports: [UsersModule, OutletsModule, OrdersModule],
  providers: [AdminService, AdminResolver],
})
export class AdminModule {}
