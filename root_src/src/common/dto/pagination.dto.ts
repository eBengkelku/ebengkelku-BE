import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class BasePaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'id';

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsString()
  search?: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  message: string;
}

export class PaginationHelper {
  static calculatePagination(
    currentPage: number,
    limit: number,
    totalItems: number,
  ): PaginationMeta {
    const totalPages = Math.ceil(totalItems / limit);
    const hasNext = currentPage < totalPages;
    const hasPrevious = currentPage > 1;

    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNext,
      hasPrevious,
    };
  }

  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }
}
