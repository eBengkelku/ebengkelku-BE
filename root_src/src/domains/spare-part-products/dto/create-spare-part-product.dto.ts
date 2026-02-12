import { IsOptional, IsString, IsIn, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SparePartProductValidationMessages } from '../constants';

/**
 * DTO for creating a spare part product extension
 */
export class CreateSparePartProductDto {
  @ApiPropertyOptional({
    description: 'Spare part brand name',
    example: 'Denso',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: SparePartProductValidationMessages.BRAND_STRING })
  @Length(1, 255, { message: SparePartProductValidationMessages.BRAND_LENGTH })
  @Transform(({ value }) => value?.trim())
  brand?: string;

  @ApiPropertyOptional({
    description: 'Spare part grade (genuine or aftermarket)',
    example: 'genuine',
    enum: ['genuine', 'aftermarket'],
  })
  @IsOptional()
  @IsIn(['genuine', 'aftermarket'], {
    message: SparePartProductValidationMessages.GRADE_INVALID,
  })
  grade?: string;
}
