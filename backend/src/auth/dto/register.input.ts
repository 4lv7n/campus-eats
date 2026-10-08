import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { CUSTOMER_ROLES, Role } from '../../common/enums';

@InputType()
export class RegisterInput {
  @Field()
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters.' })
  @MaxLength(60)
  name: string;

  @Field()
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email: string;

  @Field()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters.' })
  @MaxLength(72)
  password: string;

  // Only customer roles may self-register. Staff/Admin are created by an admin or the seed.
  @Field(() => Role)
  @IsIn(CUSTOMER_ROLES, {
    message: 'You can only register as Student, Faculty or Hosteller.',
  })
  role: Role;
}
