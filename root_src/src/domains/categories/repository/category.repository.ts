import { Injectable } from '@nestjs/common';
import { BaseDomainRepository } from '../../../common/domain/base-domain.repository';
import { DatabaseService } from '../../../database/database.service';
import { CategoryModel } from '../models/category.model';
import { ICategory } from '../interfaces/category.interface';
import {
  DomainConflictException,
  DomainNotFoundException,
  DomainErrorCodesDefault,
} from '../../../common/domain/exceptions';
import { CategoryErrorCodes } from '../constants/category-error-codes';

/**
 * Category Repository
 *
 * Repository for managing category persistence and data access.
 * Implements the repository pattern to provide a clean abstraction between
 * the domain layer and data access layer.
 *
 * This repository extends BaseDomainRepository to inherit common CRUD operations
 * while adding category-specific queries and data access methods.
 *
 * @class CategoryRepository
 * @extends {BaseDomainRepository<CategoryModel, ICategory>}
 * @version 1.0.0
 * @since 2025-01-13
 *
 * @example
 * ```typescript
 * // In a service
 * constructor(private readonly categoryRepository: CategoryRepository) {}
 *
 * async createCategory(data: CreateCategoryDto) {
 *   const category = CategoryModel.create({ id: uuidv4(), ...data });
 *   await this.categoryRepository.save(category);
 *   return category.toEntity();
 * }
 *
 * async getCategory(id: string) {
 *   const category = await this.categoryRepository.findByIdOrThrow(id);
 *   return category.toEntity();
 * }
 * ```
 */
@Injectable()
export class CategoryRepository extends BaseDomainRepository<
  CategoryModel,
  ICategory
