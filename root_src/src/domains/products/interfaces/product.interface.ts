/**
 * Product Entity Interface
 *
 * Defines the database schema structure for the products table.
 * This interface represents the data structure as stored in the database,
 * using snake_case naming convention.
 *
 * @interface IProduct
 * @version 1.0.0
 * @since 2025-10-03
 *
 * @example
 * ```typescript
 * const product: IProduct = {
 *   id: 'uuid-123',
 *   name: 'iPhone 15 Pro',
 *   description: 'Latest iPhone model',
 *   price: 999.99,
 *   stock_quantity: 50,
 *   category: 'Electronics',
 *   file_id: 'file-uuid',
 *   created_at: new Date(),
 *   updated_at: new Date(),
 *   deleted_at: null,
 *   created_by: 'user-uuid',
 *   updated_by: 'user-uuid',
 * };
 * ```
 */
export interface IProduct {
  /**
   * Unique product identifier (UUID)
   * @type {string}
   */
  id: string;

  /**
   * Product name
   * @type {string}
   */
  name: string;

  /**
   * Product description (optional)
   * @type {string | undefined}
   */
  description?: string;

  /**
   * Product price in currency units
   * Must be non-negative
   * @type {number}
   */
  price: number;

  /**
   * Available stock quantity
   * Must be non-negative
   * @type {number}
   */
  stock_quantity: number;

  /**
   * Product category (optional, legacy field)
   * @type {string | undefined}
   * @deprecated Use category_id instead
   */
  category?: string;

  /**
   * Category ID (UUID, optional)
   * References the categories table
   * @type {string | undefined}
   */
  category_id?: string;

  /**
   * Associated file/image ID (UUID, optional)
   * References the files table
   * @type {string | undefined}
   */
  file_id?: string;

  /**
   * Product tags (loaded via relation, not stored in products table)
   * @type {Array<{id: string; name: string; color: string}> | undefined}
   */
  tags?: Array<{ id: string; name: string; color: string }>;

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

  /**
   * User who created the record (UUID, optional)
   * @type {string | undefined}
   */
  created_by?: string;

  /**
   * User who last updated the record (UUID, optional)
   * @type {string | undefined}
   */
  updated_by?: string;
}
