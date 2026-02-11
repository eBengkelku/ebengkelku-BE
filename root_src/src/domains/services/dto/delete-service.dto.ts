import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceValidationMessages } from '../constants';

/**
 * DTO for deleting a service
 * Requires business_id for authorization
 */
export class DeleteServiceDto {
  @ApiProperty({
    description: 'Business ID for authorization',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsNotEmpty({ message: ServiceValidationMessages.BUSINESS_ID_REQUIRED })
  @IsUUID('4', { message: ServiceValidationMessages.BUSINESS_ID_UUID })
  business_id: string;
}
