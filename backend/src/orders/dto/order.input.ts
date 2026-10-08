import { Field, ID, InputType } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { OrderStatus, PaymentMethod } from '../../common/enums';

@InputType()
export class CreateOrderInput {
  @Field(() => PaymentMethod)
  @IsEnum(PaymentMethod, { message: 'Please choose a valid payment method.' })
  paymentMethod: PaymentMethod;

  // DEMO ONLY: forces the mock gateway to fail so you can show the failure screen.
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  simulatePaymentFailure?: boolean;
}

@InputType()
export class UpdateOrderStatusInput {
  @Field(() => ID)
  @IsMongoId({ message: 'Invalid order ID.' })
  orderId: string;

  @Field(() => OrderStatus)
  @IsEnum(OrderStatus, { message: 'Invalid order status.' })
  status: OrderStatus;
}
