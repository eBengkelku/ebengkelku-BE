import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductRepository } from './repository/product.repository';
import { ProductModel } from './models/product.model';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { v4 as uuidv4 } from 'uuid';
import { Knex } from 'knex';
import { DatabaseService } from '../../database/database.service';
import { CategoryService } from '../classifiers/services/category.service';
import { TagService } from '../classifiers/services/tag.service';
import type { Express } from 'express';

/**
 * Product Service
 *
 * Application service for product-related operations using the Rich Domain Model pattern.
 * This service acts as an orchestrator, coordinating between controllers, domain models,
 * and repositories while keeping business logic in the domain layer.
 *
 * Responsibilities:
 * - Orchestrate use cases and workflows
 * - Manage transactions
 * - Coordinate multiple repositories
 * - Convert between DTOs and domain models
 * - Handle external service integration
 *
 * Business logic should be in ProductModel, not here.
 *
 * @class ProductService
 * @version 1.0.0
 * @since 2025-10-03
 *
 * @example
 * ```typescript
 * // In a controller
 * constructor(private readonly productService: ProductService) {}
 *
 * @Post()
 * async create(@Body() dto: CreateProductDto) {
 *   return this.productService.create(dto);
 * }
 * ```
 */
@Injectable()
export class ProductService {
  /**
   * Knex query builder for transactions
   * @private
   */
  private get knex(): Knex {
    return this.databaseService.getKnex();
  }

  /**
   * Creates an instance of ProductService
   *
   * @param {ProductRepository} repository - Repository for product data access
   * @param {DatabaseService} databaseService - Database service for transactions
   */
  constructor(
    private readonly repository: ProductRepository,
    private readonly databaseService: DatabaseService,
    private readonly categoryService: CategoryService,
    private readonly tagService: TagService,
  ) {}

  // ============================================================================
  // STANDARD CRUD OPERATIONS
  // ============================================================================

  /**
   * Creates a new product
   *
   * Orchestrates product creation:
   * 1. Creates domain model with validation
   * 2. Persists via repository
   * 3. Returns entity for API response
   *
   * @param {CreateProductDto} dto - Product creation data
   * @returns {Promise<any>} Created product entity
   *
   * @example
   * ```typescript
   * const product = await service.create({
   *   name: 'iPhone 15',
   *   price: 999.99,
   *   stock_quantity: 50,
   *   category: 'Electronics',
   * });
   * ```
   */
  async create(dto: CreateProductDto) {
    // Validate category_id if provided
    if (dto.category_id) {
      await this.categoryService.findOne(dto.category_id);
    }

    // Create domain model (validates business rules)
    const product = ProductModel.create({
      id: uuidv4(),
      name: dto.name,
      price: dto.price,
      stock: dto.stock_quantity,
      description: dto.description,
      category: dto.category,
      categoryId: dto.category_id,
      fileId: dto.file_id,
    });

    // Persist to database
    await this.repository.save(product);

    // Return entity with relations loaded
    return this.findById(product.getId());
  }

  /**
   * Finds a product by ID
   *
   * @param {string} id - Product ID
   * @returns {Promise<any>} Product entity
   * @throws {NotFoundException} If product not found
   *
   * @example
   * ```typescript
   * const product = await service.findById('uuid-123');
   * ```
   */
  async findById(id: string) {
    const product = await this.repository.findByIdOrThrow(id);
    const entity = product.toEntity();

    // Load category relation if category_id exists
    if (entity.category_id) {
      try {
        const category = await this.categoryService.findOne(entity.category_id);
        // Category data is already in entity, but we can add it to response if needed
      } catch (error) {
        // Category not found, but don't fail the request
        entity.category_id = undefined;
      }
    }

    // Load tags relation
    const tags = await this.loadProductTags(id);
    entity.tags = tags;

    return entity;
  }

  /**
   * Finds all products with pagination
   *
   * @param {Object} pagination - Pagination parameters
   * @param {number} pagination.page - Page number (1-based)
   * @param {number} pagination.limit - Records per page
   * @returns {Promise<{data: any[], total: number}>} Paginated products
   *
   * @example
   * ```typescript
   * const result = await service.findAll({ page: 1, limit: 10 });
   * ```
   */
  async findAll(pagination: { page: number; limit: number }) {
    const result = await this.repository.findAll(pagination);
    const entities = result.data.map((product) => product.toEntity());

    // Load tags for all products
    for (const entity of entities) {
      entity.tags = await this.loadProductTags(entity.id);
    }

    return {
      data: entities,
      total: result.total,
    };
  }

