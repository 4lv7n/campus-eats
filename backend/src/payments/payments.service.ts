import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../common/enums';
import { Payment, PaymentDocument } from './payment.schema';
import { PAYMENT_GATEWAY, PaymentGateway } from './payment-gateway';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @Inject(PAYMENT_GATEWAY) private gateway: PaymentGateway,
  ) {}

  // Charge through the gateway, then save a Payment record (even if it failed).
  async charge(params: {
    orderId: Types.ObjectId;
    userId: string;
    amount: number;
    method: PaymentMethod;
    simulateFailure?: boolean;
  }) {
    const result = await this.gateway.charge(
      params.amount,
      params.method,
      params.simulateFailure,
    );
    return this.paymentModel.create({
      orderId: params.orderId,
      userId: new Types.ObjectId(params.userId),
      amount: params.amount,
      paymentMethod: params.method,
      paymentStatus: result.status,
      transactionId: result.transactionId,
    });
  }

  // Called when a CASH order is completed: the money was collected at the counter.
  async markPaid(orderId: Types.ObjectId) {
    await this.paymentModel.updateMany(
      { orderId, paymentStatus: PaymentStatus.PENDING },
      { paymentStatus: PaymentStatus.SUCCESS },
    );
  }

  findByOrder(orderId: Types.ObjectId) {
    return this.paymentModel.findOne({ orderId }).sort({ createdAt: -1 });
  }
}
