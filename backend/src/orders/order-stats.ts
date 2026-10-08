import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class OutletStats {
  @Field(() => Int) totalOrders: number;
  @Field(() => Int) pendingOrders: number;
  @Field(() => Int) preparingOrders: number;
  @Field(() => Int) readyOrders: number;
  @Field(() => Int) menuItems: number;
  @Field(() => Float) totalRevenue: number; // completed orders only
}
