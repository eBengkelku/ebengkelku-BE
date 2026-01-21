import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for updating product tags
 *
 * @class UpdateProductTagsDto
 */
export class UpdateProductTagsDto {
  @ApiProperty({
    description: 'Array of tag IDs to attach to the product',
    example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
    type: [String],
    isArray: true,
  })
  @IsArray({ message: 'products.validation.tags.array' })
  @IsUUID('4', { each: true, message: 'products.validation.tags.uuid' })
  @ArrayMinSize(0, { message: 'products.validation.tags.minSize' })
  tag_ids: string[];
}
