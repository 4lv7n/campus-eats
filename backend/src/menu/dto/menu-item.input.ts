import { Field, Float, ID, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

@InputType()
export class CreateMenuItemInput {
  // Staff: ignored (their own outlet is used). Admin: required.
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsMongoId({ message: 'Invalid outlet ID.' })
  outletId?: string;

  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @Field(() => Float)
  @IsNumber({}, { message: 'Price must be a number.' })
  @Min(1, { message: 'Price must be at least 1.' })
  @Max(10000, { message: 'Price is too high.' })
  price: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  image?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  available?: boolean;
}

@InputType()
export class UpdateMenuItemInput {
  @Field(() => ID)
  @IsMongoId({ message: 'Invalid menu item ID.' })
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  price?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  image?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  available?: boolean;
}
