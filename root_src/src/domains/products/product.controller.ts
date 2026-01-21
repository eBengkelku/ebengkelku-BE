import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductTagsDto } from './dto/update-product-tags.dto';
import { ProductService } from './product.service';
import { FilterFormDataInterceptor } from '../../common/interceptors/filter-form-data.interceptor';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { throwCustomBadRequest } from '../../utils/custom-bad-request.util';
import type { Express } from 'express';

/**
 * Product Controller
 *
 * HTTP controller for product-related endpoints using Rich Domain Model pattern.
 * This controller handles HTTP requests, validates DTOs, and delegates business
 * operations to the ProductService.
 *
 * @class ProductController
 * @version 1.0.0
 * @since 2025-10-03
 */
@Controller('v1/products')
@ApiTags('products')
@ApiBearerAuth('JWT-auth')
@UseInterceptors(FileInterceptor('image'), FilterFormDataInterceptor)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  /**
   * Create a new product
   *
   * @param {CreateProductDto} createDto - Product creation data
   * @param {Express.Multer.File} [file] - Optional product image
   * @returns {Promise<any>} Created product
   */
  @Post()
  @ResponseMessage('products.created')
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid product data' })
  async create(
    @Body() createDto: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // If file is provided, use createWithFile
    if (file) {
      return this.productService.createWithFile(createDto, file);
    }

    // Otherwise, regular create
    return this.productService.create(createDto);
  }

  /**
   * Get all products with pagination
   *
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @param {string} [category] - Filter by category
   * @param {number} [minPrice] - Filter by minimum price
   * @param {number} [maxPrice] - Filter by maximum price
   * @returns {Promise<any>} Paginated products
   */
  @Get()
  @ResponseMessage('products.listed')
  @ApiOperation({ summary: 'Get all products with pagination' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('name') name?: string,
  ) {
    const filters: any = {};
    if (category) filters.category = category;
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);
    if (name) filters.name = name;

    return this.productService.findAllWithFiles(
      Number(page),
      Number(limit),
      filters,
    );
  }

  /**
   * Get a product by ID
   *
   * @param {string} id - Product ID
   * @returns {Promise<any>} Product details
   */
  @Get(':id')
  @ResponseMessage('products.found')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string) {
    const result = await this.productService.findByIdWithFile(id);

    if (!result) {
      throwCustomBadRequest({
        statusCode: 4001,
        message: 'products.errors.notFound',
        errorCode: 'PRODUCT_NOT_FOUND',
        errorMessage: 'products.errors.notFoundDetail',
        translationParams: { id },
      });
    }

    return result;
  }

  /**
   * Update a product
   *
   * @param {string} id - Product ID
   * @param {UpdateProductDto} updateDto - Product update data
   * @param {Express.Multer.File} [file] - Optional new product image
   * @returns {Promise<any>} Updated product
   */
  @Put(':id')
  @ResponseMessage('products.updated')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // If file is provided, use updateWithFile
    if (file) {
      return this.productService.updateWithFile(id, updateDto, file);
    }

    // Otherwise, regular update
    return this.productService.update(id, updateDto);
  }

  /**
   * Delete a product (soft delete)
   *
   * @param {string} id - Product ID
   * @returns {Promise<any>} Deletion confirmation
   */
  @Delete(':id')
  @ResponseMessage('products.deleted')
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(@Param('id') id: string) {
    return this.productService.delete(id);
  }

  /**
   * Search products by name
   *
   * @param {string} term - Search term
   * @returns {Promise<any>} Matching products
   */
  @Get('search/name')
  @ResponseMessage('products.listed')
  @ApiOperation({ summary: 'Search products by name' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async searchByName(@Query('term') term: string) {
    if (!term || term.trim().length === 0) {
      throwCustomBadRequest({
        statusCode: 4002,
        message: 'products.errors.searchTermRequired',
        errorCode: 'SEARCH_TERM_REQUIRED',
        errorMessage: 'products.errors.searchTermRequiredDetail',
      });
    }

    return this.productService.searchByName(term);
  }

  /**
   * Get products by category
   *
   * @param {string} category - Category name
   * @param {number} [minPrice] - Minimum price filter
   * @param {number} [maxPrice] - Maximum price filter
   * @param {boolean} [inStock] - Only in-stock products
   * @returns {Promise<any>} Products in category
   */
  @Get('category/:category')
  @ResponseMessage('products.listed')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiResponse({ status: 200, description: 'Products in category' })
  async findByCategory(
    @Param('category') category: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('inStock') inStock?: boolean,
  ) {
    const filters: any = {};
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);
    if (inStock !== undefined) filters.inStock = inStock === true;

    return this.productService.findByCategory(category, filters);
  }

  /**
   * Get low stock products
   *
   * @param {number} threshold - Stock threshold (default: 10)
   * @returns {Promise<any>} Low stock products
   */
  @Get('inventory/low-stock')
  @ResponseMessage('products.listed')
  @ApiOperation({ summary: 'Get low stock products' })
  @ApiResponse({ status: 200, description: 'Low stock products' })
  async getLowStockProducts(@Query('threshold') threshold: number = 10) {
    return this.productService.getLowStockProducts(Number(threshold));
  }

  /**
   * Get out-of-stock products
   *
   * @returns {Promise<any>} Out of stock products
   */
  @Get('inventory/out-of-stock')
  @ResponseMessage('products.listed')
  @ApiOperation({ summary: 'Get out-of-stock products' })
  @ApiResponse({ status: 200, description: 'Out of stock products' })
  async getOutOfStockProducts() {
    return this.productService.getOutOfStockProducts();
  }

  /**
   * Get product statistics
   *
   * @returns {Promise<any>} Product statistics
   */
  @Get('stats/summary')
  @ResponseMessage('common.listed')
  @ApiOperation({ summary: 'Get product statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved' })
  async getProductStats() {
    return this.productService.getProductStats();
  }

  /**
   * Get category statistics
   *
   * @returns {Promise<any>} Category statistics
   */
  @Get('stats/categories')
  @ResponseMessage('common.listed')
  @ApiOperation({ summary: 'Get category statistics' })
  @ApiResponse({ status: 200, description: 'Category statistics retrieved' })
  async getCategoryStats() {
    return this.productService.getCategoryStats();
  }

  /**
   * Apply discount to a product
   *
   * @param {string} id - Product ID
   * @param {number} percent - Discount percentage (0-100)
   * @returns {Promise<any>} Updated product
   */
  @Post(':id/discount')
  @ResponseMessage('products.updated')
  @ApiOperation({ summary: 'Apply discount to product' })
  @ApiResponse({ status: 200, description: 'Discount applied successfully' })
  async applyDiscount(
    @Param('id') id: string,
    @Body('percent') percent: number,
  ) {
    if (percent === undefined || percent === null) {
      throwCustomBadRequest({
        statusCode: 4003,
        message: 'products.errors.discountPercentRequired',
        errorCode: 'DISCOUNT_PERCENT_REQUIRED',
        errorMessage: 'products.errors.discountPercentRequiredDetail',
      });
    }

    if (percent < 0 || percent > 100) {
      throwCustomBadRequest({
        statusCode: 4004,
        message: 'products.errors.invalidDiscountPercent',
        errorCode: 'INVALID_DISCOUNT_PERCENT',
        errorMessage: 'products.errors.invalidDiscountPercentDetail',
      });
    }

    return this.productService.applyDiscount(id, percent);
  }

  /**
   * Adjust product stock
   *
   * @param {string} id - Product ID
   * @param {number} delta - Stock adjustment (positive or negative)
   * @returns {Promise<any>} Updated product
   */
  @Post(':id/adjust-stock')
  @ResponseMessage('products.updated')
  @ApiOperation({ summary: 'Adjust product stock' })
  @ApiResponse({ status: 200, description: 'Stock adjusted successfully' })
  async adjustStock(@Param('id') id: string, @Body('delta') delta: number) {
    if (delta === undefined || delta === null) {
      throwCustomBadRequest({
        statusCode: 4005,
        message: 'products.errors.stockDeltaRequired',
        errorCode: 'STOCK_DELTA_REQUIRED',
        errorMessage: 'products.errors.stockDeltaRequiredDetail',
      });
    }

    if (isNaN(delta)) {
      throwCustomBadRequest({
        statusCode: 4006,
        message: 'products.errors.invalidStockDelta',
        errorCode: 'INVALID_STOCK_DELTA',
        errorMessage: 'products.errors.invalidStockDeltaDetail',
      });
    }

    return this.productService.adjustStock(id, delta);
  }

  /**
   * Restock product
   *
   * @param {string} id - Product ID
   * @param {number} quantity - Quantity to add
   * @returns {Promise<any>} Updated product
   */
  @Post(':id/restock')
  @ResponseMessage('products.updated')
  @ApiOperation({ summary: 'Restock product' })
  @ApiResponse({ status: 200, description: 'Product restocked successfully' })
  async restockProduct(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    if (quantity === undefined || quantity === null) {
      throwCustomBadRequest({
        statusCode: 4007,
        message: 'products.errors.restockQuantityRequired',
        errorCode: 'RESTOCK_QUANTITY_REQUIRED',
        errorMessage: 'products.errors.restockQuantityRequiredDetail',
      });
    }

    if (isNaN(quantity) || quantity <= 0) {
      throwCustomBadRequest({
        statusCode: 4008,
        message: 'products.errors.invalidRestockQuantity',
        errorCode: 'INVALID_RESTOCK_QUANTITY',
        errorMessage: 'products.errors.invalidRestockQuantityDetail',
      });
    }

    return this.productService.restockProduct(id, quantity);
  }

  /**
   * Sell product (decrease stock)
   *
   * @param {string} id - Product ID
   * @param {number} quantity - Quantity sold
   * @returns {Promise<any>} Updated product
   */
  @Post(':id/sell')
  @ResponseMessage('products.updated')
  @ApiOperation({ summary: 'Sell product (decrease stock)' })
  @ApiResponse({ status: 200, description: 'Product sold successfully' })
  async sellProduct(
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    if (quantity === undefined || quantity === null) {
      throwCustomBadRequest({
        statusCode: 4009,
        message: 'products.errors.sellQuantityRequired',
        errorCode: 'SELL_QUANTITY_REQUIRED',
        errorMessage: 'products.errors.sellQuantityRequiredDetail',
      });
    }

    if (isNaN(quantity) || quantity <= 0) {
      throwCustomBadRequest({
        statusCode: 4010,
        message: 'products.errors.invalidSellQuantity',
        errorCode: 'INVALID_SELL_QUANTITY',
        errorMessage: 'products.errors.invalidSellQuantityDetail',
      });
    }

    return this.productService.sellProduct(id, quantity);
  }

  /**
   * Advanced search
   *
   * @param {string} [search] - Search term
   * @param {string} [category] - Category filter
   * @param {number} [minPrice] - Minimum price
   * @param {number} [maxPrice] - Maximum price
   * @param {boolean} [inStock] - Only in-stock
   * @param {string} [sortBy] - Sort field
   * @param {string} [sortOrder] - Sort order (asc/desc)
   * @returns {Promise<any>} Filtered products
   */
  @Get('advanced-search')
  @ResponseMessage('products.listed')
  @ApiOperation({ summary: 'Advanced product search' })
  @ApiResponse({ status: 200, description: 'Search results' })
  async advancedSearch(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('inStock') inStock?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const query: any = {};
    if (search) query.search = search;
    if (category) query.category = category;
    if (minPrice) query.minPrice = Number(minPrice);
    if (maxPrice) query.maxPrice = Number(maxPrice);
    if (inStock !== undefined) query.inStock = inStock === true;
    if (sortBy) query.sortBy = sortBy;
    if (sortOrder) query.sortOrder = sortOrder;

    return this.productService.advancedSearch(query);
  }

  /**
   * Bulk update stock
   *
   * @param {Array} updates - Stock updates
   * @returns {Promise<any>} Update results
   */
  @Post('bulk/update-stock')
  @ResponseMessage('common.updated')
  @ApiOperation({ summary: 'Bulk update product stock' })
  @ApiResponse({ status: 200, description: 'Bulk update completed' })
  async bulkUpdateStock(
    @Body('updates') updates: Array<{ id: string; stock_quantity: number }>,
  ) {
    if (!updates || !Array.isArray(updates)) {
      throwCustomBadRequest({
        statusCode: 4011,
        message: 'products.errors.updatesArrayRequired',
        errorCode: 'UPDATES_ARRAY_REQUIRED',
        errorMessage: 'products.errors.updatesArrayRequiredDetail',
      });
    }

    if (updates.length === 0) {
      throwCustomBadRequest({
        statusCode: 4012,
        message: 'products.errors.updatesArrayEmpty',
        errorCode: 'UPDATES_ARRAY_EMPTY',
        errorMessage: 'products.errors.updatesArrayEmptyDetail',
      });
    }

    // Validate each update item
    for (let i = 0; i < updates.length; i++) {
      const update = updates[i];
      if (!update.id || update.stock_quantity === undefined) {
        throwCustomBadRequest({
          statusCode: 4013,
          message: 'products.errors.invalidUpdateItem',
          errorCode: 'INVALID_UPDATE_ITEM',
          errorMessage: 'products.errors.invalidUpdateItemDetail',
          translationParams: { index: i },
        });
      }

      if (isNaN(update.stock_quantity) || update.stock_quantity < 0) {
        throwCustomBadRequest({
          statusCode: 4014,
          message: 'products.errors.invalidStockQuantity',
          errorCode: 'INVALID_STOCK_QUANTITY',
          errorMessage: 'products.errors.invalidStockQuantityDetail',
          translationParams: { index: i },
        });
      }
    }

    return this.productService.bulkUpdateStock(updates);
  }

  /**
   * Update product tags (attach/detach)
   *
   * Syncs tags for a product. Replaces all existing tags with the provided tag IDs.
   *
   * @param {string} id - Product ID
   * @param {UpdateProductTagsDto} dto - Tag IDs to attach
   * @returns {Promise<any>} Updated product with tags loaded
   */
  @Post(':id/tags')
  @ResponseMessage('products.tags.updated')
  @ApiOperation({ summary: 'Update product tags' })
  @ApiResponse({ status: 200, description: 'Product tags updated successfully' })
  @ApiResponse({ status: 404, description: 'Product or tag not found' })
  async updateProductTags(
    @Param('id') id: string,
    @Body() dto: UpdateProductTagsDto,
  ) {
    return this.productService.updateProductTags(id, dto.tag_ids);
  }
}
