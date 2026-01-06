/**
 * Product Domain Error Codes
 *
 * Domain-specific error codes for product-related operations.
 * These codes are used in custom exceptions and error responses.
 *
 * @module ProductErrorCodes
 * @version 1.0.0
 * @since 2025-10-10
 *
 * @example
 * ```typescript
 * import { ProductErrorCodes } from './errors/product-error-codes';
 *
 * throw new ValidationException(
 *   'Product is out of stock',
 *   [{
 *     code: ProductErrorCodes.OUT_OF_STOCK,
 *     message: 'Product is currently out of stock'
 *   }]
 * );
 * ```
 */

/**
 * Product-specific error codes
 *
 * Naming Convention:
 * - Use SCREAMING_SNAKE_CASE
 * - Prefix with domain context if needed (e.g., PRODUCT_)
 * - Be descriptive and specific to business rules
 */
export const ProductErrorCodes = {
  // ========================================
  // Stock & Inventory Errors
  // ========================================

  /**
   * Product is out of stock
   */
  OUT_OF_STOCK: 'PRODUCT_OUT_OF_STOCK',

  /**
   * Insufficient stock for requested quantity
   */
  INSUFFICIENT_STOCK: 'PRODUCT_INSUFFICIENT_STOCK',

  /**
   * Product has been discontinued
   */
  DISCONTINUED: 'PRODUCT_DISCONTINUED',

  /**
   * Product is reserved/on hold
   */
  RESERVED: 'PRODUCT_RESERVED',

  // ========================================
  // Price & Discount Errors
  // ========================================

  /**
   * Price is below minimum allowed
   */
  PRICE_BELOW_MINIMUM: 'PRODUCT_PRICE_BELOW_MINIMUM',

  /**
   * Price is above maximum allowed
   */
  PRICE_ABOVE_MAXIMUM: 'PRODUCT_PRICE_ABOVE_MAXIMUM',

  /**
   * Invalid discount percentage
   */
  INVALID_DISCOUNT: 'PRODUCT_INVALID_DISCOUNT',

  /**
   * Discount has expired
   */
  DISCOUNT_EXPIRED: 'PRODUCT_DISCOUNT_EXPIRED',

  // ========================================
  // SKU & Identifier Errors
  // ========================================

  /**
   * SKU already exists
   */
  SKU_ALREADY_EXISTS: 'PRODUCT_SKU_ALREADY_EXISTS',

  /**
   * Invalid SKU format
   */
  INVALID_SKU_FORMAT: 'PRODUCT_INVALID_SKU_FORMAT',

  /**
   * Barcode already exists
   */
  BARCODE_ALREADY_EXISTS: 'PRODUCT_BARCODE_ALREADY_EXISTS',

  // ========================================
  // Category & Classification Errors
  // ========================================

  /**
   * Category does not exist
   */
  CATEGORY_NOT_FOUND: 'PRODUCT_CATEGORY_NOT_FOUND',

  /**
   * Invalid category for this product type
   */
  INVALID_CATEGORY: 'PRODUCT_INVALID_CATEGORY',

  /**
   * Product cannot be moved to this category
   */
  CATEGORY_MIGRATION_FORBIDDEN: 'PRODUCT_CATEGORY_MIGRATION_FORBIDDEN',

  // ========================================
  // Image & Media Errors
  // ========================================

  /**
   * Image is required
   */
  IMAGE_REQUIRED: 'PRODUCT_IMAGE_REQUIRED',

  /**
   * Too many images
   */
  TOO_MANY_IMAGES: 'PRODUCT_TOO_MANY_IMAGES',

  /**
   * Invalid image format
   */
  INVALID_IMAGE_FORMAT: 'PRODUCT_INVALID_IMAGE_FORMAT',

  /**
   * Image size exceeds limit
   */
  IMAGE_SIZE_EXCEEDED: 'PRODUCT_IMAGE_SIZE_EXCEEDED',

  // ========================================
  // Business Rule Errors
  // ========================================

  /**
   * Product cannot be deleted (has active orders)
   */
  CANNOT_DELETE_HAS_ORDERS: 'PRODUCT_CANNOT_DELETE_HAS_ORDERS',

  /**
   * Product is in active promotion
   */
  IN_ACTIVE_PROMOTION: 'PRODUCT_IN_ACTIVE_PROMOTION',

  /**
   * Product requires approval before publishing
   */
  REQUIRES_APPROVAL: 'PRODUCT_REQUIRES_APPROVAL',

  /**
   * Product variant already exists
   */
  VARIANT_ALREADY_EXISTS: 'PRODUCT_VARIANT_ALREADY_EXISTS',

  /**
   * Minimum order quantity not met
   */
  MINIMUM_ORDER_NOT_MET: 'PRODUCT_MINIMUM_ORDER_NOT_MET',

  /**
   * Maximum order quantity exceeded
   */
  MAXIMUM_ORDER_EXCEEDED: 'PRODUCT_MAXIMUM_ORDER_EXCEEDED',
} as const;

/**
 * Product Error Code Type
 *
 * Type-safe product error code type derived from ProductErrorCodes object
 */
export type ProductErrorCode =
  (typeof ProductErrorCodes)[keyof typeof ProductErrorCodes];

/**
 * Check if a string is a valid product error code
 *
 * @param code - The code to check
 * @returns True if the code is a valid product error code
 *
 * @example
 * ```typescript
 * if (isProductErrorCode('PRODUCT_OUT_OF_STOCK')) {
 *   // Valid product error code
 * }
 * ```
 */
export function isProductErrorCode(code: string): code is ProductErrorCode {
  return Object.values(ProductErrorCodes).includes(code as ProductErrorCode);
}

/**
 * Product Error Metadata
 *
 * Additional information about product error codes
 */
export interface ProductErrorMetadata {
  code: ProductErrorCode;
  defaultMessage: string;
  httpStatus: number;
  recoverable: boolean;
}

/**
 * Product Error Code Metadata Registry
 *
 * Maps product error codes to their metadata
 */
export const ProductErrorMetadata: Record<string, ProductErrorMetadata> = {
  [ProductErrorCodes.OUT_OF_STOCK]: {
    code: ProductErrorCodes.OUT_OF_STOCK,
    defaultMessage: 'Product is out of stock',
    httpStatus: 409,
    recoverable: true,
  },
  [ProductErrorCodes.INSUFFICIENT_STOCK]: {
    code: ProductErrorCodes.INSUFFICIENT_STOCK,
    defaultMessage: 'Insufficient stock for requested quantity',
    httpStatus: 409,
    recoverable: true,
  },
  [ProductErrorCodes.SKU_ALREADY_EXISTS]: {
    code: ProductErrorCodes.SKU_ALREADY_EXISTS,
    defaultMessage: 'SKU already exists',
    httpStatus: 409,
    recoverable: false,
  },
  [ProductErrorCodes.CANNOT_DELETE_HAS_ORDERS]: {
    code: ProductErrorCodes.CANNOT_DELETE_HAS_ORDERS,
    defaultMessage: 'Cannot delete product with active orders',
    httpStatus: 409,
    recoverable: false,
  },
  // Add more as needed...
};
