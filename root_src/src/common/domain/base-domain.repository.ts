import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { DatabaseService } from '../../database/database.service';
import { BaseDomainModel } from './base-domain.model';
import {
  DomainRepositoryConfig,
  DEFAULT_DOMAIN_REPOSITORY_CONFIG,
} from './domain-repository.config';
import {
  DomainNotFoundException,
  DomainErrorCodesDefault,
} from './exceptions';

/**
 * Base Domain Repository
 *
 * Abstract base class for all domain repositories implementing the Repository pattern.
 * This class provides common persistence operations (CRUD) while maintaining type safety
 * and enforcing best practices for data access.
 *
 * The repository pattern provides a clean separation between domain logic and data access,
 * making the code more maintainable, testable, and flexible.
 *
 * @abstract
 * @template TModel - The domain model type (extends BaseDomainModel)
 * @template TEntity - The entity/database record type
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class ProductRepository extends BaseDomainRepository<ProductModel, IProduct> {
 *   protected tableName = 'products';
 *
 *   constructor(databaseService: DatabaseService) {
 *     super(databaseService, {
 *       entityName: 'Product',
 *       tableName: 'products',
 *     });
 *   }
 *
 *   async findById(id: string): Promise<ProductModel | null> {
 *     const row = await this.baseQuery().where('id', id).first();
 *     if (!row) return null;
 *     return ProductModel.reconstitute(row);
 *   }
 *
 *   // ... implement other abstract methods
 * }
 * ```
 *
 * @version 1.0.0
 * @since 2025-10-03
 */
@Injectable()
export abstract class BaseDomainRepository<
  TModel extends BaseDomainModel<TEntity>,
  TEntity = any,
