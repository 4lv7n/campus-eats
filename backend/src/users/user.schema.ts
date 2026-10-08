import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Role } from '../common/enums';

// One class = MongoDB schema + GraphQL type.
// passwordHash has @Prop but NO @Field, so GraphQL can never expose it.
@ObjectType()
@Schema({ timestamps: true })
export class User {
  @Field(() => ID)
  id: string; // Mongoose adds a string "id" getter for _id

  @Field()
  @Prop({ required: true, trim: true })
  name: string;

  @Field()
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Field(() => Role)
  @Prop({ type: String, enum: Object.values(Role), required: true })
  role: Role;

  @Field()
  @Prop({ default: true })
  isActive: boolean;

  // Only used by OUTLET_STAFF: the single outlet they are allowed to manage.
  @Field(() => ID, { nullable: true })
  @Prop({ type: Types.ObjectId, ref: 'Outlet' })
  outletId?: Types.ObjectId;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
