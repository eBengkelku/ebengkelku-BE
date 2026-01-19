import {
  IsNotEmpty,
  IsString,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Electronics',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'categories.validation.name.required' })
  @IsString({ message: 'categories.validation.name.string' })
  @Length(1, 255, { message: 'categories.validation.name.length' })
  name: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug (auto-generated from name if not provided)',
    example: 'electronics',
    maxLength: 255,
    pattern: '^[a-z0-9-]+$',
  })
  @IsOptional()
  @IsString({ message: 'categories.validation.slug.string' })
  @Length(1, 255, { message: 'categories.validation.slug.length' })
  @Matches(/^[a-z0-9-]+$/, {
    message: 'categories.validation.slug.format',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'Electronic items and gadgets',
  })
  @IsOptional()
  @IsString({ message: 'categories.validation.description.string' })
  description?: string;
}
