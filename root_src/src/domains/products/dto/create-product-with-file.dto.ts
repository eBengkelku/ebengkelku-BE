import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductWithFileDto {
  @ApiProperty({
    description: 'Product name',
    example: 'iPhone 15 Pro',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Latest iPhone with advanced camera system',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Product price',
    example: 1199.99,
    type: 'number',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiProperty({
    description: 'Available stock quantity',
    example: 50,
    type: 'number',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stock_quantity: number;

  @ApiProperty({
    description: 'Product category',
    example: 'Electronics',
    required: false,
    type: 'string',
  })
  @IsString()
  @IsOptional()
  category?: string;
}
