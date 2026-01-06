import { Injectable } from '@nestjs/common';
import { BaseDomainRepository } from '../../../common/domain/base-domain.repository';
import { DatabaseService } from '../../../database/database.service';
import { ProductModel } from '../models/product.model';
import { IProduct } from '../interfaces/product.interface';

/**
 * Product Repository
 *
 * Repository for managing product persistence and data access.
 * Implements the repository pattern to provide a clean abstraction between
 * the domain layer and data access layer.
 *
 * This repository extends BaseDomainRepository to inherit common CRUD operations
 * while adding product-specific queries and data access methods.
 *
 * @class ProductRepository
 * @extends {BaseDomainRepository<ProductModel, IProduct>}
 * @version 1.0.0
 * @since 2025-10-03
 *
 * @example
 * ```typescript
 * // In a service
 * constructor(private readonly productRepository: ProductRepository) {}
 *
 * async createProduct(data: CreateProductDto) {
 *   const product = ProductModel.create({ id: uuidv4(), ...data });
 *   await this.productRepository.save(product);
 *   return product.toEntity();
 * }
 *
 * async getProduct(id: string) {
 *   const product = await this.productRepository.findByIdOrThrow(id);
 *   return product.toEntity();
 * }
 * ```
 */
@Injectable()
export class ProductRepository extends BaseDomainRepository<
  ProductModel,
  IProduct
