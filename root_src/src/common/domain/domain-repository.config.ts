/**
 * Domain Repository Configuration
 *
 * Configuration interface and defaults for domain repositories.
 * This provides a centralized, type-safe way to configure repository behavior
 * including soft deletes, timestamps, primary keys, and search columns.
 *
 * @module DomainRepositoryConfig
 * @version 1.0.0
 * @since 2025-10-03
 */

/**
 * Configuration interface for domain repositories
 *
 * Defines all configurable aspects of a repository including entity naming,
 * table mapping, timestamp handling, and soft delete behavior.
 *
 * @interface DomainRepositoryConfig
 *
 * @example
 * ```typescript
 * const productRepoConfig: DomainRepositoryConfig = {
 *   entityName: 'Product',
 *   tableName: 'products',
 *   primaryKey: 'id',
 *   timestampColumns: {
 *     created: 'created_at',
 *     updated: 'updated_at',
 *     deleted: 'deleted_at',
 *   },
 *   softDelete: true,
 *   descColumns: ['name', 'description'],
 * };
 * ```
 */
export interface DomainRepositoryConfig {
  /**
   * Human-readable entity name for error messages and logging
   *
   * This name is used in error messages like "Product with id X not found"
   *
   * @type {string}
   * @example 'Product', 'Order', 'User'
   */
  entityName: string;

  /**
   * Database table name
   *
   * The physical table name in the database where this entity is stored.
   * Should follow the database naming convention (typically snake_case).
   *
   * @type {string}
   * @example 'products', 'orders', 'users'
   */
  tableName: string;

  /**
   * Primary key column name
   *
   * The column name used as the primary key in the database table.
   *
   * @type {string}
   * @default 'id'
   * @example 'id', 'product_id', 'uuid'
   */
  primaryKey: string;

  /**
   * Timestamp column names configuration
   *
   * Defines the column names for automatic timestamp management.
   * All columns are optional and can be customized per repository.
   *
   * @type {object}
   * @property {string} created - Column name for creation timestamp
   * @property {string} updated - Column name for last update timestamp
   * @property {string} [deleted] - Optional column name for soft delete timestamp
   */
  timestampColumns: {
    /**
     * Creation timestamp column name
     * @default 'created_at'
     */
    created: string;

    /**
     * Update timestamp column name
     * @default 'updated_at'
     */
    updated: string;

    /**
     * Soft delete timestamp column name (optional)
     * If not provided, soft delete functionality will be disabled
     * @default 'deleted_at'
     */
    deleted?: string;
  };

  /**
   * Enable soft delete functionality
   *
   * When enabled, delete operations will set the deleted timestamp instead
   * of physically removing the record from the database. All queries will
   * automatically filter out soft-deleted records.
   *
   * @type {boolean}
   * @default true
   */
  softDelete: boolean;

  /**
   * Columns used for search/combo/description queries
   *
   * These columns are used when searching for records or displaying them
   * in dropdowns, autocomplete fields, etc. Typically includes descriptive
   * fields like name, title, or description.
   *
   * @type {string[]}
   * @default ['name']
   * @example ['name', 'description'], ['title', 'code']
   */
  descColumns: string[];
}

/**
 * Default configuration values for domain repositories
 *
 * These defaults provide sensible configuration for most use cases.
 * They can be overridden per repository by passing custom values
 * to the repository constructor.
 *
 * @constant
 * @type {Partial<DomainRepositoryConfig>}
 *
 * @example
 * ```typescript
 * // Using defaults
 * constructor(databaseService: DatabaseService) {
 *   super(databaseService, {
 *     entityName: 'Product',
 *     tableName: 'products',
 *     // Other values use defaults
 *   });
 * }
 *
 * // Overriding defaults
 * constructor(databaseService: DatabaseService) {
 *   super(databaseService, {
 *     entityName: 'Product',
 *     tableName: 'products',
 *     primaryKey: 'product_id', // Override default
 *     softDelete: false, // Override default
 *     descColumns: ['name', 'sku', 'description'], // Override default
 *   });
 * }
 * ```
 */
export const DEFAULT_DOMAIN_REPOSITORY_CONFIG: Partial<DomainRepositoryConfig> =
  {
    /**
     * Default primary key column name
     * Most tables use 'id' as the primary key
     */
    primaryKey: 'id',

    /**
     * Default timestamp column names
     * Follows common convention: created_at, updated_at, deleted_at
     */
    timestampColumns: {
      created: 'created_at',
      updated: 'updated_at',
      deleted: 'deleted_at',
    },

    /**
     * Soft delete enabled by default
     * Provides data safety and audit trail
     */
    softDelete: true,

    /**
     * Default description columns
     * Most entities have a 'name' field for display
     */
    descColumns: ['name'],
  };
