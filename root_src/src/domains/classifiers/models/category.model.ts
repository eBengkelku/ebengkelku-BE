import {
  BaseDomainModel,
  DomainValidationException,
} from '../../../common/domain';
import { CategoryErrorCodes } from '../constants';
import { ICategory } from '../interfaces/category.interface';

/**
 * Category Domain Model
 *
 * Rich domain model that encapsulates all business logic, validation rules,
 * and state management for categories. This model ensures that categories can
 * never be in an invalid state.
 *
 * Business Rules:
 * - Name is required and cannot be empty
 * - Slug must be lowercase and without spaces (validated format)
 * - Slug is auto-generated from name if not provided
 * - Name and slug must be unique (enforced at database level)
 *
 * @class CategoryModel
 * @extends {BaseDomainModel<ICategory>}
 * @version 1.0.0
 * @since 2025-01-13
 *
 * @example
 * ```typescript
 * // Creating a new category
 * const category = CategoryModel.create({
 *   id: uuidv4(),
 *   name: 'Electronics',
 *   description: 'Electronic items and gadgets',
 * });
 *
 * // Business operations
 * category.updateDetails('New Name', 'New description');
 * category.changeSlug('new-slug');
 * ```
 */
export class CategoryModel extends BaseDomainModel<ICategory> {
  /**
   * Private constructor prevents direct instantiation.
   * Use static factory methods (create, reconstitute) instead.
   *
   * @private
   * @param {string} id - Unique category identifier
   * @param {string} name - Category name
   * @param {string} slug - URL-friendly slug
   * @param {string} [description] - Optional category description
   * @param {Date} createdAt - Creation timestamp
   * @param {Date} updatedAt - Last update timestamp
   * @param {Date | null} deletedAt - Soft delete timestamp
   */
  private constructor(
    private id: string,
    private name: string,
    private slug: string,
    private description?: string,
    private createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
    private deletedAt: Date | null = null,
  ) {
    super();
  }

