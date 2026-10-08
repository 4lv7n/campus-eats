import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/decorators';
import { GqlAuthGuard } from '../common/guards';
import { UpdateProfileInput } from './dto/update-profile.input';
import { User } from './user.schema';
import { UsersService } from './users.service';

@Resolver(() => User)
@UseGuards(GqlAuthGuard)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  // The "me" query lives in the users module: returns the logged-in user.
  @Query(() => User)
  async me(@CurrentUser() user: AuthUser) {
    return this.usersService.findById(user.id);
  }

  @Mutation(() => User)
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Args('input') input: UpdateProfileInput,
  ) {
    return this.usersService.updateProfile(user.id, input);
  }
}
