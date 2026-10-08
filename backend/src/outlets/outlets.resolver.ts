import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from '../common/auth-user';
import { CurrentUser, Roles } from '../common/decorators';
import { Role } from '../common/enums';
import { GqlAuthGuard, RolesGuard } from '../common/guards';
import { CreateOutletInput, UpdateOutletInput } from './dto/outlet.input';
import { Outlet } from './outlet.schema';
import { OutletsService } from './outlets.service';

@Resolver(() => Outlet)
export class OutletsResolver {
  constructor(private outletsService: OutletsService) {}

  // Public: the home page shows outlets to visitors who are not logged in.
  @Query(() => [Outlet])
  outlets(@Args('search', { nullable: true }) search?: string) {
    return this.outletsService.findActive(search);
  }

  @Query(() => Outlet)
  async outlet(@Args('id', { type: () => ID }) id: string) {
    const outlet = await this.outletsService.findByIdOrThrow(id);
    if (!outlet.isActive) throw new Error('This outlet is not available.');
    return outlet;
  }

  // ---- ADMIN only ----
  @Mutation(() => Outlet)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createOutlet(@Args('input') input: CreateOutletInput) {
    return this.outletsService.create(input);
  }

  @Mutation(() => Outlet)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updateOutlet(@Args('input') input: UpdateOutletInput) {
    return this.outletsService.update(input);
  }

  // ---- OUTLET STAFF only: open/close my own counter ----
  @Mutation(() => Outlet)
  @UseGuards(GqlAuthGuard, RolesGuard)
  @Roles(Role.OUTLET_STAFF)
  setMyOutletOpen(
    @CurrentUser() user: AuthUser,
    @Args('isOpen') isOpen: boolean,
  ) {
    return this.outletsService.setOpen(user, isOpen);
  }
}
