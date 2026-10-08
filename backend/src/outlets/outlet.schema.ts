import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@ObjectType()
@Schema({ timestamps: true })
export class Outlet {
  @Field(() => ID)
  id: string;

  @Field()
  @Prop({ required: true, trim: true, unique: true })
  name: string;

  @Field()
  @Prop({ default: '' })
  description: string;

  @Field()
  @Prop({ default: '' })
  location: string; // e.g. "Main Block, Ground Floor"

  @Field()
  @Prop({ default: '' })
  image: string; // image URL (optional, UI shows a placeholder when empty)

  // isOpen: staff can open/close the counter during the day.
  @Field()
  @Prop({ default: true })
  isOpen: boolean;

  // isActive: admin switch. false = outlet is hidden from students completely.
  @Field()
  @Prop({ default: true })
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export type OutletDocument = HydratedDocument<Outlet>;
export const OutletSchema = SchemaFactory.createForClass(Outlet);
