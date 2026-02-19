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
import { SparePartProductService } from './spare-part-product.service';
import { CreateSparePartProductDto, UpdateSparePartProductDto } from './dto';
import { ISparePartProductWithBaseProduct } from './interfaces/spare-part-product.interface';

/**
 * Spare Part Product Controller
 *
 * Handles all spare-part-product-specific endpoints.
 * All endpoints require JWT authentication and business ownership.
 *
 * @class SparePartProductController
 * @version 1.0.0
 * @since 2026-02-12
 */
@Controller('v1/spare-part-products')
@ApiTags('Spare Part Products')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class SparePartProductController {
  constructor(
    private readonly sparePartProductService: SparePartProductService,
  ) {}

  // ============================================================================
  // CREATE
  // ============================================================================

  @Post(':businessId/:productId')
  @ApiOperation({
    summary: 'Create spare part product extension for a product',
  })
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
    status: 201,
    description: 'Spare part product created successfully',
    schema: {
      example: {
        success: true,
        message: 'Spare part product created successfully',
        data: {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          brand: 'Denso',
          grade: 'genuine',
          updated_at: null,
          deleted_at: null,
          id_creator: 'public-uuid',
          id_updater: null,
          product: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Spark Plug Denso',
            description: 'High performance spark plug for various models',
            price: 75000,
            unit: 'pcs',
            status: 'active',
            business_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            category_id: '0d3f2e8a-8d9c-4b2e-9f74-7b7d3c5e1a2b',
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
            field: 'grade',
            message: 'Grade must be one of genuine or aftermarket',
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
        code: 'SPARE_PART_PRODUCT_BUSINESS_ACCESS_DENIED',
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
            code: 'SPARE_PART_PRODUCT_BUSINESS_NOT_FOUND',
            message: 'Business not found',
          },
        },
        productNotFound: {
          summary: 'Product not found',
          value: {
            statusCode: 404,
            code: 'SPARE_PART_PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Spare part product already exists for this product',
    schema: {
      example: {
        statusCode: 409,
        code: 'SPARE_PART_PRODUCT_ALREADY_EXISTS',
        message: 'Spare part product already exists for this product',
      },
    },
  })
  @ResponseMessage('sparePartProducts.success.created')
  async create(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @Body() dto: CreateSparePartProductDto,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<ISparePartProductWithBaseProduct> {
    return this.sparePartProductService.create(
      businessId,
      productId,
      dto,
      user.sub,
      lang,
    );
  }

  // ============================================================================
  // READ ALL
  // ============================================================================

  @Get(':businessId')
  @ApiOperation({ summary: 'Get all spare part products for a business' })
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
  @ApiResponse({
    status: 200,
    description: 'Spare part products retrieved successfully',
    schema: {
      example: {
        success: true,
        message: 'Spare part products retrieved successfully',
        data: [
          {
            product_id: '550e8400-e29b-41d4-a716-446655440000',
            brand: 'Denso',
            grade: 'genuine',
            updated_at: null,
            deleted_at: null,
            id_creator: 'public-uuid',
            id_updater: null,
            product: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              name: 'Spark Plug Denso',
              description: 'High performance spark plug for various models',
              price: 75000,
              unit: 'pcs',
              status: 'active',
              business_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
              category_id: '0d3f2e8a-8d9c-4b2e-9f74-7b7d3c5e1a2b',
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
        code: 'SPARE_PART_PRODUCT_BUSINESS_ACCESS_DENIED',
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
        code: 'SPARE_PART_PRODUCT_BUSINESS_NOT_FOUND',
        message: 'Business not found',
      },
    },
  })
  @ResponseMessage('sparePartProducts.success.listed')
  async findAll(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.sparePartProductService.findAll(
      businessId,
      { page, limit },
      user.sub,
      lang,
    );
  }

  // ============================================================================
  // READ ONE
  // ============================================================================

  @Get(':businessId/:productId')
  @ApiOperation({ summary: 'Get spare part product detail for a product' })
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
    description: 'Spare part product found successfully',
    schema: {
      example: {
        success: true,
        message: 'Spare part product found successfully',
        data: {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          brand: 'Denso',
          grade: 'genuine',
          updated_at: null,
          deleted_at: null,
          id_creator: 'public-uuid',
          id_updater: null,
          product: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Spark Plug Denso',
            description: 'High performance spark plug for various models',
            price: 75000,
            unit: 'pcs',
            status: 'active',
            business_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            category_id: '0d3f2e8a-8d9c-4b2e-9f74-7b7d3c5e1a2b',
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
        code: 'SPARE_PART_PRODUCT_BUSINESS_ACCESS_DENIED',
        message: 'Access denied to this business',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Business or spare part product not found',
    schema: {
      examples: {
        businessNotFound: {
          summary: 'Business not found',
          value: {
            statusCode: 404,
            code: 'SPARE_PART_PRODUCT_BUSINESS_NOT_FOUND',
            message: 'Business not found',
          },
        },
        sparePartProductNotFound: {
          summary: 'Spare part product not found',
          value: {
            statusCode: 404,
            code: 'SPARE_PART_PRODUCT_NOT_FOUND',
            message: 'Spare part product not found',
          },
        },
      },
    },
  })
  @ResponseMessage('sparePartProducts.success.found')
  async findOne(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<ISparePartProductWithBaseProduct> {
    return this.sparePartProductService.findOne(
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
  @ApiOperation({ summary: 'Update spare part product details' })
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
    description: 'Spare part product updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Spare part product updated successfully',
        data: {
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          brand: 'Denso',
          grade: 'aftermarket',
          updated_at: '2026-02-05T10:00:00.000Z',
          deleted_at: null,
          id_creator: 'public-uuid',
          id_updater: 'public-uuid',
          product: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Spark Plug Denso',
            description: 'High performance spark plug for various models',
            price: 75000,
            unit: 'pcs',
            status: 'active',
            business_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            category_id: '0d3f2e8a-8d9c-4b2e-9f74-7b7d3c5e1a2b',
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
            field: 'brand',
            message: 'Brand is too long',
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
        code: 'SPARE_PART_PRODUCT_BUSINESS_ACCESS_DENIED',
        message: 'Access denied to this business',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Business or spare part product not found',
    schema: {
      examples: {
        businessNotFound: {
          summary: 'Business not found',
          value: {
            statusCode: 404,
            code: 'SPARE_PART_PRODUCT_BUSINESS_NOT_FOUND',
            message: 'Business not found',
          },
        },
        sparePartProductNotFound: {
          summary: 'Spare part product not found',
          value: {
            statusCode: 404,
            code: 'SPARE_PART_PRODUCT_NOT_FOUND',
            message: 'Spare part product not found',
          },
        },
      },
    },
  })
  @ResponseMessage('sparePartProducts.success.updated')
  async update(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateSparePartProductDto,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<ISparePartProductWithBaseProduct> {
    return this.sparePartProductService.update(
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
  @ApiOperation({
    summary: 'Delete spare part product (soft delete, extension only)',
  })
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
    description: 'Spare part product deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Spare part product deleted successfully',
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
        code: 'SPARE_PART_PRODUCT_BUSINESS_ACCESS_DENIED',
        message: 'Access denied to this business',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Business or spare part product not found',
    schema: {
      examples: {
        businessNotFound: {
          summary: 'Business not found',
          value: {
            statusCode: 404,
            code: 'SPARE_PART_PRODUCT_BUSINESS_NOT_FOUND',
            message: 'Business not found',
          },
        },
        sparePartProductNotFound: {
          summary: 'Spare part product not found',
          value: {
            statusCode: 404,
            code: 'SPARE_PART_PRODUCT_NOT_FOUND',
            message: 'Spare part product not found',
          },
        },
      },
    },
  })
  @ResponseMessage('sparePartProducts.success.deleted')
  async remove(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<void> {
    return this.sparePartProductService.delete(
      businessId,
      productId,
      user.sub,
      lang,
    );
  }
}
