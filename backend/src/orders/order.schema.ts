import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../common/enums';

// SNAPSHOT: name and price are copied at order time, so old orders never change
// even if the outlet edits or deletes the menu item later.
@ObjectType()
@Schema({ _id: false })
export class OrderItem {
  @Field(() => ID)
  @Prop({ type: Types.ObjectId, required: true })
  menuItemId: Types.ObjectId;

  @Field()
  @Prop({ required: true })
  name: string;

  @Field(() => Float)
  @Prop({ required: true })
  price: number;

  @Field(() => Int)
  @Prop({ required: true, min: 1 })
  quantity: number;

  @Field(() => Float)
  @Prop({ required: true })
  subtotal: number;
}
export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@ObjectType()
@Schema({ timestamps: true })
export class Order {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Field()
  @Prop({ required: true })
  userName: string; // snapshot, so staff can see who ordered

  @Field(() => ID)
  @Prop({ type: Types.ObjectId, ref: 'Outlet', required: true, index: true })
  outletId: Types.ObjectId;

  @Field()
  @Prop({ required: true })
  outletName: string; // snapshot

  @Field(() => [OrderItem])
  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Field(() => Float)
  @Prop({ required: true })
  totalAmount: number;

  @Field(() => PaymentMethod)
  @Prop({ type: String, enum: Object.values(PaymentMethod), required: true })
  paymentMethod: PaymentMethod;

  @Field(() => PaymentStatus)
  @Prop({ type: String, enum: Object.values(PaymentStatus), required: true })
  paymentStatus: PaymentStatus;

  @Field(() => OrderStatus)
  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
  })
  orderStatus: OrderStatus;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export type OrderDocument = HydratedDocument<Order>;
export const OrderSchema = SchemaFactory.createForClass(Order);
