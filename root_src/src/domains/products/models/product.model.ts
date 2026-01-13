import {
  BaseDomainModel,
  DomainValidationException,
} from '../../../common/domain';
import { ProductErrorCodes } from '../constants';
import { IProduct } from '../interfaces/product.interface';

/**
 * Product Domain Model
 *
 * Rich domain model that encapsulates all business logic, validation rules,
 * and state management for products. This model ensures that products can
 * never be in an invalid state.
 *
 * Business Rules:
 * - Price must be non-negative
 * - Stock quantity must be non-negative
 * - Name is required and cannot be empty
 * - Stock cannot go below zero through operations
 * - Price changes are tracked via updatedAt
 *
 * @class ProductModel
 * @extends {BaseDomainModel<IProduct>}
 * @version 1.0.0
 * @since 2025-10-03
 *
 * @example
 * ```typescript
 * // Creating a new product
 * const product = ProductModel.create({
 *   id: uuidv4(),
 *   name: 'iPhone 15 Pro',
 *   price: 999.99,
 *   stock: 50,
 *   description: 'Latest iPhone',
 *   category: 'Electronics',
 * });
 *
 * // Business operations
 * product.adjustStock(-5); // Sell 5 units
 * product.updatePrice(899.99); // Price discount
 * product.restockItems(20); // Add 20 units
 *
 * // Queries
 * const isAvailable = product.isInStock(); // true
 * const isLowStock = product.isLowStock(10); // check if stock <= 10
 * ```
 */
export class ProductModel extends BaseDomainModel<IProduct> {
  /**
   * Private constructor prevents direct instantiation.
   * Use static factory methods (create, reconstitute) instead.
   *
   * @private
   * @param {string} id - Unique product identifier
   * @param {string} name - Product name
   * @param {number} price - Product price (must be >= 0)
   * @param {number} stockQuantity - Available stock (must be >= 0)
   * @param {string} [description] - Optional product description
   * @param {string} [category] - Optional product category
   * @param {string} [fileId] - Optional file/image reference
   * @param {Date} createdAt - Creation timestamp
   * @param {Date} updatedAt - Last update timestamp
   * @param {Date | null} deletedAt - Soft delete timestamp
   * @param {string} [createdBy] - User who created the product
   * @param {string} [updatedBy] - User who last updated the product
   */
  private constructor(
    private id: string,
    private name: string,
    private price: number,
    private stockQuantity: number,
    private description?: string,
    private category?: string,
    private categoryId?: string,
    private fileId?: string,
    private createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
    private deletedAt: Date | null = null,
    private createdBy?: string,
    private updatedBy?: string,
  ) {
    super();
  }

  /**
   * Factory method for creating new product instances
   *
   * This method validates all business rules before creating a product.
   * Use this when creating a brand new product (not from database).
   *
   * @static
   * @param {Object} data - Product creation data
   * @param {string} data.id - Unique identifier (typically UUID)
   * @param {string} data.name - Product name
   * @param {number} data.price - Product price
   * @param {number} data.stock - Initial stock quantity
   * @param {string} [data.description] - Optional description
   * @param {string} [data.category] - Optional category
   * @param {string} [data.fileId] - Optional file reference
   * @param {string} [data.createdBy] - User creating the product
   * @returns {ProductModel} New product instance
   * @throws {BadRequestException} If validation fails
   *
   * @example
   * ```typescript
   * const product = ProductModel.create({
   *   id: uuidv4(),
   *   name: 'MacBook Pro',
   *   price: 1999.99,
   *   stock: 25,
   *   description: '14-inch, M3 Pro',
   *   category: 'Computers',
   *   createdBy: 'user-uuid',
   * });
   * ```
   */
  static create(data: {
    id: string;
    name: string;
    price: number;
    stock: number;
    description?: string;
    category?: string;
    categoryId?: string;
    fileId?: string;
    createdBy?: string;
  }): ProductModel {
    // Business Rule: Name is required and cannot be empty
    if (!data.name || data.name.trim().length === 0) {
      throw new DomainValidationException(
        ProductErrorCodes.PRODUCT_VALIDATION_NAME_REQUIRED,
        { name: data.name },
      );
    }

    // Business Rule: Price must be non-negative
    if (data.price < 0) {
      throw new DomainValidationException(
        ProductErrorCodes.PRODUCT_VALIDATION_PRICE_NEGATIVE,
        { price: data.price },
      );
    }

    // Business Rule: Stock quantity must be non-negative
    if (data.stock < 0) {
      throw new DomainValidationException(
        ProductErrorCodes.PRODUCT_VALIDATION_STOCK_NEGATIVE,
        { stock: data.stock },
      );
    }

    const now = new Date();
    return new ProductModel(
      data.id,
      data.name.trim(),
      data.price,
      data.stock,
      data.description?.trim(),
      data.category?.trim(),
      data.categoryId,
      data.fileId,
      now,
      now,
      null,
      data.createdBy,
      data.createdBy,
    );
  }