  /**
   * Updates a product
   *
   * Orchestrates product update:
   * 1. Fetches existing product
   * 2. Updates via domain model (validates business rules)
   * 3. Persists changes
   * 4. Returns updated entity
   *
   * @param {string} id - Product ID
   * @param {UpdateProductDto} dto - Update data
   * @returns {Promise<any>} Updated product entity
   * @throws {NotFoundException} If product not found
   *
   * @example
   * ```typescript
   * const updated = await service.update('uuid-123', {
   *   price: 899.99,
   *   stock_quantity: 45,
   * });
   * ```
   */
  async update(id: string, dto: UpdateProductDto) {
    const product = await this.repository.findByIdOrThrow(id);

    // Validate category_id if provided
    if (dto.category_id) {
      await this.categoryService.findOne(dto.category_id);
    }

    // Business logic in model
    product.update({
      name: dto.name,
      price: dto.price,
      stock: dto.stock_quantity,
      description: dto.description,
      category: dto.category,
      categoryId: dto.category_id,
      fileId: dto.file_id,
    });

    await this.repository.save(product);
    return this.findById(id);
  }

  /**
   * Deletes a product (soft delete)
   *
   * @param {string} id - Product ID
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * await service.delete('uuid-123');
   * ```
   */
  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  // ============================================================================
  // BUSINESS OPERATIONS - Leverage domain model methods
  // ============================================================================

  /**
   * Adjusts product stock (increase or decrease)
   *
   * @param {string} id - Product ID
   * @param {number} delta - Amount to adjust (positive or negative)
   * @returns {Promise<any>} Updated product entity
   *
   * @example
   * ```typescript
   * await service.adjustStock('uuid-123', -5);  // Sell 5 units
   * await service.adjustStock('uuid-123', 20);  // Restock 20 units
   * ```
   */
  async adjustStock(id: string, delta: number) {
    const product = await this.repository.findByIdOrThrow(id);
    product.adjustStock(delta); // Business logic in model
    await this.repository.save(product);
    return product.toEntity();
  }

  /**
   * Restocks a product
   *
   * @param {string} id - Product ID
   * @param {number} quantity - Quantity to add
   * @returns {Promise<any>} Updated product entity
   *
   * @example
   * ```typescript
   * await service.restockProduct('uuid-123', 50);
   * ```
   */
  async restockProduct(id: string, quantity: number) {
    const product = await this.repository.findByIdOrThrow(id);
    product.restockItems(quantity); // Business logic in model
    await this.repository.save(product);
    return product.toEntity();
  }

  /**
   * Sells/decreases product stock
   *
   * @param {string} id - Product ID
   * @param {number} quantity - Quantity sold
   * @returns {Promise<any>} Updated product entity
   *
   * @example
   * ```typescript
   * await service.sellProduct('uuid-123', 3);
   * ```
   */
  async sellProduct(id: string, quantity: number) {
    const product = await this.repository.findByIdOrThrow(id);
    product.sellItems(quantity); // Business logic in model
    await this.repository.save(product);
    return product.toEntity();
  }

  /**
   * Applies a percentage discount to a product
   *
   * @param {string} id - Product ID
   * @param {number} discountPercent - Discount percentage (0-100)
   * @returns {Promise<any>} Updated product entity
   *
   * @example
   * ```typescript
   * await service.applyDiscount('uuid-123', 20); // 20% off
   * ```
   */
  async applyDiscount(id: string, discountPercent: number) {
    const product = await this.repository.findByIdOrThrow(id);
    product.applyDiscount(discountPercent); // Business logic in model
    await this.repository.save(product);
    return product.toEntity();
  }

  /**
   * Updates product price
   *
   * @param {string} id - Product ID
   * @param {number} newPrice - New price
   * @returns {Promise<any>} Updated product entity
   *
   * @example
   * ```typescript
   * await service.updatePrice('uuid-123', 899.99);
   * ```
   */
  async updatePrice(id: string, newPrice: number) {
    const product = await this.repository.findByIdOrThrow(id);
    product.updatePrice(newPrice); // Business logic in model
    await this.repository.save(product);
    return product.toEntity();
  }

