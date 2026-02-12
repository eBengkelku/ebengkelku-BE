import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductTypeValidationMessages } from '../constants';

/**
 * DTO for deleting a product type (requires business_id for authorization)
 */
export class DeleteProductTypeDto {
  @ApiProperty({
    description: 'Business ID (for authorization)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsNotEmpty({ message: ProductTypeValidationMessages.BUSINESS_ID_REQUIRED })
  @IsUUID('4', { message: ProductTypeValidationMessages.BUSINESS_ID_UUID })
  business_id: string;
}
