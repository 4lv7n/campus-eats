import { UseGuards } from '@nestjs/common';
import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
  Float,
} from '@nestjs/graphql';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { CUSTOMER_ROLES } from '../common/enums';
import { GqlAuthGuard, RolesGuard } from '../common/guards';
import { Cart } from './cart.schema';
import { CartService } from './cart.service';
import { AddToCartInput, UpdateCartItemInput } from './dto/cart.input';

@Resolver(() => Cart)
@UseGuards(GqlAuthGuard, RolesGuard)
@Roles(...CUSTOMER_ROLES)
export class CartResolver {
  constructor(private cartService: CartService) {}

  @ResolveField(() => Float)
  total(@Parent() cart: Cart) {
    return CartService.total(cart);
  }

  @Query(() => Cart)
  cart(@CurrentUser() user: AuthUser) {
    return this.cartService.getCart(user.id);
  }

  @Mutation(() => Cart)
  addToCart(
    @CurrentUser() user: AuthUser,
    @Args('input') input: AddToCartInput,
  ) {
    return this.cartService.addToCart(
      user.id,
      input.menuItemId,
      input.quantity,
    );
  }

  @Mutation(() => Cart)
  updateCartItem(
    @CurrentUser() user: AuthUser,
    @Args('input') input: UpdateCartItemInput,
  ) {
    return this.cartService.updateCartItem(
      user.id,
      input.menuItemId,
      input.quantity,
    );
  }

  @Mutation(() => Cart)
  removeFromCart(
    @CurrentUser() user: AuthUser,
    @Args('menuItemId', { type: () => ID }) menuItemId: string,
  ) {
    return this.cartService.removeFromCart(user.id, menuItemId);
  }

  @Mutation(() => Cart)
  clearCart(@CurrentUser() user: AuthUser) {
    return this.cartService.clearCart(user.id);
  }
}
