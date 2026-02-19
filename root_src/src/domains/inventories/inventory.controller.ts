import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto, UpdateInventoryDto } from './dto';
import { IInventoryWithProduct } from './interfaces/inventory.interface';

/**
 * Inventory Controller
 *
 * Handles all inventory-specific endpoints.
 * All endpoints require JWT authentication and business ownership.
 *
 * @class InventoryController
 * @version 1.0.0
 * @since 2026-02-12
 */
@Controller('v1/inventories')
@ApiTags('Inventories')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ============================================================================
  // CREATE
  // ============================================================================

  @Post(':businessId/:productId')
  @ApiOperation({ summary: 'Create inventory record for a product' })
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
    description: 'Inventory created successfully',
    schema: {
      example: {
        success: true,
        message: 'Inventory created successfully',
        data: {
          id: '660e8400-e29b-41d4-a716-446655440000',
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 50,
          min_stock: 10,
          updated_at: null,
          deleted_at: null,
          id_creator: 'public-uuid',
          id_updater: null,
          product: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Impact Wrench 800W',
            description: 'Heavy duty impact wrench for workshop use',
            price: 1500000,
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
            field: 'quantity',
            message: 'Quantity must not be negative',
          },
          {
            field: 'min_stock',
            message: 'Min stock must not be negative',
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
        code: 'INVENTORY_BUSINESS_ACCESS_DENIED',
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
            code: 'INVENTORY_BUSINESS_NOT_FOUND',
            message: 'Business not found',
          },
        },
        productNotFound: {
          summary: 'Product not found',
          value: {
            statusCode: 404,
            code: 'INVENTORY_NOT_FOUND',
            message: 'Product not found in inventory',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Inventory already exists for this product',
    schema: {
      example: {
        statusCode: 409,
        code: 'INVENTORY_ALREADY_EXISTS',
        message: 'Inventory already exists for this product',
      },
    },
  })
  @ResponseMessage('inventories.success.created')
  async create(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @Body() dto: CreateInventoryDto,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<IInventoryWithProduct> {
    return this.inventoryService.create(
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
  @ApiOperation({
    summary: 'List all inventories for a business with pagination',
  })
  @ApiParam({
    name: 'businessId',
    description: 'Business UUID',
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'low_stock',
    required: false,
    type: Boolean,
    description: 'Filter to show only low stock items (quantity < min_stock)',
  })
  @ApiHeader({
    name: 'x-lang',
    required: false,
    schema: { enum: ['en', 'id'], default: 'en' },
  })
  @ApiResponse({
    status: 200,
    description: 'Inventories list retrieved',
    schema: {
      example: {
        success: true,
        message: 'Inventories list retrieved',
        data: [
          {
            id: '660e8400-e29b-41d4-a716-446655440000',
            product_id: '550e8400-e29b-41d4-a716-446655440000',
            quantity: 50,
            min_stock: 10,
            updated_at: null,
            deleted_at: null,
            id_creator: 'public-uuid',
            id_updater: null,
            product: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              name: 'Impact Wrench 800W',
              description: 'Heavy duty impact wrench for workshop use',
              price: 1500000,
              unit: 'pcs',
              status: 'active',
              business_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
              category_id: '0d3f2e8a-8d9c-4b2e-9f74-7b7d3c5e1a2b',
            },
          },
        ],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
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
        code: 'INVENTORY_BUSINESS_ACCESS_DENIED',
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
        code: 'INVENTORY_BUSINESS_NOT_FOUND',
        message: 'Business not found',
      },
    },
  })
  @ResponseMessage('inventories.success.found')
  async findAll(
    @Param('businessId') businessId: string,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('low_stock') lowStock?: string,
  ): Promise<{
    data: IInventoryWithProduct[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    return this.inventoryService.findAll(
      businessId,
      user.sub,
      { page: Number(page), limit: Number(limit) },
      { low_stock: lowStock === 'true' },
      lang,
    );
  }

  // ============================================================================
  // READ ONE
  // ============================================================================

  @Get(':businessId/:productId')
  @ApiOperation({ summary: 'Get inventory detail for a product' })
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
    description: 'Inventory found successfully',
    schema: {
      example: {
        success: true,
        message: 'Inventory found successfully',
        data: {
          id: '660e8400-e29b-41d4-a716-446655440000',
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 50,
          min_stock: 10,
          updated_at: null,
          deleted_at: null,
          id_creator: 'public-uuid',
          id_updater: null,
          product: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Impact Wrench 800W',
            description: 'Heavy duty impact wrench for workshop use',
            price: 1500000,
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
        code: 'INVENTORY_BUSINESS_ACCESS_DENIED',
        message: 'Access denied to this business',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Business or inventory not found',
    schema: {
      examples: {
        businessNotFound: {
          summary: 'Business not found',
          value: {
            statusCode: 404,
            code: 'INVENTORY_BUSINESS_NOT_FOUND',
            message: 'Business not found',
          },
        },
        inventoryNotFound: {
          summary: 'Inventory not found',
          value: {
            statusCode: 404,
            code: 'INVENTORY_NOT_FOUND',
            message: 'Inventory not found',
          },
        },
      },
    },
  })
  @ResponseMessage('inventories.success.foundOne')
  async findOne(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<IInventoryWithProduct> {
    return this.inventoryService.findOne(businessId, productId, user.sub, lang);
  }

  // ============================================================================
  // UPDATE
  // ============================================================================

  @Put(':businessId/:productId')
  @ApiOperation({ summary: 'Update inventory details' })
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
    description: 'Inventory updated successfully',
    schema: {
      example: {
        success: true,
        message: 'Inventory updated successfully',
        data: {
          id: '660e8400-e29b-41d4-a716-446655440000',
          product_id: '550e8400-e29b-41d4-a716-446655440000',
          quantity: 40,
          min_stock: 10,
          updated_at: '2026-02-05T10:00:00.000Z',
          deleted_at: null,
          id_creator: 'public-uuid',
          id_updater: 'public-uuid',
          product: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            name: 'Impact Wrench 800W',
            description: 'Heavy duty impact wrench for workshop use',
            price: 1500000,
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
            field: 'quantity',
            message: 'Quantity must not be negative',
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
        code: 'INVENTORY_BUSINESS_ACCESS_DENIED',
        message: 'Access denied to this business',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Business or inventory not found',
    schema: {
      examples: {
        businessNotFound: {
          summary: 'Business not found',
          value: {
            statusCode: 404,
            code: 'INVENTORY_BUSINESS_NOT_FOUND',
            message: 'Business not found',
          },
        },
        inventoryNotFound: {
          summary: 'Inventory not found',
          value: {
            statusCode: 404,
            code: 'INVENTORY_NOT_FOUND',
            message: 'Inventory not found',
          },
        },
      },
    },
  })
  @ResponseMessage('inventories.success.updated')
  async update(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateInventoryDto,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<IInventoryWithProduct> {
    return this.inventoryService.update(
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
  @ApiOperation({ summary: 'Delete inventory (soft delete, inventory only)' })
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
    description: 'Inventory deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Inventory deleted successfully',
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
        code: 'INVENTORY_BUSINESS_ACCESS_DENIED',
        message: 'Access denied to this business',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Business or inventory not found',
    schema: {
      examples: {
        businessNotFound: {
          summary: 'Business not found',
          value: {
            statusCode: 404,
            code: 'INVENTORY_BUSINESS_NOT_FOUND',
            message: 'Business not found',
          },
        },
        inventoryNotFound: {
          summary: 'Inventory not found',
          value: {
            statusCode: 404,
            code: 'INVENTORY_NOT_FOUND',
            message: 'Inventory not found',
          },
        },
      },
    },
  })
  @ResponseMessage('inventories.success.deleted')
  async remove(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<void> {
    return this.inventoryService.delete(businessId, productId, user.sub, lang);
  }
}
