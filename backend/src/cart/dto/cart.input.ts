import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsMongoId, Max, Min } from 'class-validator';

@InputType()
export class AddToCartInput {
  @Field(() => ID)
  @IsMongoId({ message: 'Invalid menu item ID.' })
  menuItemId: string;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1.' })
  @Max(20, { message: 'You can order at most 20 of one item.' })
  quantity: number;
}

@InputType()
export class UpdateCartItemInput {
  @Field(() => ID)
  @IsMongoId({ message: 'Invalid menu item ID.' })
  menuItemId: string;

  // 0 removes the item.
  @Field(() => Int)
  @IsInt()
  @Min(0)
  @Max(20, { message: 'You can order at most 20 of one item.' })
  quantity: number;
}
