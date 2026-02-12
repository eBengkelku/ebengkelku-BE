import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductCategoryValidationMessages } from '../constants';

/**
 * DTO for deleting a product category (requires business_id for authorization)
 */
export class DeleteProductCategoryDto {
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
