/**
 * Product Domain Error Codes
 *
 * Domain-specific error codes for the Product domain.
 * Extends the default domain error codes with product-specific errors.
 *
 * This pattern allows each domain to define its own error codes while
 * inheriting common error codes from the base domain infrastructure.
 *
 * @module ProductErrorCodes
 * @version 1.0.0
 * @since 2025-10-03
 *
 * @example
 * ```typescript
 * import { ProductErrorCodes } from './constants';
 *
 * // Use common error codes
 * throw new DomainValidationException(
 *   ProductErrorCodes.COMMON_VALIDATION_REQUIRED,
 *   { field: 'name' }
 * );
 *
 * // Use product-specific error codes
 * throw new DomainValidationException(
 *   ProductErrorCodes.PRODUCT_VALIDATION_PRICE_NEGATIVE,
 *   { price: -10 }
 * );
 * ```
 */

import { DomainErrorCodesDefault } from '../../../common/domain/exceptions/constants';

/**
 * Product Error Codes
 *
 * Combines default domain error codes with product-specific error codes.
 * This allows product domain to use both common and specific errors.
 */
export const ProductErrorCodes = {
  // ============================================================================
  // INHERITED: Common Error Codes from Default
  // ============================================================================
  ...DomainErrorCodesDefault,

  // ============================================================================
  // PRODUCT-SPECIFIC: Validation Errors
  // ============================================================================
  PRODUCT_VALIDATION_NAME_REQUIRED: 'domain.products.validation.name_required',
  PRODUCT_VALIDATION_NAME_EMPTY: 'domain.products.validation.name_empty',
  PRODUCT_VALIDATION_PRICE_NEGATIVE:
    'domain.products.validation.price_negative',
  PRODUCT_VALIDATION_STOCK_NEGATIVE:
    'domain.products.validation.stock_negative',
  PRODUCT_VALIDATION_DISCOUNT_INVALID:
    'domain.products.validation.discount_invalid',

  // ============================================================================
  // PRODUCT-SPECIFIC: Business Rule Errors
  // ============================================================================
  PRODUCT_INSUFFICIENT_STOCK: 'domain.products.insufficient_stock',
  PRODUCT_NOT_FOUND: 'domain.products.not_found',
  PRODUCT_RESTOCK_QUANTITY_INVALID: 'domain.products.restock_quantity_invalid',
  PRODUCT_SELL_QUANTITY_INVALID: 'domain.products.sell_quantity_invalid',
} as const;

/**
 * Type for all product error codes (common + product-specific)
 */
export type ProductErrorCode =
  (typeof ProductErrorCodes)[keyof typeof ProductErrorCodes];

/**
 * Helper function to check if a string is a valid product error code
 *
 * @param {string} code - The code to check
 * @returns {boolean} True if the code is a valid product error code
 *
 * @example
 * ```typescript
 * if (isProductErrorCode('domain.products.not_found')) {
 *   // Handle as product error
 * }
 * ```
 */
export function isProductErrorCode(code: string): code is ProductErrorCode {
  return Object.values(ProductErrorCodes).includes(code as ProductErrorCode);
}

/**
 * Helper function to get all product-specific error codes (excluding common)
 *
 * @returns {string[]} Array of product-specific error codes only
 *
 * @example
 * ```typescript
 * const productOnlyErrors = getProductSpecificErrorCodes();
 * // Returns: ['domain.products.validation.name_required', 'domain.products.not_found', ...]
 * ```
 */
export function getProductSpecificErrorCodes(): string[] {
  return Object.values(ProductErrorCodes).filter((code) =>
    code.startsWith('domain.products'),
  );
}
