import { ForbiddenException, UseGuards } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from '../common/auth-user';
import { CurrentUser } from '../common/decorators';
import { Role } from '../common/enums';
import { GqlAuthGuard } from '../common/guards';
import { assertObjectId } from '../common/helpers';
import { Payment } from './payment.schema';
import { PaymentsService } from './payments.service';

@Resolver(() => Payment)
@UseGuards(GqlAuthGuard)
export class PaymentsResolver {
  constructor(private paymentsService: PaymentsService) {}

  // A user can only see their own payment (admin can see any).
  @Query(() => Payment, { nullable: true })
  async orderPayment(
    @CurrentUser() user: AuthUser,
    @Args('orderId', { type: () => ID }) orderId: string,
  ) {
    const payment = await this.paymentsService.findByOrder(
      assertObjectId(orderId, 'order ID'),
    );
    if (
      payment &&
      user.role !== Role.ADMIN &&
      payment.userId.toString() !== user.id
    ) {
      throw new ForbiddenException('You can only view your own payments.');
    }
    return payment;
  }
}
