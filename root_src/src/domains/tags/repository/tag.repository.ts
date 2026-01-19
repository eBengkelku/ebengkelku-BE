import { Injectable } from '@nestjs/common';
import { BaseDomainRepository } from '../../../common/domain/base-domain.repository';
import { DatabaseService } from '../../../database/database.service';
import { TagModel } from '../models/tag.model';
import { ITag } from '../interfaces/tag.interface';
import { DomainConflictException } from '../../../common/domain/exceptions/domain.exception';
import { TagErrorCodes } from '../constants/tag-error-codes';

/**
 * Tag Repository
 *
 * Repository for managing tag persistence and data access.
 * Implements the repository pattern to provide a clean abstraction between
 * the domain layer and data access layer.
 *
 * This repository extends BaseDomainRepository to inherit common CRUD operations
 * while adding tag-specific queries and data access methods.
 *
 * @class TagRepository
 * @extends {BaseDomainRepository<TagModel, ITag>}
 * @version 1.0.0
 * @since 2025-01-13
 *
 * @example
 * ```typescript
 * // In a service
 * constructor(private readonly tagRepository: TagRepository) {}
 *
 * async createTag(data: CreateTagDto) {
 *   const tag = TagModel.create({ id: uuidv4(), ...data });
 *   await this.tagRepository.save(tag);
 *   return tag.toEntity();
 * }
 *
 * async getTag(id: string) {
 *   const tag = await this.tagRepository.findByIdOrThrow(id);
 *   return tag.toEntity();
 * }
 * ```
 */
@Injectable()
export class TagRepository extends BaseDomainRepository<TagModel, ITag> {
  /**
   * Database table name for tags
   * @protected
   * @readonly
   */
  protected tableName = 'tags';

  /**
   * Creates an instance of TagRepository
   *
   * @param {DatabaseService} databaseService - Database service for Knex access
   */
  constructor(databaseService: DatabaseService) {
    super(databaseService, {
      entityName: 'Tag',
      tableName: 'tags',
      primaryKey: 'id',
      timestampColumns: {
        created: 'created_at',
        updated: 'updated_at',
        deleted: 'deleted_at',
      },
      softDelete: true,
      descColumns: ['name'],
    });
  }

  // ============================================================================
  // REQUIRED ABSTRACT METHOD IMPLEMENTATIONS
  // ============================================================================

  /**
   * Finds a tag by ID
   *
   * Returns null if the tag doesn't exist or is soft-deleted.
   *
   * @param {string} id - Tag ID (UUID)
   * @returns {Promise<TagModel | null>} Tag model or null
   */
  async findById(id: string | number): Promise<TagModel | null> {
    const row = await this.baseQuery().where('id', id).first();

    if (!row) {
      return null;
    }

    return TagModel.reconstitute(row);
  }

  /**
   * Finds all tags with pagination
   *
   * Returns tags sorted by creation date (newest first) by default.
   * Automatically excludes soft-deleted tags.
   *
   * @param {Object} pagination - Pagination parameters
   * @param {number} pagination.page - Page number (1-based)
   * @param {number} pagination.limit - Records per page
   * @returns {Promise<{data: TagModel[], total: number}>} Paginated results
   */
  async findAll(pagination: {
    page: number;
    limit: number;
  }): Promise<{
    data: TagModel[];
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

    const data = rows.map((row: any) => TagModel.reconstitute(row));

    return { data, total };
  }

  /**
   * Inserts a new tag into the database
   *
   * Handles unique constraint violations and converts them to domain exceptions.
   *
   * @protected
   * @param {ITag} entity - Tag entity to insert
   * @returns {Promise<void>}
   * @throws {DomainConflictException} If unique constraint violation occurs
   */
  protected async insert(entity: ITag): Promise<void> {
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
   * Updates an existing tag in the database
   *
   * Automatically updates the updated_at timestamp.
   * Handles unique constraint violations and converts them to domain exceptions.
   *
   * @protected
   * @param {ITag} entity - Tag entity to update
   * @returns {Promise<void>}
   * @throws {DomainConflictException} If unique constraint violation occurs
   */
  protected async update(entity: ITag): Promise<void> {
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
   * Checks if a tag exists by ID
   *
   * Checks for existence regardless of soft delete status.
   *
   * @protected
   * @param {string} id - Tag ID
   * @returns {Promise<boolean>} True if tag exists
   */
  protected async exists(id: string | number): Promise<boolean> {
    const row = await this.knex(this.tableName)
      .where(this.config.primaryKey, id)
      .first();
    return !!row;
  }

  /**
   * Soft deletes a tag by setting deleted_at timestamp
   *
   * @protected
   * @param {string} id - Tag ID
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
   * Permanently deletes a tag from the database
   *
   * @protected
   * @param {string} id - Tag ID
   * @returns {Promise<void>}
   */
  protected async hardDelete(id: string | number): Promise<void> {
    await this.knex(this.tableName)
      .where(this.config.primaryKey, id)
      .delete();
  }

  /**
   * Handles unique constraint violation errors
   *
   * Parses the database error message to determine which field
   * caused the violation and throws an appropriate domain exception.
   * For tags, only name has unique constraint.
   *
   * @private
   * @param {any} error - Database error object
   * @param {ITag} entity - Tag entity that caused the violation
   * @throws {DomainConflictException} Always throws a domain exception
   */
  private handleUniqueConstraintError(error: any, entity: ITag): void {
    const errorMessage = error.message || '';
    const constraintName = error.constraint || '';

    // Tag only has unique constraint on name
    if (
      constraintName.includes('name') ||
      errorMessage.includes('tags_name_unique') ||
      errorMessage.includes('name')
    ) {
      throw new DomainConflictException(
        TagErrorCodes.TAG_NAME_EXISTS,
        { name: entity.name },
      );
    } else {
      // Default to name error if we can't determine the field
      throw new DomainConflictException(
        TagErrorCodes.TAG_NAME_EXISTS,
        { name: entity.name },
      );
    }
  }
}
