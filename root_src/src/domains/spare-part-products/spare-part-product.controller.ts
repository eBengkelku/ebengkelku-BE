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
    description: 'Spare part product already exists for this product',
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
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Access denied or business inactive',
  })
  @ApiResponse({ status: 404, description: 'Business not found' })
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
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Access denied or business inactive',
  })
  @ApiResponse({
    status: 404,
    description: 'Business or spare part product not found',
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
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Access denied or business inactive',
  })
  @ApiResponse({
    status: 404,
    description: 'Business or spare part product not found',
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
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Access denied or business inactive',
  })
  @ApiResponse({
    status: 404,
    description: 'Business or spare part product not found',
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
