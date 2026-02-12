import {
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  IsIn,
  Min,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessProductValidationMessages } from '../constants';

/**
 * DTO for updating a business product
 *
 * Note: business_id is NOT updatable (comes from URL param)
 */
export class UpdateBusinessProductDto {
  @ApiPropertyOptional({
    description: 'Product name',
    example: 'Oli Mesin Honda 10W-30',
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: BusinessProductValidationMessages.NAME_STRING })
  @Length(1, 255, { message: BusinessProductValidationMessages.NAME_LENGTH })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({
    description: 'Product price (positive integer)',
    example: 95000,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: BusinessProductValidationMessages.PRICE_INTEGER })
  @Min(1, { message: BusinessProductValidationMessages.PRICE_MIN })
  price?: number;

  @ApiPropertyOptional({
    description: 'Product category ID (must be active)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsUUID('4', { message: BusinessProductValidationMessages.CATEGORY_ID_UUID })
  category_id?: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Oli mesin berkualitas untuk kendaraan Honda',
  })
  @IsOptional()
  @IsString({ message: BusinessProductValidationMessages.DESCRIPTION_STRING })
  description?: string;

  @ApiPropertyOptional({
    description: 'Product unit',
    example: 'liter',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: BusinessProductValidationMessages.UNIT_STRING })
  @Length(1, 50, { message: BusinessProductValidationMessages.UNIT_LENGTH })
  unit?: string;

  @ApiPropertyOptional({
    description: 'Product status',
    example: 'active',
    enum: ['active', 'draft', 'archived'],
  })
  @IsOptional()
  @IsIn(['active', 'draft', 'archived'], {
    message: BusinessProductValidationMessages.STATUS_INVALID,
  })
  status?: string;
}