  /**
   * Factory method for reconstituting products from database
   *
   * This method recreates a product instance from database records.
   * No validation is performed since data is already validated and stored.
   *
   * @static
   * @param {IProduct} data - Product entity from database
   * @returns {ProductModel} Reconstituted product instance
   *
   * @example
   * ```typescript
   * const row = await knex('products').where('id', id).first();
   * const product = ProductModel.reconstitute(row);
   * ```
   */
  static reconstitute(data: IProduct): ProductModel {
    return new ProductModel(
      data.id,
      data.name,
      data.price,
      data.stock_quantity,
      data.description,
      data.category,
      data.category_id,
      data.file_id,
      data.created_at,
      data.updated_at,
      data.deleted_at || null,
      data.created_by,
      data.updated_by,
    );
  }

  // ============================================================================
  // BUSINESS METHODS - State-changing operations
  // ============================================================================

  /**
   * Updates product details
   *
   * Allows updating name, price, stock, description, and category.
   * Validates all business rules before applying changes.
   *
   * @param {Object} data - Update data
   * @param {string} [data.name] - New name
   * @param {number} [data.price] - New price
   * @param {number} [data.stock] - New stock quantity
   * @param {string} [data.description] - New description
   * @param {string} [data.category] - New category
   * @param {string} [data.fileId] - New file reference
   * @param {string} [data.updatedBy] - User making the update
   * @returns {void}
   * @throws {BadRequestException} If validation fails
   *
   * @example
   * ```typescript
   * product.update({
   *   price: 899.99,
   *   stock: 45,
   *   updatedBy: 'user-uuid',
   * });
   * ```
   */
  update(data: {
    name?: string;
    price?: number;
    stock?: number;
    description?: string;
    category?: string;
    categoryId?: string;
    fileId?: string;
    updatedBy?: string;
  }): void {
    // Validate and update name
    if (data.name !== undefined) {
      if (!data.name || data.name.trim().length === 0) {
        throw new DomainValidationException(
          ProductErrorCodes.PRODUCT_VALIDATION_NAME_EMPTY,
          { name: data.name },
        );
      }
      this.name = data.name.trim();
    }

    // Validate and update price
    if (data.price !== undefined) {
      if (data.price < 0) {
        throw new DomainValidationException(
          ProductErrorCodes.PRODUCT_VALIDATION_PRICE_NEGATIVE,
          { price: data.price },
        );
      }
      this.price = data.price;
    }

    // Validate and update stock
    if (data.stock !== undefined) {
      if (data.stock < 0) {
        throw new DomainValidationException(
          ProductErrorCodes.PRODUCT_VALIDATION_STOCK_NEGATIVE,
          { stock: data.stock },
        );
      }
      this.stockQuantity = data.stock;
    }

    // Update optional fields
    if (data.description !== undefined) {
      this.description = data.description?.trim();
    }
    if (data.category !== undefined) {
      this.category = data.category?.trim();
    }
    if (data.categoryId !== undefined) {
      this.categoryId = data.categoryId;
    }
    if (data.fileId !== undefined) {
      this.fileId = data.fileId;
    }

    // Update metadata
    this.updatedAt = new Date();
    if (data.updatedBy) {
      this.updatedBy = data.updatedBy;
    }
  }

