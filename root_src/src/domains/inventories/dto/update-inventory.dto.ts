import { IsOptional, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryValidationMessages } from '../constants';

/**
 * DTO for updating an inventory record
 */
export class UpdateInventoryDto {
  @ApiPropertyOptional({
    description: 'Updated quantity in stock',
    example: 50,
    minimum: 0,
  })
  @IsOptional()
  @IsInt({ message: InventoryValidationMessages.QUANTITY_INTEGER })
  @Min(0, { message: InventoryValidationMessages.QUANTITY_MIN })
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Updated minimum stock threshold',
    example: 5,
    minimum: 0,
  })
  @IsOptional()
  @IsInt({ message: InventoryValidationMessages.MIN_STOCK_INTEGER })
  @Min(0, { message: InventoryValidationMessages.MIN_STOCK_MIN })
  min_stock?: number;
}
