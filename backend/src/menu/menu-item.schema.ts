import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@ObjectType()
@Schema({ timestamps: true })
export class MenuItem {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  @Prop({ type: Types.ObjectId, ref: 'Outlet', required: true, index: true })
  outletId: Types.ObjectId;

  @Field()
  @Prop({ required: true, trim: true })
  name: string;

  @Field()
  @Prop({ default: '' })
  description: string;

  @Field(() => Float)
  @Prop({ required: true, min: 0 })
  price: number;

  @Field()
  @Prop({ default: '' })
  image: string;

  @Field()
  @Prop({ default: 'General', trim: true })
  category: string;

  @Field()
  @Prop({ default: true })
  available: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export type MenuItemDocument = HydratedDocument<MenuItem>;
export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);