  /**
   * Generates a slug from a name
   * Converts to lowercase, replaces spaces with hyphens, removes special characters
   *
   * @private
   * @param {string} name - Name to convert to slug
   * @returns {string} Generated slug
   */
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, '') // Remove special characters
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Validates slug format
   *
   * @private
   * @param {string} slug - Slug to validate
   * @returns {boolean} True if slug is valid
   */
  private static isValidSlug(slug: string): boolean {
    // Slug must be lowercase, alphanumeric with hyphens, no spaces
    return /^[a-z0-9-]+$/.test(slug) && slug.length > 0;
  }

  /**
   * Factory method for creating new category instances
   *
   * This method validates all business rules before creating a category.
   * Use this when creating a brand new category (not from database).
   *
   * @static
   * @param {Object} data - Category creation data
   * @param {string} data.id - Unique identifier (typically UUID)
   * @param {string} data.name - Category name
   * @param {string} [data.description] - Optional description
   * @param {string} [data.slug] - Optional slug (auto-generated if not provided)
   * @returns {CategoryModel} New category instance
   * @throws {DomainValidationException} If validation fails
   *
   * @example
   * ```typescript
   * const category = CategoryModel.create({
   *   id: uuidv4(),
   *   name: 'Electronics',
   *   description: 'Electronic items',
   * });
   * ```
   */
  static create(data: {
    id: string;
    name: string;
    description?: string;
    slug?: string;
  }): CategoryModel {
    // Business Rule: Name is required and cannot be empty
    if (!data.name || data.name.trim().length === 0) {
      throw new DomainValidationException(
        CategoryErrorCodes.CATEGORY_VALIDATION_NAME_REQUIRED,
        { name: data.name },
      );
    }

    // Generate slug from name if not provided
    let slug = data.slug || CategoryModel.generateSlug(data.name);

    // Validate slug format
    if (!CategoryModel.isValidSlug(slug)) {
      throw new DomainValidationException(
        CategoryErrorCodes.CATEGORY_VALIDATION_SLUG_INVALID,
        { slug },
      );
    }

    const now = new Date();
    return new CategoryModel(
      data.id,
      data.name.trim(),
      slug,
      data.description?.trim(),
      now,
      now,
      null,
    );
  }

  /**
   * Factory method for reconstituting categories from database
   *
   * This method recreates a category instance from database records.
   * No validation is performed since data is already validated and stored.
   *
   * @static
   * @param {ICategory} data - Category entity from database
   * @returns {CategoryModel} Reconstituted category instance
   *
   * @example
   * ```typescript
   * const row = await knex('categories').where('id', id).first();
   * const category = CategoryModel.reconstitute(row);
   * ```
   */
  static reconstitute(data: ICategory): CategoryModel {
    return new CategoryModel(
      data.id,
      data.name,
      data.slug,
      data.description,
      data.created_at,
      data.updated_at,
      data.deleted_at || null,
    );
  }

  // ============================================================================
  // BUSINESS METHODS - State-changing operations
  // ============================================================================

  /**
   * Updates category details (name and/or description)
   *
   * If name is updated, slug is automatically regenerated.
   * Validates all business rules before applying changes.
   *
   * @param {string} [name] - New name
   * @param {string} [description] - New description
   * @returns {void}
   * @throws {DomainValidationException} If validation fails
   *
   * @example
   * ```typescript
   * category.updateDetails('New Category Name', 'New description');
   * ```
   */
  updateDetails(name?: string, description?: string): void {
    // Validate and update name
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        throw new DomainValidationException(
          CategoryErrorCodes.CATEGORY_VALIDATION_NAME_REQUIRED,
          { name },
        );
      }
      this.name = name.trim();
      // Auto-regenerate slug when name changes
      this.slug = CategoryModel.generateSlug(this.name);
    }

    // Update description
    if (description !== undefined) {
      this.description = description?.trim();
    }

    // Update timestamp
    this.updatedAt = new Date();
  }

  /**
   * Changes the category slug
   *
   * Validates slug format before applying change.
   *
   * @param {string} newSlug - New slug value
   * @returns {void}
   * @throws {DomainValidationException} If slug format is invalid
   *
   * @example
   * ```typescript
   * category.changeSlug('new-category-slug');
   * ```
   */
  changeSlug(newSlug: string): void {
    if (!CategoryModel.isValidSlug(newSlug)) {
      throw new DomainValidationException(
        CategoryErrorCodes.CATEGORY_VALIDATION_SLUG_INVALID,
        { slug: newSlug },
      );
    }

    this.slug = newSlug;
    this.updatedAt = new Date();
  }

  // ============================================================================
  // CONVERSION & GETTERS
  // ============================================================================

  /**
   * Converts the domain model to an entity (database/API format)
   *
   * Transforms the camelCase domain model properties to snake_case
   * database columns.
   *
   * @returns {ICategory} Entity representation for database/API
   *
   * @example
   * ```typescript
   * const entity = category.toEntity();
   * await knex('categories').insert(entity);
   * ```
   */
  toEntity(): ICategory {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      description: this.description,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      deleted_at: this.deletedAt || undefined,
    };
  }

  // Getters for read-only access to properties

  /**
   * Gets the category ID
   * @returns {string} Category identifier
   */
  getId(): string {
    return this.id;
  }

  /**
   * Gets the category name
   * @returns {string} Category name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Gets the category slug
   * @returns {string} Category slug
   */
  getSlug(): string {
    return this.slug;
  }

  /**
   * Gets the category description
   * @returns {string | undefined} Category description
   */
  getDescription(): string | undefined {
    return this.description;
  }

  /**
   * Gets the creation timestamp
   * @returns {Date} Creation date
   */
  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Gets the last update timestamp
   * @returns {Date} Last update date
   */
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * Gets the deletion timestamp (if soft deleted)
   * @returns {Date | null} Deletion date or null
   */
  getDeletedAt(): Date | null {
    return this.deletedAt;
  }
}
