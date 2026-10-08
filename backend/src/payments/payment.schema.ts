import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../common/enums';

@ObjectType()
@Schema({ timestamps: true })
export class Payment {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Field(() => ID)
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Field(() => Float)
  @Prop({ required: true })
  amount: number;

  @Field(() => PaymentMethod)
  @Prop({ type: String, enum: Object.values(PaymentMethod), required: true })
  paymentMethod: PaymentMethod;

  @Field(() => PaymentStatus)
  @Prop({ type: String, enum: Object.values(PaymentStatus), required: true })
  paymentStatus: PaymentStatus;

  @Field()
  @Prop({ required: true })
  transactionId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export type PaymentDocument = HydratedDocument<Payment>;
export const PaymentSchema = SchemaFactory.createForClass(Payment);
