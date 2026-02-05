import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsUUID,
  Length,
  Min,
  Max,
  ValidateNested,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceValidationMessages } from '../constants';

/**
 * Base DTO: represents the payload of a service itself
 * (no business ownership, reusable across single & batch)
 */
export class ServicePayloadDto {
  @ApiProperty({ description: 'Service name', example: 'Oil Change Service' })
  @IsNotEmpty({ message: ServiceValidationMessages.NAME_REQUIRED })
  @IsString({ message: ServiceValidationMessages.NAME_STRING })
  @Length(1, 255, { message: ServiceValidationMessages.NAME_LENGTH })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiPropertyOptional({ description: 'Service description' })
  @IsOptional()
  @IsString({ message: ServiceValidationMessages.DESCRIPTION_STRING })
  @Length(0, 1000, { message: ServiceValidationMessages.DESCRIPTION_LENGTH })
  description?: string;

  @ApiProperty({ description: 'Price in IDR (integer)', example: 150000 })
  @IsNotEmpty({ message: ServiceValidationMessages.PRICE_REQUIRED })
  @Transform(({ value }) =>
    value === undefined ? undefined : parseInt(value, 10),
  )
  @IsInt({ message: ServiceValidationMessages.PRICE_INTEGER })
  @Min(0, { message: ServiceValidationMessages.PRICE_MIN })
  @Max(2147483647, { message: ServiceValidationMessages.PRICE_MAX })
  price: number;

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

/**
 * DTO for creating a single service
 * Payload + business ownership
 */
export class CreateServiceDto extends ServicePayloadDto {
  @ApiProperty({
    description: 'Business ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsNotEmpty({ message: ServiceValidationMessages.BUSINESS_ID_REQUIRED })
  @IsUUID('4', { message: ServiceValidationMessages.BUSINESS_ID_UUID })
  business_id: string;
}

/**
 * DTO for batch service creation (max 20 services)
 * One business → many services
 */
export class BatchCreateServicesDto {
  @ApiProperty({
    description: 'Business ID for all services',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsNotEmpty({ message: ServiceValidationMessages.BUSINESS_ID_REQUIRED })
  @IsUUID('4', { message: ServiceValidationMessages.BUSINESS_ID_UUID })
  business_id: string;

  @ApiProperty({
    type: [ServicePayloadDto],
    description: 'Array of services to create (max 20)',
  })
  @IsArray({ message: ServiceValidationMessages.SERVICES_ARRAY })
  @ArrayMaxSize(20, { message: ServiceValidationMessages.SERVICES_MAX_SIZE })
  @ValidateNested({ each: true })
  @Type(() => ServicePayloadDto)
  services: ServicePayloadDto[];
}
