import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Length,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'iPhone 15 Pro',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'products.validation.name.required' })
  @IsString({ message: 'products.validation.name.string' })
  @Length(1, 255, { message: 'products.validation.name.length' })
  name: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Latest iPhone with advanced camera system',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: 'products.validation.description.string' })
  @Length(0, 1000, { message: 'products.validation.description.maxLength' })
  description?: string;

  @ApiProperty({
    description: 'Product price in decimal format',
    example: 1199.99,
    minimum: 1,
    type: 'number',
    format: 'float',
  })
  @IsNotEmpty({ message: 'products.validation.price.required' })
  @Transform(({ value }) =>
    value === undefined ? undefined : parseFloat(value),
  )
  @IsNumber({}, { message: 'products.validation.price.number' })
  @Min(1, { message: 'products.validation.price.min' })
  price: number;

  @ApiProperty({
    description: 'Available stock quantity',
    example: 50,
    minimum: 0,
    type: 'integer',
  })
  @IsNotEmpty({ message: 'products.validation.stock_quantity.required' })
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value)))
  @IsNumber({}, { message: 'products.validation.stock_quantity.number' })
  @Min(0, { message: 'products.validation.stock_quantity.min' })
  stock_quantity: number;

  @ApiPropertyOptional({
    description: 'Product category (legacy field)',
    example: 'Electronics',
    maxLength: 100,
    deprecated: true,
  })
  @IsOptional()
  @IsString({ message: 'products.validation.category.string' })
  @Length(0, 100, { message: 'products.validation.category.maxLength' })
  category?: string;

  @ApiPropertyOptional({
    description: 'Category ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
    format: 'uuid',
  })
  @IsOptional()
  @IsString({ message: 'products.validation.category_id.string' })
  category_id?: string;
}
