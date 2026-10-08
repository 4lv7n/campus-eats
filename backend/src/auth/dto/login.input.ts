import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email: string;

  @Field()
  @IsString()
  @MinLength(1, { message: 'Password is required.' })
  password: string;
}
