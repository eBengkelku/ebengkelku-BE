/**
 * Category Entity Interface
 *
 * Defines the database schema structure for the categories table.
 * This interface represents the data structure as stored in the database,
 * using snake_case naming convention.
 *
 * @interface ICategory
 * @version 1.0.0
 * @since 2025-01-13
 *
 * @example
 * ```typescript
 * const category: ICategory = {
 *   id: 'uuid-123',
 *   name: 'Electronics',
 *   slug: 'electronics',
 *   description: 'Electronic items and gadgets',
 *   created_at: new Date(),
 *   updated_at: new Date(),
 *   deleted_at: undefined,
 * };
 * ```
 */
export interface ICategory {
  /**
   * Unique category identifier (UUID)
   * @type {string}
   */
  id: string;

  /**
   * Category name (unique)
   * @type {string}
   */
  name: string;

  /**
   * URL-friendly slug (unique, lowercase, no spaces)
   * @type {string}
   */
  slug: string;

  /**
   * Category description (optional)
   * @type {string | undefined}
   */
  description?: string;

  /**
   * Record creation timestamp
   * @type {Date}
   */
  created_at: Date;

  /**
   * Record last update timestamp
   * @type {Date}
   */
  updated_at: Date;

  /**
   * Soft delete timestamp (null if not deleted)
   * @type {Date | undefined}
   */
  deleted_at?: Date;
}
