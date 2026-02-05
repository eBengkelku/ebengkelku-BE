import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  Length,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessHoursItemDto } from './business-hours-item.dto';

export class CreateBusinessDto {
  @ApiProperty({
    description: 'Business/workshop name',
    example: 'Bengkel Jaya Motor',
    minLength: 1,
    maxLength: 255,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'businesses.validation.name.required' })
  @IsString({ message: 'businesses.validation.name.string' })
  @Length(1, 255, { message: 'businesses.validation.name.length' })
  name: string;

  @ApiPropertyOptional({
    description: 'Short tagline',
    example: 'Service terpercaya sejak 2010',
    maxLength: 500,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'businesses.validation.tagline.string' })
  @MaxLength(500, { message: 'businesses.validation.tagline.maxLength' })
  tagline?: string;

  @ApiPropertyOptional({
    description: 'Contact phone',
    example: '+6281234567890',
    maxLength: 50,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'businesses.validation.phone.string' })
  @MaxLength(50, { message: 'businesses.validation.phone.maxLength' })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Full address',
    example: 'Jl. Sudirman No. 123, Jakarta',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'businesses.validation.address.string' })
  address?: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate',
    example: -6.2088,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === undefined ? undefined : Number(value),
  )
  @IsNumber({}, { message: 'businesses.validation.latitude.number' })
  @Min(-90, { message: 'businesses.validation.latitude.range' })
  @Max(90, { message: 'businesses.validation.latitude.range' })
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate',
    example: 106.8456,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === undefined ? undefined : Number(value),
  )
  @IsNumber({}, { message: 'businesses.validation.longitude.number' })
  @Min(-180, { message: 'businesses.validation.longitude.range' })
  @Max(180, { message: 'businesses.validation.longitude.range' })
  longitude?: number;

  @ApiPropertyOptional({
    description:
      'Operating hours per day (no duplicate day_of_week). Send as JSON string in form-data.',
    type: [BusinessHoursItemDto],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as BusinessHoursItemDto[];
      } catch {
        return value;
      }
    }
    return value;
  })
  @IsArray({ message: 'businesses.validation.hours.array' })
  @ValidateNested({ each: true })
  @Type(() => BusinessHoursItemDto)
  business_hours?: BusinessHoursItemDto[];
}
