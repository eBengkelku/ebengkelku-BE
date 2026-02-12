import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCategoryValidationMessages } from '../constants';

/**
 * DTO for creating a product category
 */
export class CreateProductCategoryDto {
  @ApiProperty({
    description: 'Product category name',
    example: 'Engine Oil',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty({ message: ProductCategoryValidationMessages.NAME_REQUIRED })
  @IsString({ message: ProductCategoryValidationMessages.NAME_STRING })
  @Length(1, 255, { message: ProductCategoryValidationMessages.NAME_LENGTH })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Product type ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsNotEmpty({
    message: ProductCategoryValidationMessages.PRODUCT_TYPE_ID_REQUIRED,
  })
  @IsUUID('4', {
    message: ProductCategoryValidationMessages.PRODUCT_TYPE_ID_UUID,
  })
  product_type_id: string;

  @ApiPropertyOptional({
    description: 'Product category description',
    example: 'Various types of engine oils for different vehicle models',
  })
  @IsOptional()
  @IsString({ message: ProductCategoryValidationMessages.DESCRIPTION_STRING })
  description?: string;

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