> {
  /**
   * Database table name for products
   * @protected
   * @readonly
   */
  protected tableName = 'products';

  /**
   * Creates an instance of ProductRepository
   *
   * @param {DatabaseService} databaseService - Database service for Knex access
   *
   * @example
   * ```typescript
   * @Injectable()
   * export class ProductRepository extends BaseDomainRepository {
   *   constructor(databaseService: DatabaseService) {
   *     super(databaseService, { ... });
   *   }
   * }
   * ```
   */
  constructor(databaseService: DatabaseService) {
    super(databaseService, {
      entityName: 'Product',
      tableName: 'products',
      primaryKey: 'id',
      timestampColumns: {
        created: 'created_at',
        updated: 'updated_at',
        deleted: 'deleted_at',
      },
      softDelete: true,
      descColumns: ['name', 'description', 'category'],
    });
  }

  // ============================================================================
  // REQUIRED ABSTRACT METHOD IMPLEMENTATIONS
  // ============================================================================

  /**
   * Finds a product by ID
   *
   * Returns null if the product doesn't exist or is soft-deleted.
   *
   * @param {string} id - Product ID (UUID)
   * @returns {Promise<ProductModel | null>} Product model or null
   *
   * @example
   * ```typescript
   * const product = await repository.findById('uuid-123');
   * if (product) {
   *   console.log(product.getName());
   * }
   * ```
   */
  async findById(id: string): Promise<ProductModel | null> {
    const row = await this.baseQuery().where('id', id).first();

    if (!row) {
      return null;
    }

    return ProductModel.reconstitute(row);
  }

  /**
   * Finds all products with pagination
   *
   * Returns products sorted by creation date (newest first) by default.
   * Automatically excludes soft-deleted products.
   *
   * @param {Object} pagination - Pagination parameters
   * @param {number} pagination.page - Page number (1-based)
   * @param {number} pagination.limit - Records per page
   * @returns {Promise<{data: ProductModel[], total: number}>} Paginated results
   *
   * @example
   * ```typescript
   * const result = await repository.findAll({ page: 1, limit: 10 });
   * console.log(`Found ${result.total} products`);
   * result.data.forEach(product => {
   *   console.log(product.getName());
   * });
   * ```
   */
  async findAll(pagination: {
    page: number;
    limit: number;
  }): Promise<{
    data: ProductModel[];
    total: number;
  }> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = this.baseQuery();
    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count as string, 10);

    // Get paginated data
    const rows = await this.baseQuery()
      .orderBy(this.config.timestampColumns.created, 'desc')
      .limit(limit)
      .offset(offset);

    const data = rows.map((row: any) => ProductModel.reconstitute(row));

    return { data, total };
  }

  /**
   * Inserts a new product into the database
   *
   * @protected
   * @param {IProduct} entity - Product entity to insert
   * @returns {Promise<void>}
   */
  protected async insert(entity: IProduct): Promise<void> {
    await this.knex(this.tableName).insert(entity);
  }

  /**
   * Updates an existing product in the database
   *
   * Automatically updates the updated_at timestamp.
   *
   * @protected
   * @param {IProduct} entity - Product entity to update
   * @returns {Promise<void>}
   */
  protected async update(entity: IProduct): Promise<void> {
    await this.knex(this.tableName)
      .where(this.config.primaryKey, entity.id)
      .update({
        ...entity,
        [this.config.timestampColumns.updated]: new Date(),
      });
  }

  /**
   * Checks if a product exists by ID
   *
   * Checks for existence regardless of soft delete status.
   *
   * @protected
   * @param {string} id - Product ID
   * @returns {Promise<boolean>} True if product exists
   */
  protected async exists(id: string): Promise<boolean> {
    const row = await this.knex(this.tableName)
      .where(this.config.primaryKey, id)
      .first();
    return !!row;
  }

  /**
   * Soft deletes a product by setting deleted_at timestamp
   *
   * @protected
   * @param {string} id - Product ID
   * @returns {Promise<void>}
   */
  protected async softDelete(id: string): Promise<void> {
    await this.knex(this.tableName)
      .where(this.config.primaryKey, id)
      .update({
        [this.config.timestampColumns.deleted!]: new Date(),
      });
  }

  /**
   * Permanently deletes a product from the database
   *
   * @protected
   * @param {string} id - Product ID
   * @returns {Promise<void>}
   */
  protected async hardDelete(id: string): Promise<void> {
    await this.knex(this.tableName)
      .where(this.config.primaryKey, id)
      .delete();
  }

  // ============================================================================
  // CUSTOM QUERY METHODS - Product-specific queries
  // ============================================================================

  /**
   * Finds products by category
   *
   * Case-insensitive partial match on category field.
   *
   * @param {string} category - Category name or partial name
   * @returns {Promise<ProductModel[]>} Array of products in category
   *
   * @example
   * ```typescript
   * const electronics = await repository.findByCategory('electronics');
   * ```
   */
  async findByCategory(category: string): Promise<ProductModel[]> {
    const rows = await this.baseQuery()
      .whereRaw('LOWER(category) LIKE LOWER(?)', [`%${category}%`])
      .orderBy('name');

    return rows.map((row: any) => ProductModel.reconstitute(row));
  }

  /**
   * Finds products with low stock (below threshold)
   *
   * Returns products sorted by stock quantity (lowest first).
   *
   * @param {number} threshold - Stock threshold (default: 10)
   * @returns {Promise<ProductModel[]>} Products with low stock
   *
   * @example
   * ```typescript
   * const lowStock = await repository.findLowStock(5);
   * // Returns products with stock <= 5
   * ```
   */
  async findLowStock(threshold: number = 10): Promise<ProductModel[]> {
    const rows = await this.baseQuery()
      .where('stock_quantity', '<=', threshold)
      .orderBy('stock_quantity', 'asc');

    return rows.map((row: any) => ProductModel.reconstitute(row));
  }

  /**
   * Finds products with price in a range
   *
   * @param {number} minPrice - Minimum price (inclusive)
   * @param {number} maxPrice - Maximum price (inclusive)
   * @returns {Promise<ProductModel[]>} Products within price range
   *
   * @example
   * ```typescript
   * const midRange = await repository.findByPriceRange(100, 500);
   * ```
   */
  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
  ): Promise<ProductModel[]> {
    const rows = await this.baseQuery()
      .whereBetween('price', [minPrice, maxPrice])
      .orderBy('price', 'asc');

    return rows.map((row: any) => ProductModel.reconstitute(row));
  }

  /**
   * Finds products by name (partial match)
   *
   * Case-insensitive search on product name.
   *
   * @param {string} searchTerm - Search term
   * @returns {Promise<ProductModel[]>} Matching products
   *
   * @example
   * ```typescript
   * const iphones = await repository.searchByName('iphone');
   * ```
   */
  async searchByName(searchTerm: string): Promise<ProductModel[]> {
    const rows = await this.baseQuery()
      .whereRaw('LOWER(name) LIKE LOWER(?)', [`%${searchTerm}%`])
      .orderBy('name');

    return rows.map((row: any) => ProductModel.reconstitute(row));
  }

  /**
   * Finds all out-of-stock products
   *
   * @returns {Promise<ProductModel[]>} Products with zero stock
   *
   * @example
   * ```typescript
   * const outOfStock = await repository.findOutOfStock();
   * ```
   */
  async findOutOfStock(): Promise<ProductModel[]> {
    const rows = await this.baseQuery()
      .where('stock_quantity', 0)
      .orderBy('name');

    return rows.map((row: any) => ProductModel.reconstitute(row));
  }

  /**
   * Gets product statistics
   *
   * Returns aggregate statistics including total products, average price,
   * min/max prices, and total stock.
   *
   * @returns {Promise<ProductStats>} Product statistics
   *
   * @example
   * ```typescript
   * const stats = await repository.getProductStats();
   * console.log(`Average price: $${stats.average_price}`);
   * ```
   */
  async getProductStats(): Promise<{
    total_products: number;
    average_price: number;
    min_price: number;
    max_price: number;
    total_stock: number;
  }> {
    const stats = await this.baseQuery()
      .select([
        this.knex.raw('COUNT(*) as total_products'),
        this.knex.raw('AVG(price) as average_price'),
        this.knex.raw('MIN(price) as min_price'),
        this.knex.raw('MAX(price) as max_price'),
        this.knex.raw('SUM(stock_quantity) as total_stock'),
      ])
      .first();

    return {
      total_products: parseInt(stats.total_products, 10),
      average_price: parseFloat(stats.average_price) || 0,
      min_price: parseFloat(stats.min_price) || 0,
      max_price: parseFloat(stats.max_price) || 0,
      total_stock: parseInt(stats.total_stock, 10) || 0,
    };
  }

  /**
   * Gets product statistics grouped by category
   *
   * @returns {Promise<CategoryStats[]>} Statistics per category
   *
   * @example
   * ```typescript
   * const categoryStats = await repository.getCategoryStats();
   * categoryStats.forEach(stat => {
   *   console.log(`${stat.category}: ${stat.count} products`);
   * });
   * ```
   */
  async getCategoryStats(): Promise<
    Array<{
      category: string;
      count: number;
      avg_price: number;
      total_stock: number;
    }>
  > {
    const stats = await this.baseQuery()
      .select('category')
      .count('* as count')
      .avg('price as avg_price')
      .sum('stock_quantity as total_stock')
      .groupBy('category')
      .orderBy('count', 'desc');

    return stats.map((stat: any) => ({
      category: stat.category || 'Uncategorized',
      count: parseInt(stat.count as string, 10),
      avg_price: parseFloat(stat.avg_price as string) || 0,
      total_stock: parseInt(stat.total_stock as string, 10) || 0,
    }));
  }

  /**
   * Advanced search with multiple filters
   *
   * Supports filtering by name, description, category, price range, and stock status.
   *
   * @param {Object} filters - Search filters
   * @param {string} [filters.search] - Search term for name/description
   * @param {string} [filters.category] - Category filter
   * @param {number} [filters.minPrice] - Minimum price
   * @param {number} [filters.maxPrice] - Maximum price
   * @param {boolean} [filters.inStock] - Only in-stock products
   * @param {string} [filters.sortBy] - Sort field
   * @param {string} [filters.sortOrder] - Sort direction ('asc' | 'desc')
   * @returns {Promise<ProductModel[]>} Filtered products
   *
   * @example
   * ```typescript
   * const products = await repository.advancedSearch({
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
  async advancedSearch(filters: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ProductModel[]> {
    let query = this.baseQuery();

    // Full-text search on name and description
    if (filters.search) {
      query = query.where((builder) => {
        builder
          .whereRaw('LOWER(name) LIKE LOWER(?)', [`%${filters.search}%`])
          .orWhereRaw('LOWER(description) LIKE LOWER(?)', [
            `%${filters.search}%`,
          ]);
      });
    }

    // Category filter
    if (filters.category) {
      query = query.whereRaw('LOWER(category) LIKE LOWER(?)', [
        `%${filters.category}%`,
      ]);
    }

    // Price range filter
    if (filters.minPrice !== undefined) {
      query = query.where('price', '>=', filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.where('price', '<=', filters.maxPrice);
    }

    // In-stock filter
    if (filters.inStock) {
      query = query.where('stock_quantity', '>', 0);
    }

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    query = query.orderBy(sortBy, sortOrder);

    const rows = await query;
    return rows.map((row: any) => ProductModel.reconstitute(row));
  }

  /**
   * Finds products with associated files/images
   *
   * Joins with files table to get products that have images.
   *
   * @returns {Promise<ProductModel[]>} Products with images
   *
   * @example
   * ```typescript
   * const productsWithImages = await repository.findWithImages();
   * ```
   */
  async findWithImages(): Promise<ProductModel[]> {
    const rows = await this.baseQuery()
      .whereNotNull('file_id')
      .orderBy('created_at', 'desc');

    return rows.map((row: any) => ProductModel.reconstitute(row));
  }

  /**
   * Bulk updates stock quantities
   *
   * Updates multiple products' stock in a single transaction.
   *
   * @param {Array<{id: string, stock_quantity: number}>} updates - Stock updates
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * await repository.bulkUpdateStock([
   *   { id: 'uuid-1', stock_quantity: 50 },
   *   { id: 'uuid-2', stock_quantity: 25 },
   * ]);
   * ```
   */
  async bulkUpdateStock(
    updates: Array<{ id: string; stock_quantity: number }>,
  ): Promise<void> {
    const transaction = await this.knex.transaction();

    try {
      for (const update of updates) {
        await transaction(this.tableName)
          .where('id', update.id)
          .update({
            stock_quantity: update.stock_quantity,
            updated_at: new Date(),
          });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
