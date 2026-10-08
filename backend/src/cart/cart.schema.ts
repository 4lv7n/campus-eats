import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// name/image are copied into the cart so the UI can show it without extra queries.
@ObjectType()
@Schema({ _id: false })
export class CartItem {
  @Field(() => ID)
  @Prop({ type: Types.ObjectId, ref: 'MenuItem', required: true })
  menuItemId: Types.ObjectId;

  @Field()
  @Prop({ required: true })
  name: string;

  @Field()
  @Prop({ default: '' })
  image: string;

  @Field(() => Float)
  @Prop({ required: true, min: 0 })
  price: number;

  @Field(() => Int)
  @Prop({ required: true, min: 1 })
  quantity: number;
}
export const CartItemSchema = SchemaFactory.createForClass(CartItem);

@ObjectType()
@Schema({ timestamps: { createdAt: false, updatedAt: true } })
export class Cart {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  // A cart can only hold food from ONE outlet (an order belongs to one outlet).
  @Field(() => ID, { nullable: true })
  @Prop({ type: Types.ObjectId, ref: 'Outlet' })
  outletId?: Types.ObjectId;

  @Field({ nullable: true })
  @Prop()
  outletName?: string;

  @Field(() => [CartItem])
  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];

  @Field(() => Float)
  total: number; // computed in the resolver

  @Field()
  updatedAt: Date;
}

export type CartDocument = HydratedDocument<Cart>;
export const CartSchema = SchemaFactory.createForClass(Cart);