  /**
   * Updates only the product price
   *
   * Convenience method for price-only updates (e.g., discounts, promotions).
   *
   * @param {number} newPrice - New price
   * @param {string} [updatedBy] - User making the update
   * @returns {void}
   * @throws {BadRequestException} If price is negative
   *
   * @example
   * ```typescript
   * product.updatePrice(799.99, 'admin-uuid'); // Apply discount
   * ```
   */
  updatePrice(newPrice: number, updatedBy?: string): void {
    if (newPrice < 0) {
      throw new DomainValidationException(
        ProductErrorCodes.PRODUCT_VALIDATION_PRICE_NEGATIVE,
        { price: newPrice },
      );
    }

    this.price = newPrice;
    this.updatedAt = new Date();
    if (updatedBy) {
      this.updatedBy = updatedBy;
    }
  }

  /**
   * Adjusts stock quantity by a delta amount
   *
   * Use positive values to increase stock (restocking) and negative values
   * to decrease stock (sales). Prevents stock from going below zero.
   *
   * @param {number} delta - Amount to adjust (positive or negative)
   * @param {string} [updatedBy] - User making the adjustment
   * @returns {void}
   * @throws {BadRequestException} If adjustment would result in negative stock
   *
   * @example
   * ```typescript
   * product.adjustStock(-5);  // Sell 5 units
   * product.adjustStock(20);  // Restock 20 units
   * ```
   */
  adjustStock(delta: number, updatedBy?: string): void {
    const newStock = this.stockQuantity + delta;

    // Business Rule: Stock cannot go below zero
    if (newStock < 0) {
      throw new DomainValidationException(
        ProductErrorCodes.PRODUCT_INSUFFICIENT_STOCK,
        {
          available: this.stockQuantity,
          requested: Math.abs(delta),
        },
      );
    }

    this.stockQuantity = newStock;
    this.updatedAt = new Date();
    if (updatedBy) {
      this.updatedBy = updatedBy;
    }
  }

  /**
   * Restocks the product by adding units
   *
   * Convenience method for adding stock. Use when receiving new inventory.
   *
   * @param {number} quantity - Number of units to add
   * @param {string} [updatedBy] - User performing the restock
   * @returns {void}
   * @throws {BadRequestException} If quantity is negative
   *
   * @example
   * ```typescript
   * product.restockItems(50, 'warehouse-manager-uuid');
   * ```
   */
  restockItems(quantity: number, updatedBy?: string): void {
    if (quantity < 0) {
      throw new DomainValidationException(
        ProductErrorCodes.PRODUCT_RESTOCK_QUANTITY_INVALID,
        { quantity },
      );
    }

    this.adjustStock(quantity, updatedBy);
  }

  /**
   * Reduces stock when items are sold
   *
   * Convenience method for selling items. Validates sufficient stock.
   *
   * @param {number} quantity - Number of units sold
   * @param {string} [updatedBy] - User recording the sale
   * @returns {void}
   * @throws {BadRequestException} If quantity exceeds available stock
   *
   * @example
   * ```typescript
   * product.sellItems(3, 'cashier-uuid');
   * ```
   */
  sellItems(quantity: number, updatedBy?: string): void {
    if (quantity < 0) {
      throw new DomainValidationException(
        ProductErrorCodes.PRODUCT_SELL_QUANTITY_INVALID,
        { quantity },
      );
    }

    this.adjustStock(-quantity, updatedBy);
  }

  /**
   * Applies a percentage discount to the product
   *
   * Calculates and sets a new price based on discount percentage.
   * Does not allow discount to exceed 100% or be negative.
   *
   * @param {number} discountPercent - Discount percentage (0-100)
   * @param {string} [updatedBy] - User applying the discount
   * @returns {void}
   * @throws {BadRequestException} If discount is invalid
   *
   * @example
   * ```typescript
   * product.applyDiscount(20);  // 20% off
   * // If price was 100, it becomes 80
   * ```
   */
  applyDiscount(discountPercent: number, updatedBy?: string): void {
    if (discountPercent < 0 || discountPercent > 100) {
      throw new DomainValidationException(
        ProductErrorCodes.PRODUCT_VALIDATION_DISCOUNT_INVALID,
        { discount: discountPercent },
      );
    }

    const discountAmount = this.price * (discountPercent / 100);
    const newPrice = this.price - discountAmount;

    this.updatePrice(newPrice, updatedBy);
  }

