import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsOptional,
  IsInt,
  Min,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessProductValidationMessages } from '../constants';

/**
 * DTO for creating a business product
 */
export class CreateBusinessProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Oli Mesin Toyota 10W-40',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty({ message: BusinessProductValidationMessages.NAME_REQUIRED })
  @IsString({ message: BusinessProductValidationMessages.NAME_STRING })
  @Length(1, 255, { message: BusinessProductValidationMessages.NAME_LENGTH })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({
    description: 'Product price (positive integer)',
    example: 85000,
    minimum: 1,
  })
  @IsNotEmpty({ message: BusinessProductValidationMessages.PRICE_REQUIRED })
  @IsInt({ message: BusinessProductValidationMessages.PRICE_INTEGER })
  @Min(1, { message: BusinessProductValidationMessages.PRICE_MIN })
  price: number;

  @ApiProperty({
    description: 'Product category ID (must be active)',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsNotEmpty({
    message: BusinessProductValidationMessages.CATEGORY_ID_REQUIRED,
  })
  @IsUUID('4', { message: BusinessProductValidationMessages.CATEGORY_ID_UUID })
  category_id: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Oli mesin berkualitas tinggi untuk kendaraan Toyota',
  })
  @IsOptional()
  @IsString({ message: BusinessProductValidationMessages.DESCRIPTION_STRING })
  description?: string;

  @ApiPropertyOptional({
    description: 'Product unit (default: pcs)',
    example: 'liter',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: BusinessProductValidationMessages.UNIT_STRING })
  @Length(1, 50, { message: BusinessProductValidationMessages.UNIT_LENGTH })
  unit?: string;
}
