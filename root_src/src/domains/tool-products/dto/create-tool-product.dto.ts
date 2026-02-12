import { IsOptional, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ToolProductValidationMessages } from '../constants';

/**
 * DTO for creating a tool product extension
 */
export class CreateToolProductDto {
  @ApiPropertyOptional({
    description: 'Warranty duration in months (default: 0)',
    example: 12,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: ToolProductValidationMessages.WARRANTY_MONTHS_INTEGER })
  @Min(0, { message: ToolProductValidationMessages.WARRANTY_MONTHS_MIN })
  warranty_months?: number;
}
