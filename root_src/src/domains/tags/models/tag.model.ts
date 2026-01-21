import {
  BaseDomainModel,
  DomainValidationException,
} from '../../../common/domain';
import { TagErrorCodes } from '../constants/tag-error-codes';
import { ITag } from '../interfaces/tag.interface';

/**
 * Tag Domain Model
 *
 * Rich domain model that encapsulates all business logic, validation rules,
 * and state management for tags. This model ensures that tags can
 * never be in an invalid state.
 *
 * Business Rules:
 * - Name is required and cannot exceed 20 characters
 * - Color must be a valid hex color code format (#RRGGBB)
 * - Name must be unique (enforced at database level)
 *
 * @class TagModel
 * @extends {BaseDomainModel<ITag>}
 * @version 1.0.0
 * @since 2025-01-13
 *
 * @example
 * ```typescript
 * // Creating a new tag
 * const tag = TagModel.create({
 *   id: uuidv4(),
 *   name: 'Hot Item',
 *   color: '#FF0000',
 * });
 *
 * // Business operations
 * tag.updateColor('#00FF00');
 * tag.renameWithValidation('New Tag');
 * ```
 */
export class TagModel extends BaseDomainModel<ITag> {
  /**
   * Private constructor prevents direct instantiation.
   * Use static factory methods (create, reconstitute) instead.
   *
   * @private
   * @param {string} id - Unique tag identifier
   * @param {string} name - Tag name (max 20 characters)
   * @param {string} color - Hex color code
   * @param {Date} createdAt - Creation timestamp
   * @param {Date} updatedAt - Last update timestamp
   * @param {Date | null} deletedAt - Soft delete timestamp
   */
  private constructor(
    private id: string,
    private name: string,
    private color: string,
    private createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
    private deletedAt: Date | null = null,
  ) {
    super();
  }

  /**
   * Validates hex color format
   *
   * @private
   * @param {string} color - Color to validate
   * @returns {boolean} True if color is valid hex format
   */
  private static isValidHexColor(color: string): boolean {
    // Hex color format: #RRGGBB or #RGB (3 or 6 hex digits)
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  /**
   * Factory method for creating new tag instances
   *
   * This method validates all business rules before creating a tag.
   * Use this when creating a brand new tag (not from database).
   *
   * @static
   * @param {Object} data - Tag creation data
   * @param {string} data.id - Unique identifier (typically UUID)
   * @param {string} data.name - Tag name (max 20 characters)
   * @param {string} data.color - Hex color code (e.g., #FF0000)
   * @returns {TagModel} New tag instance
   * @throws {DomainValidationException} If validation fails
   *
   * @example
   * ```typescript
   * const tag = TagModel.create({
   *   id: uuidv4(),
   *   name: 'Promo',
   *   color: '#00FF00',
   * });
   * ```
   */
  static create(data: {
    id: string;
    name: string;
    color: string;
  }): TagModel {
    // Business Rule: Name is required
    if (!data.name || data.name.trim().length === 0) {
      throw new DomainValidationException(
        TagErrorCodes.TAG_VALIDATION_NAME_REQUIRED,
        { name: data.name },
      );
    }

    // Business Rule: Name cannot exceed 20 characters
    if (data.name.trim().length > 20) {
      throw new DomainValidationException(
        TagErrorCodes.TAG_VALIDATION_NAME_TOO_LONG,
        { name: data.name, maxLength: 20 },
      );
    }

    // Business Rule: Color must be valid hex format
    if (!TagModel.isValidHexColor(data.color)) {
      throw new DomainValidationException(
        TagErrorCodes.TAG_VALIDATION_COLOR_INVALID,
        { color: data.color },
      );
    }

    const now = new Date();
    return new TagModel(
      data.id,
      data.name.trim(),
      data.color.toUpperCase(), // Normalize to uppercase
      now,
      now,
      null,
    );
  }

  /**
   * Factory method for reconstituting tags from database
   *
   * This method recreates a tag instance from database records.
   * No validation is performed since data is already validated and stored.
   *
   * @static
   * @param {ITag} data - Tag entity from database
   * @returns {TagModel} Reconstituted tag instance
   *
   * @example
   * ```typescript
   * const row = await knex('tags').where('id', id).first();
   * const tag = TagModel.reconstitute(row);
   * ```
   */
  static reconstitute(data: ITag): TagModel {
    return new TagModel(
      data.id,
      data.name,
      data.color,
      data.created_at,
      data.updated_at,
      data.deleted_at || null,
    );
  }

  // ============================================================================
  // BUSINESS METHODS - State-changing operations
  // ============================================================================

  /**
   * Updates the tag color
   *
   * Validates hex color format before applying change.
   *
   * @param {string} newColor - New hex color code
   * @returns {void}
   * @throws {DomainValidationException} If color format is invalid
   *
   * @example
   * ```typescript
   * tag.updateColor('#0000FF');
   * ```
   */
  updateColor(newColor: string): void {
    if (!TagModel.isValidHexColor(newColor)) {
      throw new DomainValidationException(
        TagErrorCodes.TAG_VALIDATION_COLOR_INVALID,
        { color: newColor },
      );
    }

    this.color = newColor.toUpperCase(); // Normalize to uppercase
    this.updatedAt = new Date();
  }

  /**
   * Renames the tag with validation
   *
   * Validates name length before applying change.
   *
   * @param {string} newName - New tag name
   * @returns {void}
   * @throws {DomainValidationException} If name is invalid
   *
   * @example
   * ```typescript
   * tag.renameWithValidation('New Tag Name');
   * ```
   */
  renameWithValidation(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new DomainValidationException(
        TagErrorCodes.TAG_VALIDATION_NAME_REQUIRED,
        { name: newName },
      );
    }

    if (newName.trim().length > 20) {
      throw new DomainValidationException(
        TagErrorCodes.TAG_VALIDATION_NAME_TOO_LONG,
        { name: newName, maxLength: 20 },
      );
    }

    this.name = newName.trim();
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
   * @returns {ITag} Entity representation for database/API
   *
   * @example
   * ```typescript
   * const entity = tag.toEntity();
   * await knex('tags').insert(entity);
   * ```
   */
  toEntity(): ITag {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      deleted_at: this.deletedAt || undefined,
    };
  }

  // Getters for read-only access to properties

  /**
   * Gets the tag ID
   * @returns {string} Tag identifier
   */
  getId(): string {
    return this.id;
  }

  /**
   * Gets the tag name
   * @returns {string} Tag name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Gets the tag color
   * @returns {string} Hex color code
   */
  getColor(): string {
    return this.color;
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
