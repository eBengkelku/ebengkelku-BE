import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Headers,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { ToolProductService } from './tool-product.service';
import { CreateToolProductDto, UpdateToolProductDto } from './dto';
import { IToolProductWithBaseProduct } from './interfaces/tool-product.interface';

/**
 * Tool Product Controller
 *
 * Handles all tool-product-specific endpoints.
 * All endpoints require JWT authentication and business ownership.
 *
 * @class ToolProductController
 * @version 1.0.0
 * @since 2026-02-12
 */
@Controller('v1/tool-products')
@ApiTags('Tool Products')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class ToolProductController {
  constructor(private readonly toolProductService: ToolProductService) {}

  // ============================================================================
  // CREATE
  // ============================================================================

  @Post(':businessId/:productId')
  @ApiOperation({ summary: 'Create tool product extension for a product' })
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
    description: 'Tool product created successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Access denied or business inactive',
  })
  @ApiResponse({
    status: 404,
    description: 'Business or product not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Tool product already exists for this product',
  })
  @ResponseMessage('toolProducts.success.created')
  async create(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @Body() dto: CreateToolProductDto,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<IToolProductWithBaseProduct> {
    return this.toolProductService.create(
      businessId,
      productId,
      dto,
      user.sub,
      lang,
    );
  }

  // ============================================================================
  // READ ONE
  // ============================================================================

  @Get(':businessId/:productId')
  @ApiOperation({ summary: 'Get tool product detail for a product' })
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
  @ApiResponse({ status: 200, description: 'Tool product found successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Access denied or business inactive',
  })
  @ApiResponse({
    status: 404,
    description: 'Business or tool product not found',
  })
  @ResponseMessage('toolProducts.success.found')
  async findOne(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<IToolProductWithBaseProduct> {
    return this.toolProductService.findOne(
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
  @ApiOperation({ summary: 'Update tool product details' })
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
    description: 'Tool product updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Access denied or business inactive',
  })
  @ApiResponse({
    status: 404,
    description: 'Business or tool product not found',
  })
  @ResponseMessage('toolProducts.success.updated')
  async update(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateToolProductDto,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<IToolProductWithBaseProduct> {
    return this.toolProductService.update(
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
    summary: 'Delete tool product (soft delete, extension only)',
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
    description: 'Tool product deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Access denied or business inactive',
  })
  @ApiResponse({
    status: 404,
    description: 'Business or tool product not found',
  })
  @ResponseMessage('toolProducts.success.deleted')
  async remove(
    @Param('businessId') businessId: string,
    @Param('productId') productId: string,
    @CurrentUser() user: { sub: string },
    @Headers('x-lang') lang = 'en',
  ): Promise<void> {
    return this.toolProductService.delete(
      businessId,
      productId,
      user.sub,
      lang,
    );
  }
}
