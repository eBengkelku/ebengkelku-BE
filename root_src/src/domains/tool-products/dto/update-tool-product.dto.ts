import { IsOptional, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ToolProductValidationMessages } from '../constants';

/**
 * DTO for updating a tool product extension
 */
export class UpdateToolProductDto {
  @ApiPropertyOptional({
    description: 'Warranty duration in months',
    example: 24,
    minimum: 0,
  })
  @IsOptional()
  @IsInt({ message: ToolProductValidationMessages.WARRANTY_MONTHS_INTEGER })
  @Min(0, { message: ToolProductValidationMessages.WARRANTY_MONTHS_MIN })
  warranty_months?: number;
}
