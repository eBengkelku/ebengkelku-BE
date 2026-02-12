import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProductTypeValidationMessages } from '../constants';

/**
 * DTO for creating a product type
 */
export class CreateProductTypeDto {
  @ApiProperty({
    description: 'Product type name',
    example: 'Tools',
    minLength: 1,
    maxLength: 100,
  })
  @IsNotEmpty({ message: ProductTypeValidationMessages.NAME_REQUIRED })
  @IsString({ message: ProductTypeValidationMessages.NAME_STRING })
  @Length(1, 100, { message: ProductTypeValidationMessages.NAME_LENGTH })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Business ID (for authorization)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsNotEmpty({ message: ProductTypeValidationMessages.BUSINESS_ID_REQUIRED })
  @IsUUID('4', { message: ProductTypeValidationMessages.BUSINESS_ID_UUID })
  business_id: string;
}
