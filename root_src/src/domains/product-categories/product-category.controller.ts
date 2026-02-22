import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductCategoryService } from './product-category.service';
import {
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
  DeleteProductCategoryDto,
} from './dto';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { IProductCategoryWithType } from './interfaces/product-category.interface';

/**
 * Product Category Controller
 *
 * HTTP endpoints for product category management.
 *
 * @class ProductCategoryController
 * @version 1.0.0
 * @since 2026-02-12
 */
@Controller('v1/product-categories')
@ApiTags('Product Categories')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class ProductCategoryController {
  constructor(
    private readonly productCategoryService: ProductCategoryService,
  ) {}

  /**
   * Create a new product category
   */
  @Post()
  @ApiOperation({ summary: 'Create a new product category' })
  @ApiHeader({
    name: 'x-lang',
    required: false,
    schema: { enum: ['en', 'id'], default: 'en' },
  })
  @ApiResponse({
    status: 201,
    description: 'Product category created successfully',
    schema: {
      example: {
        success: true,
        message: 'Product category created successfully',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Engine Oil',
          description: 'Various types of engine oils for different vehicle models',
          product_type_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          created_at: '2026-02-05T08:00:00.000Z',
          updated_at: null,
          deleted_at: null,
          id_creator: 'public-uuid',
          id_updater: null,
          product_type: {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Lubricants',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed',
        errors: [
          {
            field: 'name',
            message: 'Product category name is required',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied or business inactive',
    schema: {
      example: {
        statusCode: 403,
        code: 'PRODUCT_CATEGORY_BUSINESS_ACCESS_DENIED',
        message: 'Access denied to this business',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Business or product type not found',
    schema: {
      example: {
        statusCode: 404,
        code: 'PRODUCT_CATEGORY_BUSINESS_NOT_FOUND',
        message: 'Business not found',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Product category name already exists',
    schema: {
      example: {
        statusCode: 409,
        code: 'PRODUCT_CATEGORY_NAME_EXISTS',
        message: 'Product category name already exists',
      },
    },
  })
  @ResponseMessage('productCategories.success.created')
  async create(
    @Body() dto: CreateProductCategoryDto,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<IProductCategoryWithType> {
    return this.productCategoryService.create(dto, user.sub, lang);
  }

  /**
   * Get all product categories with pagination and optional filter
   */
  @Get()
  @ApiOperation({
    summary: 'Get all product categories',
    description:
      'Retrieve product categories with pagination and optional product type filter',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'product_type_id',
    required: false,
    description: 'Filter by product type ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Product categories retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Product categories retrieved successfully',
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Engine Oil',
            description: 'Various types of engine oils',
            product_type_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            created_at: '2026-02-05T08:00:00.000Z',
            updated_at: null,
            deleted_at: null,
            id_creator: 'public-uuid',
            id_updater: null,
            product_type: {
              id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
              name: 'Lubricants',
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      },
    },
  })
  @ResponseMessage('productCategories.success.listed')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('product_type_id') productTypeId?: string,
  ) {
    return this.productCategoryService.findAll(
      { page: Number(page), limit: Number(limit) },
      productTypeId,
    );
  }

  /**
   * Get a product category by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get product category by ID' })
  @ApiParam({ name: 'id', description: 'Product Category ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Product category found',
    schema: {
      example: {
        success: true,
        message: 'Product category found',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Engine Oil',
          description: 'Various types of engine oils for different vehicle models',
          product_type_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          created_at: '2026-02-05T08:00:00.000Z',
          updated_at: null,
          deleted_at: null,
          id_creator: 'public-uuid',
          id_updater: null,
          product_type: {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Lubricants',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product category not found',
    schema: {
      example: {
        statusCode: 404,
        code: 'PRODUCT_CATEGORY_NOT_FOUND',
        message: 'Product category not found',
      },
    },
  })
  @ResponseMessage('productCategories.success.found')
  async findOne(
    @Param('id') id: string,
    @Headers('x-lang') lang = 'en',
  ): Promise<IProductCategoryWithType> {
    return this.productCategoryService.findById(id, lang);
  }

  /**
   * Update a product category
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update product category by ID',
    description: `
      Update a product category. Requires business ownership.
      
      **Authorization:**
      - User must be the owner of the business
      
      **Validation:**
      - business_id is required in request body
      - If name is updated, it must be unique
      - If product_type_id is updated, the new type must exist
    `,
  })
  @ApiParam({ name: 'id', description: 'Product Category ID (UUID)' })
  @ApiHeader({
    name: 'x-lang',
    required: false,
    schema: { enum: ['en', 'id'], default: 'en' },
  })
  @ApiResponse({
    status: 200,
    description: 'Product category updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Product category updated successfully',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Premium Engine Oil',
          description: 'Updated description',
          product_type_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          created_at: '2026-02-05T08:00:00.000Z',
          updated_at: '2026-02-05T10:00:00.000Z',
          deleted_at: null,
          id_creator: 'public-uuid',
          id_updater: 'public-uuid',
          product_type: {
            id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            name: 'Lubricants',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    schema: {
      example: {
        statusCode: 400,
        message: 'Validation failed',
        errors: [
          {
            field: 'name',
            message: 'Product category name is required',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
    schema: {
      example: {
        statusCode: 403,
        code: 'PRODUCT_CATEGORY_BUSINESS_ACCESS_DENIED',
        message: 'Access denied to this business',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product category, business, or type not found',
    schema: {
      example: {
        statusCode: 404,
        code: 'PRODUCT_CATEGORY_NOT_FOUND',
        message: 'Product category not found',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Product category name already exists',
    schema: {
      example: {
        statusCode: 409,
        code: 'PRODUCT_CATEGORY_NAME_EXISTS',
        message: 'Product category name already exists',
      },
    },
  })
  @ResponseMessage('productCategories.success.updated')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductCategoryDto,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<IProductCategoryWithType> {
    return this.productCategoryService.update(id, dto, user.sub, lang);
  }

  /**
   * Delete a product category (soft delete)
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete product category by ID',
    description: `
      Soft delete a product category. Requires business ownership.
      
      **Validation:**
      - Cannot delete if there are active products using this category
      - business_id is required in request body
    `,
  })
  @ApiParam({ name: 'id', description: 'Product Category ID (UUID)' })
  @ApiHeader({
    name: 'x-lang',
    required: false,
    schema: { enum: ['en', 'id'], default: 'en' },
  })
  @ApiResponse({
    status: 200,
    description: 'Product category deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Product category deleted successfully',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete - has active products',
    schema: {
      example: {
        statusCode: 400,
        code: 'PRODUCT_CATEGORY_HAS_PRODUCTS',
        message: 'Cannot delete product category with active products',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Unauthorized',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied',
    schema: {
      example: {
        statusCode: 403,
        code: 'PRODUCT_CATEGORY_BUSINESS_ACCESS_DENIED',
        message: 'Access denied to this business',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product category or business not found',
    schema: {
      example: {
        statusCode: 404,
        code: 'PRODUCT_CATEGORY_NOT_FOUND',
        message: 'Product category not found',
      },
    },
  })
  @ResponseMessage('productCategories.success.deleted')
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteProductCategoryDto,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<void> {
    return this.productCategoryService.delete(id, dto, user.sub, lang);
  }
}
