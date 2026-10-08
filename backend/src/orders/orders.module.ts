import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartModule } from '../cart/cart.module';
import { MenuModule } from '../menu/menu.module';
import { OutletsModule } from '../outlets/outlets.module';
import { PaymentsModule } from '../payments/payments.module';
import { Order, OrderSchema } from './order.schema';
import { OrdersResolver } from './orders.resolver';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    CartModule,
    MenuModule,
    OutletsModule,
    PaymentsModule,
  ],
  providers: [OrdersService, OrdersResolver],
  exports: [OrdersService],
})
export class OrdersModule {}