> {
  /**
   * Database table name for this repository
   *
   * Must be set by child classes to specify which table this repository manages.
   *
   * @protected
   * @abstract
   * @type {string}
   */
  protected abstract readonly tableName: string;

  /**
   * Repository configuration
   *
   * Merged configuration from defaults and constructor parameters.
   * Contains settings for timestamps, soft deletes, primary key, etc.
   *
   * @protected
   * @type {DomainRepositoryConfig}
   */
  protected config: DomainRepositoryConfig;

  /**
   * Knex query builder instance
   *
   * Provides access to the Knex.js query builder for database operations.
   * Retrieved from the DatabaseService.
   *
   * @protected
   * @readonly
   * @type {Knex}
   */
  protected get knex(): Knex {
    return this.databaseService.getKnex();
  }

  /**
   * Creates an instance of BaseDomainRepository
   *
   * @param {DatabaseService} databaseService - The database service for Knex access
   * @param {Partial<DomainRepositoryConfig>} config - Repository configuration
   *
   * @example
   * ```typescript
   * constructor(databaseService: DatabaseService) {
   *   super(databaseService, {
   *     entityName: 'Product',
   *     tableName: 'products',
   *     softDelete: true,
   *     descColumns: ['name', 'sku'],
   *   });
   * }
   * ```
   */
  constructor(
    protected readonly databaseService: DatabaseService,
    config: Partial<DomainRepositoryConfig>,
  ) {
    this.config = {
      ...DEFAULT_DOMAIN_REPOSITORY_CONFIG,
      ...config,
    } as DomainRepositoryConfig;
  }

  /**
   * Saves a domain model (insert or update)
   *
   * This method implements the upsert pattern - it automatically determines
   * whether to insert or update based on whether the record exists in the database.
   *
   * The model is converted to an entity using `toEntity()` before persistence.
   *
   * @param {TModel} model - The domain model to save
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * const product = ProductModel.create({ name: 'iPhone', price: 999 });
   * await repository.save(product); // Inserts new record
   *
   * product.updatePrice(899);
   * await repository.save(product); // Updates existing record
   * ```
   */
  async save(model: TModel): Promise<void> {
    const entity = model.toEntity();
    const exists = await this.exists((entity as any)[this.config.primaryKey]);

    if (exists) {
      await this.update(entity);
    } else {
      await this.insert(entity);
    }
  }

  /**
   * Finds a record by its primary key
   *
   * This method must be implemented by child classes to handle
   * the specific entity-to-model conversion logic.
   *
   * @abstract
   * @param {string | number} id - The primary key value
   * @returns {Promise<TModel | null>} The domain model or null if not found
   *
   * @example
   * ```typescript
   * async findById(id: string): Promise<ProductModel | null> {
   *   const row = await this.baseQuery().where('id', id).first();
   *   if (!row) return null;
   *   return ProductModel.reconstitute(row);
   * }
   * ```
   */
  abstract findById(id: string | number): Promise<TModel | null>;

  /**
   * Finds a record by ID and throws if not found
   *
   * Convenience method that wraps `findById()` and throws a DomainNotFoundException
   * if the record doesn't exist. Useful for operations that require the entity
   * to exist (update, delete, etc.).
   *
   * The exception is i18n-ready and will be translated by DomainExceptionFilter.
   *
   * @param {string | number} id - The primary key value
   * @returns {Promise<TModel>} The domain model (never null)
   * @throws {DomainNotFoundException} If the record is not found
   *
   * @example
   * ```typescript
   * // In service layer
   * async updateProduct(id: string, data: UpdateProductData) {
   *   const product = await this.repository.findByIdOrThrow(id); // Throws if not found
   *   product.update(data);
   *   await this.repository.save(product);
   *   return product.toEntity();
   * }
   * ```
   */
  async findByIdOrThrow(id: string | number): Promise<TModel> {
    const model = await this.findById(id);
    if (!model) {
      throw new DomainNotFoundException(
        DomainErrorCodesDefault.COMMON_NOT_FOUND_BY_ID,
        {
          entityName: this.config.entityName,
          id: String(id),
        },
      );
    }
    return model;
  }

  /**
   * Finds all records with pagination
   *
   * This method must be implemented by child classes to handle
   * pagination logic and entity-to-model conversion.
   *
   * @abstract
   * @param {object} pagination - Pagination parameters
   * @param {number} pagination.page - Page number (1-based)
   * @param {number} pagination.limit - Records per page
   * @returns {Promise<{data: TModel[], total: number}>} Paginated results and total count
   *
   * @example
   * ```typescript
   * async findAll(pagination: { page: number; limit: number }) {
   *   const { page = 1, limit = 10 } = pagination;
   *   const offset = (page - 1) * limit;
   *
   *   const [{ count }] = await this.baseQuery().count('* as count');
   *   const total = parseInt(count as string, 10);
   *
   *   const rows = await this.baseQuery()
   *     .orderBy('created_at', 'desc')
   *     .limit(limit)
   *     .offset(offset);
   *
   *   const data = rows.map(row => ProductModel.reconstitute(row));
   *   return { data, total };
   * }
   * ```
   */
  abstract findAll(pagination: { page: number; limit: number }): Promise<{
    data: TModel[];
    total: number;
  }>;

  /**
   * Deletes a record (soft or hard delete based on configuration)
   *
   * If soft delete is enabled in the configuration, this will set the
   * deleted timestamp. Otherwise, it will physically remove the record
   * from the database.
   *
   * @param {string | number} id - The primary key value
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * // With softDelete: true (default)
   * await repository.delete('uuid-123'); // Sets deleted_at timestamp
   *
   * // With softDelete: false
   * await repository.delete('uuid-123'); // Physically removes record
   * ```
   */
  async delete(id: string | number): Promise<void> {
    if (this.config.softDelete) {
      await this.softDelete(id);
    } else {
      await this.hardDelete(id);
    }
  }

  /**
   * Inserts a new entity into the database
   *
   * This protected method must be implemented by child classes to handle
   * the actual database insert operation.
   *
   * @protected
   * @abstract
   * @param {TEntity} entity - The entity to insert
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * protected async insert(entity: IProduct): Promise<void> {
   *   await this.knex(this.tableName).insert(entity);
   * }
   * ```
   */
  protected abstract insert(entity: TEntity): Promise<void>;

  /**
   * Updates an existing entity in the database
   *
   * This protected method must be implemented by child classes to handle
   * the actual database update operation. The updated_at timestamp should
   * be automatically set.
   *
   * @protected
   * @abstract
   * @param {TEntity} entity - The entity to update
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * protected async update(entity: IProduct): Promise<void> {
   *   await this.knex(this.tableName)
   *     .where(this.config.primaryKey, entity.id)
   *     .update({
   *       ...entity,
   *       [this.config.timestampColumns.updated]: new Date(),
   *     });
   * }
   * ```
   */
  protected abstract update(entity: TEntity): Promise<void>;

  /**
   * Checks if a record exists by primary key
   *
   * This protected method must be implemented by child classes to check
   * for record existence. Should return true if the record exists (including
   * soft-deleted records).
   *
   * @protected
   * @abstract
   * @param {string | number} id - The primary key value
   * @returns {Promise<boolean>} True if the record exists
   *
   * @example
   * ```typescript
   * protected async exists(id: string): Promise<boolean> {
   *   const row = await this.knex(this.tableName)
   *     .where(this.config.primaryKey, id)
   *     .first();
   *   return !!row;
   * }
   * ```
   */
  protected abstract exists(id: string | number): Promise<boolean>;

  /**
   * Soft deletes a record by setting the deleted timestamp
   *
   * This protected method must be implemented by child classes to handle
   * soft delete operations. Sets the deleted timestamp column to the current
   * date/time.
   *
   * @protected
   * @abstract
   * @param {string | number} id - The primary key value
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * protected async softDelete(id: string): Promise<void> {
   *   await this.knex(this.tableName)
   *     .where(this.config.primaryKey, id)
   *     .update({
   *       [this.config.timestampColumns.deleted]: new Date(),
   *     });
   * }
   * ```
   */
  protected abstract softDelete(id: string | number): Promise<void>;

  /**
   * Hard deletes a record from the database
   *
   * This protected method must be implemented by child classes to handle
   * hard delete operations. Physically removes the record from the database.
   *
   * @protected
   * @abstract
   * @param {string | number} id - The primary key value
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * protected async hardDelete(id: string): Promise<void> {
   *   await this.knex(this.tableName)
   *     .where(this.config.primaryKey, id)
   *     .delete();
   * }
   * ```
   */
  protected abstract hardDelete(id: string | number): Promise<void>;

  /**
   * Creates a base query builder with soft delete filtering
   *
   * Helper method that returns a Knex query builder for the table with
   * soft delete filtering automatically applied (if enabled in config).
   *
   * Use this as the starting point for all SELECT queries to ensure
   * soft-deleted records are excluded.
   *
   * @protected
   * @returns {Knex.QueryBuilder} Query builder with soft delete filter
   *
   * @example
   * ```typescript
   * // Simple query
   * const products = await this.baseQuery().where('category', 'electronics');
   *
   * // Complex query
   * const activeProducts = await this.baseQuery()
   *   .where('stock_quantity', '>', 0)
   *   .whereIn('category', ['electronics', 'computers'])
   *   .orderBy('price', 'desc');
   * ```
   */
  protected baseQuery(): Knex.QueryBuilder {
    let query = this.knex(this.tableName);

    // Apply soft delete filter if enabled
    if (this.config.softDelete && this.config.timestampColumns?.deleted) {
      query = query.whereNull(this.config.timestampColumns.deleted);
    }

    return query;
  }
}
