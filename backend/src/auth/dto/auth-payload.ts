import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../users/user.schema';

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field(() => User)
  user: User;
}
