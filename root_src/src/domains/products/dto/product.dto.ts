import { BaseDto } from '../../../common/dto/base.dto';
import { BasePaginationQueryDto } from '../../../common/dto/pagination.dto';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  Min,
  IsIn,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductDto extends BaseDto {
  @ApiProperty({
    description: 'Product name',
    example: 'iPhone 15 Pro',
    maxLength: 255,
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Latest iPhone with advanced camera and A17 Pro chip',
    maxLength: 1000,
  })
  description?: string;

  @ApiProperty({
    description: 'Product price',
    example: 999.99,
    minimum: 0,
  })
  price: number;

  @ApiProperty({
    description: 'Available stock quantity',
    example: 50,
    minimum: 0,
  })
  stock_quantity: number;

  @ApiPropertyOptional({
    description: 'Product category',
    example: 'Electronics',
    maxLength: 100,
  })
  category?: string;

  @ApiPropertyOptional({
    description: 'File UUID associated with the product',
    example: 'a70af782-1f60-4f00-b448-6cb59c46b1dd',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4, { message: 'File ID must be a valid UUID' })
  file_id?: string;

  // File information (joined from files table)
  file_path?: string;
  image_original_name?: string;
  image_mime_type?: string;
  image_file_size?: number;

  deleted_at?: Date; // For soft deletes
  created_by?: string;
  updated_by?: string;
}

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  stock_quantity: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsUUID(4, { message: 'File ID must be a valid UUID' })
  file_id?: string;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  stock_quantity?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsUUID(4, { message: 'File ID must be a valid UUID' })
  file_id?: string;
}

export class PaginationQueryDto extends BasePaginationQueryDto {
  @IsOptional()
  @IsString()
  @IsIn([
    'id',
    'name',
    'description',
    'price',
    'stock_quantity',
    'category',
    'created_at',
    'updated_at',
  ])
  sortBy?: string = 'id';

  @IsOptional()
  @IsString()
  category?: string;
}
