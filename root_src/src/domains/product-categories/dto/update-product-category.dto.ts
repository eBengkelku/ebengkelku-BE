import {
  IsOptional,
  IsString,
  IsNotEmpty,
  IsUUID,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCategoryValidationMessages } from '../constants';

/**
 * DTO for updating a product category
 */
export class UpdateProductCategoryDto {
  @ApiPropertyOptional({
    description: 'Product category name',
    example: 'Brake Pads',
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: ProductCategoryValidationMessages.NAME_STRING })
  @Length(1, 255, { message: ProductCategoryValidationMessages.NAME_LENGTH })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({
    description: 'Product category description',
    example: 'Different sizes and models of brake pads',
  })
  @IsOptional()
  @IsString({ message: ProductCategoryValidationMessages.DESCRIPTION_STRING })
  description?: string;

  @ApiPropertyOptional({
    description: 'Product type ID (change category type)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsUUID('4', {
    message: ProductCategoryValidationMessages.PRODUCT_TYPE_ID_UUID,
  })
  product_type_id?: string;

  @ApiProperty({
    description: 'Business ID (for authorization)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsNotEmpty({
    message: ProductCategoryValidationMessages.BUSINESS_ID_REQUIRED,
  })
  @IsUUID('4', { message: ProductCategoryValidationMessages.BUSINESS_ID_UUID })
  business_id: string;
}