  // ============================================================================
  // QUERY OPERATIONS - Delegate to repository
  // ============================================================================

  /**
   * Finds products by category
   *
   * @param {string} category - Category name
   * @param {Object} [filters] - Additional filters
   * @returns {Promise<any>} Products in category
   *
   * @example
   * ```typescript
   * const electronics = await service.findByCategory('electronics', {
   *   minPrice: 100,
   *   maxPrice: 1000,
   *   inStock: true,
   * });
   * ```
   */
  async findByCategory(
    category: string,
    filters?: {
      minPrice?: number;
      maxPrice?: number;
      inStock?: boolean;
    },
  ) {
    let products = await this.repository.findByCategory(category);

    // Apply additional filters
    if (filters?.minPrice) {
      products = products.filter((p) => p.getPrice() >= filters.minPrice!);
    }
    if (filters?.maxPrice) {
      products = products.filter((p) => p.getPrice() <= filters.maxPrice!);
    }
    if (filters?.inStock) {
      products = products.filter((p) => p.isInStock());
    }

    return products.map((p) => p.toEntity());
  }

  /**
   * Gets products with low stock
   *
   * @param {number} threshold - Stock threshold (default: 10)
   * @returns {Promise<any>} Low stock products
   *
   * @example
   * ```typescript
   * const lowStock = await service.getLowStockProducts(5);
   * ```
   */
  async getLowStockProducts(threshold: number = 10) {
    const products = await this.repository.findLowStock(threshold);
    return products.map((p) => p.toEntity());
  }

  /**
   * Gets out-of-stock products
   *
   * @returns {Promise<any>} Out of stock products
   *
   * @example
   * ```typescript
   * const outOfStock = await service.getOutOfStockProducts();
   * ```
   */
  async getOutOfStockProducts() {
    const products = await this.repository.findOutOfStock();
    return products.map((p) => p.toEntity());
  }

  /**
   * Searches products by name
   *
   * @param {string} searchTerm - Search term
   * @returns {Promise<any>} Matching products
   *
   * @example
   * ```typescript
   * const iphones = await service.searchByName('iphone');
   * ```
   */
  async searchByName(searchTerm: string) {
    const products = await this.repository.searchByName(searchTerm);
    return products.map((p) => p.toEntity());
  }

  /**
   * Gets product statistics
   *
   * @returns {Promise<any>} Product statistics
   *
   * @example
   * ```typescript
   * const stats = await service.getProductStats();
   * ```
   */
  async getProductStats() {
    return this.repository.getProductStats();
  }

  /**
   * Gets category statistics
   *
   * @returns {Promise<any>} Statistics by category
   *
   * @example
   * ```typescript
   * const categoryStats = await service.getCategoryStats();
   * ```
   */
  async getCategoryStats() {
    return this.repository.getCategoryStats();
  }

