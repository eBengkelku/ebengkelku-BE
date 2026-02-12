import {
  IsOptional,
  IsString,
  IsNotEmpty,
  IsUUID,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductTypeValidationMessages } from '../constants';

/**
 * DTO for updating a product type
 */
export class UpdateProductTypeDto {
  @ApiPropertyOptional({
    description: 'Product type name',
    example: 'Spare Parts',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: ProductTypeValidationMessages.NAME_STRING })
  @Length(1, 100, { message: ProductTypeValidationMessages.NAME_LENGTH })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiProperty({
    description: 'Business ID (for authorization)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsNotEmpty({ message: ProductTypeValidationMessages.BUSINESS_ID_REQUIRED })
  @IsUUID('4', { message: ProductTypeValidationMessages.BUSINESS_ID_UUID })
  business_id: string;
}
