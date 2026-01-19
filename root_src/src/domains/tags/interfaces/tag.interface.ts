/**
 * Tag Entity Interface
 *
 * Defines the database schema structure for the tags table.
 * This interface represents the data structure as stored in the database,
 * using snake_case naming convention.
 *
 * @interface ITag
 * @version 1.0.0
 * @since 2025-01-13
 *
 * @example
 * ```typescript
 * const tag: ITag = {
 *   id: 'uuid-123',
 *   name: 'Hot Item',
 *   color: '#FF0000',
 *   created_at: new Date(),
 *   updated_at: new Date(),
 *   deleted_at: undefined,
 * };
 * ```
 */
export interface ITag {
  /**
   * Unique tag identifier (UUID)
   * @type {string}
   */
  id: string;

  /**
   * Tag name (unique, max 20 characters)
   * @type {string}
   */
  name: string;

  /**
   * Hex color code (e.g., #FF0000)
   * @type {string}
   */
  color: string;

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
   * @type {Date | null | undefined}
   */
  deleted_at?: Date | null;
}
