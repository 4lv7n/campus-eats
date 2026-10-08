import { UseGuards } from '@nestjs/common';
import {
  Args,
  Float,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { Role } from '../common/enums';
import { GqlAuthGuard, RolesGuard } from '../common/guards';
import { OutletsService } from '../outlets/outlets.service';
import {
  CreateMenuItemInput,
  UpdateMenuItemInput,
} from './dto/menu-item.input';
import { MenuItem } from './menu-item.schema';
import { MenuService } from './menu.service';

@Resolver(() => MenuItem)
export class MenuResolver {
  constructor(
    private menuService: MenuService,
    private outletsService: OutletsService,
  ) {}

  // Public: browse + search + filter.
  @Query(() => [MenuItem])
  menuItems(
    @Args('outletId', { type: () => ID, nullable: true }) outletId?: string,
    @Args('search', { nullable: true }) search?: string,
    @Args('category', { nullable: true }) category?: string,
    @Args('minPrice', { type: () => Float, nullable: true }) minPrice?: number,
    @Args('maxPrice', { type: () => Float, nullable: true }) maxPrice?: number,
    @Args('availableOnly', { nullable: true }) availableOnly?: boolean,
  ) {
    return this.menuService.findMany({
      outletId,
      search,
      category,
      minPrice,
      maxPrice,
      availableOnly,
    });
  }

  @Query(() => MenuItem)
  menuItem(@Args('id', { type: () => ID }) id: string) {
    return this.menuService.findByIdOrThrow(id);
  }

  // Extra field so search results can show which outlet the food belongs to.
  @ResolveField(() => String)
  async outletName(@Parent() item: MenuItem) {
    const outlet = await this.outletsService.findById(item.outletId.toString());
    return outlet ? outlet.name : '';
  }

  @Mutation(() => MenuItem)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.OUTLET_STAFF, Role.ADMIN)
  createMenuItem(
    @CurrentUser() user: AuthUser,
    @Args('input') input: CreateMenuItemInput,
  ) {
    return this.menuService.create(user, input);
  }

  @Mutation(() => MenuItem)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.OUTLET_STAFF, Role.ADMIN)
  updateMenuItem(
    @CurrentUser() user: AuthUser,
    @Args('input') input: UpdateMenuItemInput,
  ) {
    return this.menuService.update(user, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.OUTLET_STAFF, Role.ADMIN)
  deleteMenuItem(
    @CurrentUser() user: AuthUser,
    @Args('id', { type: () => ID }) id: string,
  ) {
    return this.menuService.remove(user, id);
  }
}
