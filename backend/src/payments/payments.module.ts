import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MockPaymentGateway, PAYMENT_GATEWAY } from './payment-gateway';
import { Payment, PaymentSchema } from './payment.schema';
import { PaymentsResolver } from './payments.resolver';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
  ],
  providers: [
    PaymentsService,
    PaymentsResolver,
    // Swap MockPaymentGateway for a real provider class here later.
    { provide: PAYMENT_GATEWAY, useClass: MockPaymentGateway },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
