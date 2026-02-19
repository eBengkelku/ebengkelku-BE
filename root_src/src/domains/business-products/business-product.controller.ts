import {
  Controller,
  Get,
  Post,
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
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { BusinessProductService } from './business-product.service';
import { CreateBusinessProductDto, UpdateBusinessProductDto } from './dto';
import { IBusinessProductWithCategory } from './interfaces/business-product.interface';

/**
 * Business Product Controller
 *
 * Handles all business-scoped product endpoints.
 * All endpoints require JWT authentication and business ownership.
 *
 * @class BusinessProductController
 * @version 1.0.0
 * @since 2026-02-12
 */
@Controller('v1/products')
@ApiTags('Business Products')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class BusinessProductController {
  constructor(
    private readonly businessProductService: BusinessProductService,
  ) {}

  // ============================================================================
  // CREATE
  // ============================================================================

  @Post(':businessId')
  @ApiOperation({ summary: 'Create a new product for a business' })
  @ApiParam({
    name: 'businessId',
    description: 'Business UUID',
    type: String,
  })
  @ApiHeader({
    name: 'x-lang',
    required: false,
    schema: { enum: ['en', 'id'], default: 'en' },
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    schema: {
      example: {
        success: true,
        message: 'Product created successfully',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Oli Mesin Toyota 10W-40',
          description: 'Oli mesin berkualitas tinggi untuk kendaraan Toyota',
          price: 85000,
          unit: 'liter',
          status: 'active',
          business_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          category_id: '0d3f2e8a-8d9c-4b2e-9f74-7b7d3c5e1a2b',
          created_at: '2026-02-05T08:00:00.000Z',
          updated_at: null,
          deleted_at: null,
          id_creator: 'public-uuid',
          id_updater: null,
          category: {
            id: '0d3f2e8a-8d9c-4b2e-9f74-7b7d3c5e1a2b',
            name: 'Engine Oil',
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
          { field: 'name', message: 'Product name is required' },
          { field: 'price', message: 'Price must be a positive integer' },
          { field: 'category_id', message: 'Category ID is required' },
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
        code: 'BUSINESS_PRODUCT_BUSINESS_ACCESS_DENIED',
        message: 'Access denied to this business',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Business or category not found',
    schema: {
      examples: {
        businessNotFound: {
          summary: 'Business not found',
          value: {
            statusCode: 404,
            code: 'BUSINESS_PRODUCT_BUSINESS_NOT_FOUND',
            message: 'Business not found',
          },
        },
        categoryNotFound: {
          summary: 'Category not found',
          value: {
            statusCode: 404,
            code: 'BUSINESS_PRODUCT_CATEGORY_NOT_FOUND',
            message: 'Category not found',
          },
        },
      },
    },
  })
  @ResponseMessage('businessProducts.success.created')
  async create(
    @Param('businessId') businessId: string,
    @Body() dto: CreateBusinessProductDto,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<IBusinessProductWithCategory> {
    return this.businessProductService.create(businessId, dto, user.sub, lang);
  }

  // ============================================================================
  // READ ALL
  // ============================================================================

  @Get(':businessId')
  @ApiOperation({ summary: 'Get all products for a business' })
  @ApiParam({
    name: 'businessId',
    description: 'Business UUID',
    type: String,
  })
  @ApiHeader({
    name: 'x-lang',
    required: false,
    schema: { enum: ['en', 'id'], default: 'en' },
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['active', 'draft', 'archived'],
  })
  @ApiQuery({
    name: 'category_id',
    required: false,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Products retrieved successfully',
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Oli Mesin Toyota 10W-40',
            description: 'Oli mesin berkualitas tinggi untuk kendaraan Toyota',
            price: 85000,
            unit: 'liter',
            status: 'active',
            business_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            category_id: '0d3f2e8a-8d9c-4b2e-9f74-7b7d3c5e1a2b',
            created_at: '2026-02-05T08:00:00.000Z',
            updated_at: null,
            deleted_at: null,
            id_creator: 'public-uuid',
            id_updater: null,
            category: {
              id: '0d3f2e8a-8d9c-4b2e-9f74-7b7d3c5e1a2b',
              name: 'Engine Oil',
            },
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
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
        code: 'BUSINESS_PRODUCT_BUSINESS_ACCESS_DENIED',
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
        code: 'BUSINESS_PRODUCT_BUSINESS_NOT_FOUND',
        message: 'Business not found',
      },
    },
  })
  @ResponseMessage('businessProducts.success.listed')
  async findAll(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
    @Query('category_id') category_id?: string,
  ) {
    return this.businessProductService.findAll(
      businessId,
      { page, limit },
      { status, category_id },
      user.sub,
      lang,
    );
  }

  // ============================================================================
  // READ ONE
  // ============================================================================

  @Get(':businessId/:productId')
  @ApiOperation({ summary: 'Get a specific product' })
  @ApiParam({
    name: 'businessId',
    description: 'Business UUID',
    type: String,
  })
  @ApiParam({
    name: 'productId',
    description: 'Product UUID',
    type: String,
  })
  @ApiHeader({
    name: 'x-lang',
    required: false,
    schema: { enum: ['en', 'id'], default: 'en' },
  })
  @ApiResponse({
    status: 200,
    description: 'Product found successfully',
    schema: {
      example: {
        success: true,
        message: 'Product found successfully',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Oli Mesin Toyota 10W-40',
          description: 'Oli mesin berkualitas tinggi untuk kendaraan Toyota',
          price: 85000,
          unit: 'liter',
          status: 'active',
          business_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          category_id: '0d3f2e8a-8d9c-4b2e-9f74-7b7d3c5e1a2b',
          created_at: '2026-02-05T08:00:00.000Z',
          updated_at: null,
          deleted_at: null,
          id_creator: 'public-uuid',
          id_updater: null,
          category: {
            id: '0d3f2e8a-8d9c-4b2e-9f74-7b7d3c5e1a2b',
            name: 'Engine Oil',
          },
        },
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
        code: 'BUSINESS_PRODUCT_BUSINESS_ACCESS_DENIED',
        message: 'Access denied to this business',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Business or product not found',
    schema: {
      examples: {
        businessNotFound: {
          summary: 'Business not found',
          value: {
            statusCode: 404,
            code: 'BUSINESS_PRODUCT_BUSINESS_NOT_FOUND',
            message: 'Business not found',
          },
        },
        productNotFound: {
          summary: 'Product not found',
          value: {
            statusCode: 404,
            code: 'BUSINESS_PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        },
      },
    },
  })
  @ResponseMessage('businessProducts.success.found')
  async findOne(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<IBusinessProductWithCategory> {
    return this.businessProductService.findById(
      businessId,
      productId,
      user.sub,
      lang,
    );
  }

  // ============================================================================
  // UPDATE
  // ============================================================================

  @Put(':businessId/:productId')
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({
    name: 'businessId',
    description: 'Business UUID',
    type: String,
  })
  @ApiParam({
    name: 'productId',
    description: 'Product UUID',
    type: String,
  })
  @ApiHeader({
    name: 'x-lang',
    required: false,
    schema: { enum: ['en', 'id'], default: 'en' },
  })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Product updated successfully',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Oli Mesin Toyota 10W-40 (Updated)',
          description: 'Updated description',
          price: 90000,
          unit: 'liter',
          status: 'active',
          business_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          category_id: '0d3f2e8a-8d9c-4b2e-9f74-7b7d3c5e1a2b',
          created_at: '2026-02-05T08:00:00.000Z',
          updated_at: '2026-02-05T10:00:00.000Z',
          deleted_at: null,
          id_creator: 'public-uuid',
          id_updater: 'public-uuid',
          category: {
            id: '0d3f2e8a-8d9c-4b2e-9f74-7b7d3c5e1a2b',
            name: 'Engine Oil',
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
        errors: [{ field: 'price', message: 'Price must be a positive integer' }],
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
        code: 'BUSINESS_PRODUCT_BUSINESS_ACCESS_DENIED',
        message: 'Access denied to this business',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Business, product, or category not found',
    schema: {
      examples: {
        businessNotFound: {
          summary: 'Business not found',
          value: {
            statusCode: 404,
            code: 'BUSINESS_PRODUCT_BUSINESS_NOT_FOUND',
            message: 'Business not found',
          },
        },
        productNotFound: {
          summary: 'Product not found',
          value: {
            statusCode: 404,
            code: 'BUSINESS_PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        },
        categoryNotFound: {
          summary: 'Category not found',
          value: {
            statusCode: 404,
            code: 'BUSINESS_PRODUCT_CATEGORY_NOT_FOUND',
            message: 'Category not found',
          },
        },
      },
    },
  })
  @ResponseMessage('businessProducts.success.updated')
  async update(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateBusinessProductDto,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<IBusinessProductWithCategory> {
    return this.businessProductService.update(
      businessId,
      productId,
      dto,
      user.sub,
      lang,
    );
  }

  // ============================================================================
  // DELETE
  // ============================================================================

  @Delete(':businessId/:productId')
  @ApiOperation({ summary: 'Delete a product (soft delete)' })
  @ApiParam({
    name: 'businessId',
    description: 'Business UUID',
    type: String,
  })
  @ApiParam({
    name: 'productId',
    description: 'Product UUID',
    type: String,
  })
  @ApiHeader({
    name: 'x-lang',
    required: false,
    schema: { enum: ['en', 'id'], default: 'en' },
  })
  @ApiResponse({
    status: 200,
    description: 'Product deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Product deleted successfully',
        data: null,
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
        code: 'BUSINESS_PRODUCT_BUSINESS_ACCESS_DENIED',
        message: 'Access denied to this business',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Business or product not found',
    schema: {
      examples: {
        businessNotFound: {
          summary: 'Business not found',
          value: {
            statusCode: 404,
            code: 'BUSINESS_PRODUCT_BUSINESS_NOT_FOUND',
            message: 'Business not found',
          },
        },
        productNotFound: {
          summary: 'Product not found',
          value: {
            statusCode: 404,
            code: 'BUSINESS_PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        },
      },
    },
  })
  @ResponseMessage('businessProducts.success.deleted')
  async remove(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<void> {
    return this.businessProductService.delete(
      businessId,
      productId,
      user.sub,
      lang,
    );
  }
}
