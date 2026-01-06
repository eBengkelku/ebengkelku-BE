import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

/**
 * Base DTO with common pagination and search parameters
 * Can be extended by domain-specific DTOs
 */
export class BasePaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

/**
 * Generic response wrapper
 */
export class BaseResponseDto<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
