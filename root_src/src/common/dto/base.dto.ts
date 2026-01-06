import { IsUUID, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BaseDto {
  @ApiPropertyOptional({
    description: 'Unique identifier (UUID)',
    example: 'a70af782-1f60-4f00-b448-6cb59c46b1dd',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID must be a valid UUID' })
  id?: string;

  @ApiPropertyOptional({
    description: 'Creation timestamp',
    example: '2025-09-17T04:13:53.238Z',
  })
  created_at?: Date;

  @ApiPropertyOptional({
    description: 'Last update timestamp',
    example: '2025-09-17T04:13:53.238Z',
  })
  updated_at?: Date;
}
