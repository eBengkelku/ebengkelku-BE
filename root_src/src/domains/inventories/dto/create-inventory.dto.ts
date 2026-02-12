import { IsOptional, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryValidationMessages } from '../constants';

/**
 * DTO for creating an inventory record
 */
export class CreateInventoryDto {
  @ApiPropertyOptional({
    description: 'Initial quantity in stock (default: 0)',
    example: 100,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: InventoryValidationMessages.QUANTITY_INTEGER })
  @Min(0, { message: InventoryValidationMessages.QUANTITY_MIN })
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Minimum stock threshold for low stock alerts (default: 0)',
    example: 10,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt({ message: InventoryValidationMessages.MIN_STOCK_INTEGER })
  @Min(0, { message: InventoryValidationMessages.MIN_STOCK_MIN })
  min_stock?: number;
}