  /**
   * Advanced product search with multiple filters
   *
   * @param {Object} query - Search parameters
   * @returns {Promise<any>} Filtered products
   *
   * @example
   * ```typescript
   * const results = await service.advancedSearch({
   *   search: 'laptop',
   *   category: 'electronics',
   *   minPrice: 500,
   *   maxPrice: 2000,
   *   inStock: true,
   *   sortBy: 'price',
   *   sortOrder: 'asc',
   * });
   * ```
   */
  async advancedSearch(query: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const products = await this.repository.advancedSearch(query);
    return products.map((p) => p.toEntity());
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  /**
   * Bulk updates stock quantities
   *
   * Updates multiple products' stock in a single transaction.
   *
   * @param {Array} updates - Stock updates
   * @returns {Promise<any>} Update results
   *
   * @example
   * ```typescript
   * await service.bulkUpdateStock([
   *   { id: 'uuid-1', stock_quantity: 50 },
   *   { id: 'uuid-2', stock_quantity: 25 },
   * ]);
   * ```
   */
  async bulkUpdateStock(
    updates: Array<{ id: string; stock_quantity: number }>,
  ) {
    await this.repository.bulkUpdateStock(updates);

    return {
      success: true,
      message: 'Bulk stock update completed',
      updated_count: updates.length,
    };
  }

  // ============================================================================
  // FILE HANDLING OPERATIONS
  // ============================================================================

  /**
   * Creates a product with required image upload
   *
   * Handles the complete workflow of creating a product with an associated file
   * in a single transaction.
   *
   * @param {CreateProductDto} productData - Product data
   * @param {Express.Multer.File} imageFile - Uploaded image file
   * @returns {Promise<any>} Created product with file info
   *
   * @example
   * ```typescript
   * const product = await service.createWithFile(dto, imageFile);
   * ```
   */
  async createWithFile(
    productData: CreateProductDto,
    imageFile: Express.Multer.File,
  ) {
    const transaction = await this.knex.transaction();

    try {
      // Create file record
      const fileRecord = {
        file_path: `/var/www/files/images/${Date.now()}-${imageFile.originalname}`,
        original_name: imageFile.originalname,
        mime_type: imageFile.mimetype,
        file_size: imageFile.size,
        file_type: 'image',
        extension: imageFile.originalname.split('.').pop()?.toLowerCase() || '',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const [insertedFile] = await transaction('files')
        .insert(fileRecord)
        .returning('id');

      // Create product domain model
      const product = ProductModel.create({
        id: uuidv4(),
        name: productData.name,
        price: productData.price,
        stock: productData.stock_quantity,
        description: productData.description,
        category: productData.category,
        fileId: insertedFile.id,
      });

      // Save product
      const entity = product.toEntity();
      await transaction('products').insert(entity);

      await transaction.commit();

      // Get the created product with file information
      const result = await this.findByIdWithFile(product.getId());

      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Updates a product with optional image update
   *
   * @param {string} id - Product ID
   * @param {UpdateProductDto} productData - Update data
   * @param {Express.Multer.File} [imageFile] - Optional new image
   * @returns {Promise<any>} Updated product with file info
   *
   * @example
   * ```typescript
   * const updated = await service.updateWithFile(id, dto, newImage);
   * ```
   */
  async updateWithFile(
    id: string,
    productData: UpdateProductDto,
    imageFile?: Express.Multer.File,
  ) {
    const transaction = await this.knex.transaction();

    try {
      // Get existing product
      const product = await this.repository.findByIdOrThrow(id);
      const oldFileId = product.getFileId();

      let newFileId = oldFileId;

      // If new image provided, create file record
      if (imageFile) {
        const fileRecord = {
          file_path: `/var/www/files/images/${Date.now()}-${imageFile.originalname}`,
          original_name: imageFile.originalname,
          mime_type: imageFile.mimetype,
          file_size: imageFile.size,
          file_type: 'image',
          extension:
            imageFile.originalname.split('.').pop()?.toLowerCase() || '',
          created_at: new Date(),
          updated_at: new Date(),
        };

        const [insertedFile] = await transaction('files')
          .insert(fileRecord)
          .returning('id');
        newFileId = insertedFile.id;

        // Soft delete old file
        if (oldFileId) {
          await transaction('files')
            .where('id', oldFileId)
            .update({ deleted_at: new Date() });
        }
      }

      // Update product
      product.update({
        name: productData.name,
        price: productData.price,
        stock: productData.stock_quantity,
        description: productData.description,
        category: productData.category,
        fileId: newFileId,
      });

      const entity = product.toEntity();
      await transaction('products')
        .where('id', id)
        .update({
          ...entity,
          updated_at: new Date(),
        });

      await transaction.commit();

      // Get updated product with file info
      const result = await this.findByIdWithFile(id);
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Finds a product by ID with file information
   *
   * @param {string} id - Product ID
   * @returns {Promise<any>} Product with file info
   *
   * @example
   * ```typescript
   * const product = await service.findByIdWithFile('uuid-123');
   * ```
   */
  async findByIdWithFile(id: string) {
    const result = await this.knex('products')
      .leftJoin('files', 'products.file_id', 'files.id')
      .select(
        'products.*',
        'files.file_path',
        'files.original_name as image_original_name',
        'files.mime_type as image_mime_type',
        'files.file_size as image_file_size',
      )
      .where('products.id', id)
      .whereNull('products.deleted_at')
      .where(function () {
        this.whereNull('files.deleted_at').orWhereNull('files.id');
      })
      .first();

    return result || null;
  }

  /**
   * Finds all products with file information
   *
   * @param {number} page - Page number
   * @param {number} limit - Records per page
   * @param {Object} filters - Filters
   * @returns {Promise<any>} Products with file info
   *
   * @example
   * ```typescript
   * const result = await service.findAllWithFiles(1, 10, { category: 'electronics' });
   * ```
   */
  async findAllWithFiles(
    page: number = 1,
    limit: number = 10,
    filters: any = {},
  ) {
    // Build base query for count (simpler query without joins)
    let countQuery = this.knex('products').whereNull('products.deleted_at');

    // Apply filters to count query
    if (filters.category) {
      countQuery = countQuery.whereRaw(
        'LOWER(products.category) LIKE LOWER(?)',
        [`%${filters.category}%`],
      );
    }
    if (filters.name) {
      countQuery = countQuery.whereRaw('LOWER(products.name) LIKE LOWER(?)', [
        `%${filters.name}%`,
      ]);
    }
    if (filters.minPrice) {
      countQuery = countQuery.where('products.price', '>=', filters.minPrice);
    }
    if (filters.maxPrice) {
      countQuery = countQuery.where('products.price', '<=', filters.maxPrice);
    }

    // Get count (without join to avoid GROUP BY issues)
    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count as string);

    // Build data query with joins
    let dataQuery = this.knex('products')
      .leftJoin('files', 'products.file_id', 'files.id')
      .select(
        'products.*',
        'files.file_path',
        'files.original_name as image_original_name',
        'files.mime_type as image_mime_type',
        'files.file_size as image_file_size',
      )
      .whereNull('products.deleted_at')
      .where(function () {
        this.whereNull('files.deleted_at').orWhereNull('files.id');
      });

    // Apply filters to data query
    if (filters.category) {
      dataQuery = dataQuery.whereRaw('LOWER(products.category) LIKE LOWER(?)', [
        `%${filters.category}%`,
      ]);
    }
    if (filters.name) {
      dataQuery = dataQuery.whereRaw('LOWER(products.name) LIKE LOWER(?)', [
        `%${filters.name}%`,
      ]);
    }
    if (filters.minPrice) {
      dataQuery = dataQuery.where('products.price', '>=', filters.minPrice);
    }
    if (filters.maxPrice) {
      dataQuery = dataQuery.where('products.price', '<=', filters.maxPrice);
    }

    // Get paginated data
    const offset = (page - 1) * limit;
    const data = await dataQuery
      .limit(limit)
      .offset(offset)
      .orderBy('products.created_at', 'desc');

    return {
      data,
      meta: {
        current_page: page,
        per_page: limit,
        total,
        last_page: Math.ceil(total / limit),
      },
    };
  }

  // ============================================================================
  // TAG MANAGEMENT METHODS
  // ============================================================================

  /**
   * Loads tags for a product
   *
   * @private
   * @param {string} productId - Product ID
   * @returns {Promise<Array<{id: string; name: string; color: string}>>} Array of tags
   */
  private async loadProductTags(
    productId: string,
  ): Promise<Array<{ id: string; name: string; color: string }>> {
    const tagRows = await this.knex('product_tags')
      .where('product_id', productId)
      .join('tags', 'product_tags.tag_id', 'tags.id')
      .whereNull('tags.deleted_at')
      .select('tags.id', 'tags.name', 'tags.color');

    return tagRows.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
    }));
  }

  /**
   * Attaches tags to a product (sync operation)
   *
   * Replaces all existing tags with the provided tag IDs.
   *
   * @param {string} productId - Product ID
   * @param {string[]} tagIds - Array of tag IDs to attach
   * @returns {Promise<any>} Updated product with tags loaded
   * @throws {NotFoundException} If product or any tag not found
   *
   * @example
   * ```typescript
   * const product = await service.updateProductTags('uuid-123', [
   *   'tag-uuid-1',
   *   'tag-uuid-2',
   * ]);
   * ```
   */
  async updateProductTags(productId: string, tagIds: string[]) {
    // Validate product exists
    await this.repository.findByIdOrThrow(productId);

    // Validate all tags exist
    for (const tagId of tagIds) {
      await this.tagService.findOne(tagId);
    }

    // Use transaction for atomic operation
    await this.knex.transaction(async (trx) => {
      // Remove all existing tags
      await trx('product_tags').where('product_id', productId).del();

      // Insert new tags
      if (tagIds.length > 0) {
        const insertData = tagIds.map((tagId) => ({
          product_id: productId,
          tag_id: tagId,
        }));
        await trx('product_tags').insert(insertData);
      }
    });

    // Return product with tags loaded
    return this.findById(productId);
  }
}
