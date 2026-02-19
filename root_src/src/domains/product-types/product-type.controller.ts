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
import { ProductTypeService } from './product-type.service';
import {
  CreateProductTypeDto,
  UpdateProductTypeDto,
  DeleteProductTypeDto,
} from './dto';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { IProductType } from './interfaces/product-type.interface';

/**
 * Product Type Controller
 *
 * HTTP endpoints for product type management.
 *
 * @class ProductTypeController
 * @version 1.0.0
 * @since 2026-02-12
 */
@Controller('v1/product-types')
@ApiTags('Product Types')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class ProductTypeController {
  constructor(private readonly productTypeService: ProductTypeService) {}

  /**
   * Create a new product type
   */
  @Post()
  @ApiOperation({ summary: 'Create a new product type' })
  @ApiHeader({
    name: 'x-lang',
    required: false,
    schema: { enum: ['en', 'id'], default: 'en' },
  })
  @ApiResponse({
    status: 201,
    description: 'Product type created successfully',
    schema: {
      example: {
        success: true,
        message: 'Product type created successfully',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Lubricants',
          created_at: '2026-02-05T08:00:00.000Z',
          updated_at: null,
          deleted_at: null,
          id_creator: 'public-uuid',
          id_updater: null,
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
            message: 'Product type name is required',
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
        code: 'PRODUCT_TYPE_BUSINESS_ACCESS_DENIED',
        message: 'Access denied to this business',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Business not found',
    schema: {
      example: {
        statusCode: 404,
        code: 'PRODUCT_TYPE_BUSINESS_NOT_FOUND',
        message: 'Business not found',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Product type name already exists',
    schema: {
      example: {
        statusCode: 409,
        code: 'PRODUCT_TYPE_NAME_EXISTS',
        message: 'Product type name already exists',
      },
    },
  })
  @ResponseMessage('productTypes.success.created')
  async create(
    @Body() dto: CreateProductTypeDto,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<IProductType> {
    return this.productTypeService.create(dto, user.sub, lang);
  }

  /**
   * Get all product types with pagination
   */
  @Get()
  @ApiOperation({ summary: 'Get all product types with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({
    status: 200,
    description: 'Product types retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Product types retrieved successfully',
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Lubricants',
            created_at: '2026-02-05T08:00:00.000Z',
            updated_at: null,
            deleted_at: null,
            id_creator: 'public-uuid',
            id_updater: null,
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
  @ResponseMessage('productTypes.success.listed')
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.productTypeService.findAll({
      page: Number(page),
      limit: Number(limit),
    });
  }

  /**
   * Get a product type by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get product type by ID' })
  @ApiParam({ name: 'id', description: 'Product Type ID (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Product type found',
    schema: {
      example: {
        success: true,
        message: 'Product type found',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Lubricants',
          created_at: '2026-02-05T08:00:00.000Z',
          updated_at: null,
          deleted_at: null,
          id_creator: 'public-uuid',
          id_updater: null,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product type not found',
    schema: {
      example: {
        statusCode: 404,
        code: 'PRODUCT_TYPE_NOT_FOUND',
        message: 'Product type not found',
      },
    },
  })
  @ResponseMessage('productTypes.success.found')
  async findOne(
    @Param('id') id: string,
    @Headers('x-lang') lang = 'en',
  ): Promise<IProductType> {
    return this.productTypeService.findById(id, lang);
  }

  /**
   * Update a product type
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update product type by ID',
    description: `
      Update a product type. Requires business ownership or association.
      
      **Authorization:**
      - User must be the owner of the business
      
      **Validation:**
      - business_id is required in request body
      - If name is updated, it must be unique
    `,
  })
  @ApiParam({ name: 'id', description: 'Product Type ID (UUID)' })
  @ApiHeader({
    name: 'x-lang',
    required: false,
    schema: { enum: ['en', 'id'], default: 'en' },
  })
  @ApiResponse({
    status: 200,
    description: 'Product type updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Product type updated successfully',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Premium Lubricants',
          created_at: '2026-02-05T08:00:00.000Z',
          updated_at: '2026-02-05T10:00:00.000Z',
          deleted_at: null,
          id_creator: 'public-uuid',
          id_updater: 'public-uuid',
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
            message: 'Product type name is required',
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
        code: 'PRODUCT_TYPE_BUSINESS_ACCESS_DENIED',
        message: 'Access denied to this business',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product type or business not found',
    schema: {
      example: {
        statusCode: 404,
        code: 'PRODUCT_TYPE_NOT_FOUND',
        message: 'Product type not found',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Product type name already exists',
    schema: {
      example: {
        statusCode: 409,
        code: 'PRODUCT_TYPE_NAME_EXISTS',
        message: 'Product type name already exists',
      },
    },
  })
  @ResponseMessage('productTypes.success.updated')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductTypeDto,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<IProductType> {
    return this.productTypeService.update(id, dto, user.sub, lang);
  }

  /**
   * Delete a product type (soft delete)
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete product type by ID',
    description: `
      Soft delete a product type. Requires business ownership.
      
      **Validation:**
      - Cannot delete if there are active categories using this product type
      - business_id is required in request body
    `,
  })
  @ApiParam({ name: 'id', description: 'Product Type ID (UUID)' })
  @ApiHeader({
    name: 'x-lang',
    required: false,
    schema: { enum: ['en', 'id'], default: 'en' },
  })
  @ApiResponse({
    status: 200,
    description: 'Product type deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Product type deleted successfully',
        data: null,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete - has active categories',
    schema: {
      example: {
        statusCode: 400,
        code: 'PRODUCT_TYPE_HAS_CATEGORIES',
        message: 'Cannot delete product type with active categories',
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
        code: 'PRODUCT_TYPE_BUSINESS_ACCESS_DENIED',
        message: 'Access denied to this business',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Product type or business not found',
    schema: {
      example: {
        statusCode: 404,
        code: 'PRODUCT_TYPE_NOT_FOUND',
        message: 'Product type not found',
      },
    },
  })
  @ResponseMessage('productTypes.success.deleted')
  async remove(
    @Param('id') id: string,
    @Body() dto: DeleteProductTypeDto,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<void> {
    return this.productTypeService.delete(id, dto, user.sub, lang);
  }
}
