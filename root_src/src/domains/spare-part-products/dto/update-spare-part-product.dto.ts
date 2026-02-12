import { IsOptional, IsString, IsIn, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SparePartProductValidationMessages } from '../constants';

/**
 * DTO for updating a spare part product extension
 */
export class UpdateSparePartProductDto {
  @ApiPropertyOptional({
    description: 'Spare part brand name',
    example: 'Bosch',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: SparePartProductValidationMessages.BRAND_STRING })
  @Length(1, 255, { message: SparePartProductValidationMessages.BRAND_LENGTH })
  @Transform(({ value }) => value?.trim())
  brand?: string;

  @ApiPropertyOptional({
    description: 'Spare part grade (genuine or aftermarket)',
    example: 'aftermarket',
    enum: ['genuine', 'aftermarket'],
  })
  @IsOptional()
  @IsIn(['genuine', 'aftermarket'], {
    message: SparePartProductValidationMessages.GRADE_INVALID,
  })
  grade?: string;
}
