import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AdminStats {
  @Field(() => Int) totalUsers: number;
  @Field(() => Int) totalOutlets: number;
  @Field(() => Int) totalOrders: number;
  @Field(() => Float) totalOrderValue: number;
}

@ObjectType()
export class ActivityEntry {
  @Field() type: string; // USER_JOINED or ORDER
  @Field() message: string;
  @Field() createdAt: Date;
}