  // ============================================================================
  // QUERY METHODS - Read-only business logic queries
  // ============================================================================

  /**
   * Checks if the product is currently in stock
   *
   * @returns {boolean} True if stock quantity is greater than zero
   *
   * @example
   * ```typescript
   * if (product.isInStock()) {
   *   // Allow purchase
   * }
   * ```
   */
  isInStock(): boolean {
    return this.stockQuantity > 0;
  }

  /**
   * Checks if the product is out of stock
   *
   * @returns {boolean} True if stock quantity is zero
   *
   * @example
   * ```typescript
   * if (product.isOutOfStock()) {
   *   console.log('Product unavailable');
   * }
   * ```
   */
  isOutOfStock(): boolean {
    return this.stockQuantity === 0;
  }

  /**
   * Checks if stock is below a threshold (low stock warning)
   *
   * @param {number} threshold - Minimum acceptable stock level
   * @returns {boolean} True if current stock is at or below threshold
   *
   * @example
   * ```typescript
   * if (product.isLowStock(10)) {
   *   // Send restock notification
   * }
   * ```
   */
  isLowStock(threshold: number = 10): boolean {
    return this.stockQuantity <= threshold;
  }

  /**
   * Checks if the product has sufficient stock for a quantity
   *
   * @param {number} quantity - Required quantity
   * @returns {boolean} True if stock is sufficient
   *
   * @example
   * ```typescript
   * if (product.hasSufficientStock(5)) {
   *   product.sellItems(5);
   * }
   * ```
   */
  hasSufficientStock(quantity: number): boolean {
    return this.stockQuantity >= quantity;
  }

  /**
   * Calculates the total inventory value
   *
   * @returns {number} Total value (price × stock quantity)
   *
   * @example
   * ```typescript
   * const value = product.getInventoryValue();
   * // If price is 100 and stock is 50, returns 5000
   * ```
   */
  getInventoryValue(): number {
    return this.price * this.stockQuantity;
  }

  /**
   * Checks if the product has an associated image/file
   *
   * @returns {boolean} True if file_id is set
   *
   * @example
   * ```typescript
   * if (product.hasImage()) {
   *   // Display product image
   * }
   * ```
   */
  hasImage(): boolean {
    return !!this.fileId;
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
   * @returns {IProduct} Entity representation for database/API
   *
   * @example
   * ```typescript
   * const entity = product.toEntity();
   * await knex('products').insert(entity);
   * ```
   */
  toEntity(): IProduct {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      stock_quantity: this.stockQuantity,
      category: this.category,
      category_id: this.categoryId,
      file_id: this.fileId,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      deleted_at: this.deletedAt || undefined,
      created_by: this.createdBy,
      updated_by: this.updatedBy,
    };
  }

  // Getters for read-only access to properties

  /**
   * Gets the product ID
   * @returns {string} Product identifier
   */
  getId(): string {
    return this.id;
  }

  /**
   * Gets the product name
   * @returns {string} Product name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Gets the product description
   * @returns {string | undefined} Product description
   */
  getDescription(): string | undefined {
    return this.description;
  }

  /**
   * Gets the product price
   * @returns {number} Current price
   */
  getPrice(): number {
    return this.price;
  }

  /**
   * Gets the current stock quantity
   * @returns {number} Available stock
   */
  getStockQuantity(): number {
    return this.stockQuantity;
  }

  /**
   * Gets the product category (legacy)
   * @returns {string | undefined} Category name
   */
  getCategory(): string | undefined {
    return this.category;
  }

  /**
   * Gets the category ID
   * @returns {string | undefined} Category ID
   */
  getCategoryId(): string | undefined {
    return this.categoryId;
  }

  /**
   * Gets the file/image reference
   * @returns {string | undefined} File ID
   */
  getFileId(): string | undefined {
    return this.fileId;
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

  /**
   * Gets the ID of the user who created the product
   * @returns {string | undefined} Creator user ID
   */
  getCreatedBy(): string | undefined {
    return this.createdBy;
  }

  /**
   * Gets the ID of the user who last updated the product
   * @returns {string | undefined} Updater user ID
   */
  getUpdatedBy(): string | undefined {
    return this.updatedBy;
  }
}
