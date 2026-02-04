import {
  IsInt,
  Min,
  Max,
  Matches,
  IsString,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

const HH_MM_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

export class BusinessHoursItemDto {
  @ApiProperty({
    description: 'Day of week (0 = Sunday, 6 = Saturday)',
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  @IsInt({ message: 'businesses.validation.hours.dayInteger' })
  @Min(0, { message: 'businesses.validation.hours.dayRange' })
  @Max(6, { message: 'businesses.validation.hours.dayRange' })
  @Type(() => Number)
  day_of_week: number;

  @ApiProperty({
    description: 'Opening time in HH:MM format',
    example: '09:00',
    pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString({ message: 'businesses.validation.hours.openTimeString' })
  @Matches(HH_MM_REGEX, {
    message: 'businesses.validation.hours.openTimeFormat',
  })
  open_time: string;

  @ApiProperty({
    description: 'Closing time in HH:MM format (must be after open_time)',
    example: '17:00',
    pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsString({ message: 'businesses.validation.hours.closeTimeString' })
  @Matches(HH_MM_REGEX, {
    message: 'businesses.validation.hours.closeTimeFormat',
  })
  close_time: string;
}
