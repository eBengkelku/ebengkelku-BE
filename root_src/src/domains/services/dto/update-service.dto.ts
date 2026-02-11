import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsUUID,
  Length,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceValidationMessages } from '../constants';

/**
 * DTO for updating a service
 * Requires business_id for authorization and all service fields are optional
 */
export class UpdateServiceDto {
  @ApiProperty({
    description: 'Business ID for authorization',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsNotEmpty({ message: ServiceValidationMessages.BUSINESS_ID_REQUIRED })
  @IsUUID('4', { message: ServiceValidationMessages.BUSINESS_ID_UUID })
  business_id: string;

  @ApiPropertyOptional({
    description: 'Service name',
    example: 'Oil Change Service',
  })
  @IsOptional()
  @IsString({ message: ServiceValidationMessages.NAME_STRING })
  @Length(1, 255, { message: ServiceValidationMessages.NAME_LENGTH })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({ description: 'Service description' })
  @IsOptional()
  @IsString({ message: ServiceValidationMessages.DESCRIPTION_STRING })
  @Length(0, 1000, { message: ServiceValidationMessages.DESCRIPTION_LENGTH })
  description?: string;

  @ApiPropertyOptional({
    description: 'Price in IDR (integer)',
    example: 150000,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === undefined ? undefined : parseInt(value, 10),
  )
  @IsInt({ message: ServiceValidationMessages.PRICE_INTEGER })
  @Min(0, { message: ServiceValidationMessages.PRICE_MIN })
  @Max(2147483647, { message: ServiceValidationMessages.PRICE_MAX })
  price?: number;

  @ApiPropertyOptional({ description: 'Duration in minutes', example: 30 })
  @IsOptional()
  @Transform(({ value }) =>
    value == null || value === '' ? undefined : parseInt(value, 10),
  )
  @IsInt({ message: ServiceValidationMessages.DURATION_INTEGER })
  @Min(0, { message: ServiceValidationMessages.DURATION_MIN })
  @Max(1440, { message: ServiceValidationMessages.DURATION_MAX })
  duration_minutes?: number;

  @ApiPropertyOptional({ description: 'Daily quota limit', example: 10 })
  @IsOptional()
  @Transform(({ value }) =>
    value == null || value === '' ? undefined : parseInt(value, 10),
  )
  @IsInt({ message: ServiceValidationMessages.QUOTA_INTEGER })
  @Min(0, { message: ServiceValidationMessages.QUOTA_MIN })
  @Max(1000, { message: ServiceValidationMessages.QUOTA_MAX })
  daily_quota?: number;
}
