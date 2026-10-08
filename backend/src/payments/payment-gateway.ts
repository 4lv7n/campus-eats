import { randomUUID } from 'crypto';
import { PaymentMethod, PaymentStatus } from '../common/enums';

export interface ChargeResult {
  status: PaymentStatus;
  transactionId: string;
}

// ---- The "payment abstraction" ----
// PaymentsService only talks to this interface. To use a real provider (Razorpay, Stripe...)
// later, write a new class that implements PaymentGateway and swap it in payments.module.ts.
export interface PaymentGateway {
  charge(
    amount: number,
    method: PaymentMethod,
    simulateFailure?: boolean,
  ): Promise<ChargeResult>;
}

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';

// DEMO gateway: no real money, no credentials.
//  - CASH  -> PENDING (the student pays at the counter; marked SUCCESS when order is completed)
//  - UPI / CARD -> SUCCESS immediately
//  - simulateFailure = true -> FAILED (lets you demo the "payment failed" screen)
export class MockPaymentGateway implements PaymentGateway {
  async charge(
    _amount: number,
    method: PaymentMethod,
    simulateFailure = false,
  ): Promise<ChargeResult> {
    const transactionId = `MOCK-${randomUUID().slice(0, 8).toUpperCase()}`;
    if (simulateFailure) return { status: PaymentStatus.FAILED, transactionId };
    if (method === PaymentMethod.CASH)
      return { status: PaymentStatus.PENDING, transactionId };
    return { status: PaymentStatus.SUCCESS, transactionId };
  }
}