> {
  /**
   * Database table name for categories
   * @protected
   * @readonly
   */
  protected tableName = 'categories';

  /**
   * Creates an instance of CategoryRepository
   *
   * @param {DatabaseService} databaseService - Database service for Knex access
   */
  constructor(databaseService: DatabaseService) {
    super(databaseService, {
      entityName: 'Category',
      tableName: 'categories',
      primaryKey: 'id',
      timestampColumns: {
        created: 'created_at',
        updated: 'updated_at',
        deleted: 'deleted_at',
      },
      softDelete: true,
      descColumns: ['name', 'slug'],
    });
  }

  // ============================================================================
  // REQUIRED ABSTRACT METHOD IMPLEMENTATIONS
  // ============================================================================

  /**
   * Finds a category by ID
   *
   * Returns null if the category doesn't exist or is soft-deleted.
   *
   * @param {string} id - Category ID (UUID)
   * @returns {Promise<CategoryModel | null>} Category model or null
   */
  async findById(id: string | number): Promise<CategoryModel | null> {
    const row = await this.baseQuery().where('id', id).first();

    if (!row) {
      return null;
    }

    return CategoryModel.reconstitute(row);
  }

  /**
   * Finds all categories with pagination
   *
   * Returns categories sorted by creation date (newest first) by default.
   * Automatically excludes soft-deleted categories.
   *
   * @param {Object} pagination - Pagination parameters
   * @param {number} pagination.page - Page number (1-based)
   * @param {number} pagination.limit - Records per page
   * @returns {Promise<{data: CategoryModel[], total: number}>} Paginated results
   */
  async findAll(pagination: {
    page: number;
    limit: number;
  }): Promise<{
    data: CategoryModel[];
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

    const data = rows.map((row: any) => CategoryModel.reconstitute(row));

    return { data, total };
  }

  /**
   * Inserts a new category into the database
   *
   * Handles unique constraint violations and converts them to domain exceptions.
   *
   * @protected
   * @param {ICategory} entity - Category entity to insert
   * @returns {Promise<void>}
   * @throws {DomainConflictException} If unique constraint violation occurs
   */
  protected async insert(entity: ICategory): Promise<void> {
    try {
      await this.knex(this.tableName).insert(entity);
    } catch (error: any) {
      // Handle PostgreSQL unique constraint violation (error code 23505)
      if (error.code === '23505') {
        this.handleUniqueConstraintError(error, entity);
      }
      throw error;
    }
  }

  /**
   * Updates an existing category in the database
   *
   * Automatically updates the updated_at timestamp.
   * Handles unique constraint violations and converts them to domain exceptions.
   *
   * @protected
   * @param {ICategory} entity - Category entity to update
   * @returns {Promise<void>}
   * @throws {DomainConflictException} If unique constraint violation occurs
   */
  protected async update(entity: ICategory): Promise<void> {
    try {
      await this.knex(this.tableName)
        .where(this.config.primaryKey, entity.id)
        .update({
          ...entity,
          [this.config.timestampColumns.updated]: new Date(),
        });
    } catch (error: any) {
      // Handle PostgreSQL unique constraint violation (error code 23505)
      if (error.code === '23505') {
        this.handleUniqueConstraintError(error, entity);
      }
      throw error;
    }
  }

  /**
   * Checks if a category exists by ID
   *
   * Checks for existence regardless of soft delete status.
   *
   * @protected
   * @param {string} id - Category ID
   * @returns {Promise<boolean>} True if category exists
   */
  protected async exists(id: string | number): Promise<boolean> {
    const row = await this.knex(this.tableName)
      .where(this.config.primaryKey, id)
      .first();
    return !!row;
  }

  /**
   * Soft deletes a category by setting deleted_at timestamp
   *
   * @protected
   * @param {string} id - Category ID
   * @returns {Promise<void>}
   */
  protected async softDelete(id: string | number): Promise<void> {
    await this.knex(this.tableName)
      .where(this.config.primaryKey, id)
      .update({
        [this.config.timestampColumns.deleted!]: new Date(),
      });
  }

  /**
   * Permanently deletes a category from the database
   *
   * @protected
   * @param {string} id - Category ID
   * @returns {Promise<void>}
   */
  protected async hardDelete(id: string | number): Promise<void> {
    await this.knex(this.tableName)
      .where(this.config.primaryKey, id)
      .delete();
  }

  /**
   * Deletes a category by ID and returns affected rows count
   * Optimized version that performs delete and returns affected rows for validation
   *
   * @param {string | number} id - Category ID
   * @returns {Promise<number>} Number of affected rows (0 if not found or already deleted)
   */
  async deleteById(id: string | number): Promise<number> {
    if (this.config.softDelete) {
      return await this.knex(this.tableName)
        .where(this.config.primaryKey, id)
        .whereNull(this.config.timestampColumns.deleted!) // Only delete if not already deleted
        .update({
          [this.config.timestampColumns.deleted!]: new Date(),
        });
    } else {
      return await this.knex(this.tableName)
        .where(this.config.primaryKey, id)
        .delete();
    }
  }

  /**
   * Handles unique constraint violation errors
   *
   * Parses the database error message to determine which field
   * caused the violation and throws an appropriate domain exception.
   *
   * @private
   * @param {any} error - Database error object
   * @param {ICategory} entity - Category entity that caused the violation
   * @throws {DomainConflictException} Always throws a domain exception
   */
  private handleUniqueConstraintError(error: any, entity: ICategory): void {
    const errorMessage = error.message || '';
    const constraintName = error.constraint || '';

    // Determine which field caused the violation based on constraint name or error message
    if (
      constraintName.includes('slug') ||
      errorMessage.includes('categories_slug_unique') ||
      errorMessage.includes('slug')
    ) {
      throw new DomainConflictException(
        CategoryErrorCodes.CATEGORY_SLUG_EXISTS,
        { slug: entity.slug },
      );
    } else if (
      constraintName.includes('name') ||
      errorMessage.includes('categories_name_unique') ||
      errorMessage.includes('name')
    ) {
      throw new DomainConflictException(
        CategoryErrorCodes.CATEGORY_NAME_EXISTS,
        { name: entity.name },
      );
    } else {
      // Generic conflict error if we can't determine the field
      throw new DomainConflictException(
        CategoryErrorCodes.CATEGORY_SLUG_EXISTS, // Default to slug as it's more common
        { slug: entity.slug },
      );
    }
  }
}
