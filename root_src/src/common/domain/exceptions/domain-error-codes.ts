/**
 * Domain Error Codes
 *
 * Centralized registry of all domain error translation keys.
 * This provides type safety and autocomplete for error codes across the application.
 *
 * Usage: Import and use these constants instead of raw strings
 *
 * @module DomainErrorCodes
 * @version 1.0.0
 * @since 2025-10-03
 *
 * @example
 * ```typescript
 * import { DomainErrorCodes } from '@/common/domain';
 *
 * if (price < 0) {
 *   throw new DomainValidationException(
 *     DomainErrorCodes.COMMON_VALIDATION_NEGATIVE_NUMBER,
 *     { field: 'price', value: price }
 *   );
 * }
 * ```
 */

/**
 * Common Domain Error Codes
 *
 * Generic error codes that can be reused across all domains
 */
export const DomainErrorCodes = {
  // Common Validation Errors
  COMMON_VALIDATION_REQUIRED: 'domain.common.validation.required',
  COMMON_VALIDATION_INVALID: 'domain.common.validation.invalid',
  COMMON_VALIDATION_NEGATIVE_NUMBER: 'domain.common.validation.negative_number',
  COMMON_VALIDATION_EMPTY_STRING: 'domain.common.validation.empty_string',
  COMMON_VALIDATION_MIN_LENGTH: 'domain.common.validation.min_length',
  COMMON_VALIDATION_MAX_LENGTH: 'domain.common.validation.max_length',
  COMMON_VALIDATION_INVALID_FORMAT: 'domain.common.validation.invalid_format',
  COMMON_VALIDATION_OUT_OF_RANGE: 'domain.common.validation.out_of_range',

  // Common Not Found Errors
  COMMON_NOT_FOUND: 'domain.common.not_found',
  COMMON_NOT_FOUND_BY_ID: 'domain.common.not_found_by_id',

  // Common Conflict Errors
  COMMON_ALREADY_EXISTS: 'domain.common.already_exists',
  COMMON_DUPLICATE: 'domain.common.duplicate',

  // Common Business Rule Errors
  COMMON_INSUFFICIENT_QUANTITY: 'domain.common.insufficient_quantity',
  COMMON_OPERATION_NOT_ALLOWED: 'domain.common.operation_not_allowed',
  COMMON_INVALID_STATE_TRANSITION: 'domain.common.invalid_state_transition',

  // Product Domain Specific Errors
  PRODUCT_VALIDATION_NAME_REQUIRED: 'domain.products.validation.name_required',
  PRODUCT_VALIDATION_NAME_EMPTY: 'domain.products.validation.name_empty',
  PRODUCT_VALIDATION_PRICE_NEGATIVE:
    'domain.products.validation.price_negative',
  PRODUCT_VALIDATION_STOCK_NEGATIVE:
    'domain.products.validation.stock_negative',
  PRODUCT_VALIDATION_DISCOUNT_INVALID:
    'domain.products.validation.discount_invalid',
  PRODUCT_INSUFFICIENT_STOCK: 'domain.products.insufficient_stock',
  PRODUCT_NOT_FOUND: 'domain.products.not_found',
  PRODUCT_RESTOCK_QUANTITY_INVALID: 'domain.products.restock_quantity_invalid',
  PRODUCT_SELL_QUANTITY_INVALID: 'domain.products.sell_quantity_invalid',

  // Order Domain Specific Errors (Example for future domains)
  ORDER_VALIDATION_ITEMS_REQUIRED: 'domain.orders.validation.items_required',
  ORDER_VALIDATION_TOTAL_MISMATCH: 'domain.orders.validation.total_mismatch',
  ORDER_CANNOT_CONFIRM: 'domain.orders.cannot_confirm',
  ORDER_CANNOT_CANCEL: 'domain.orders.cannot_cancel',
  ORDER_ALREADY_DELIVERED: 'domain.orders.already_delivered',
  ORDER_NOT_FOUND: 'domain.orders.not_found',

  // Booking Domain Specific Errors (Example for future domains)
  BOOKING_VALIDATION_DATE_INVALID: 'domain.bookings.validation.date_invalid',
  BOOKING_VALIDATION_PAST_DATE: 'domain.bookings.validation.past_date',
  BOOKING_VALIDATION_DURATION_TOO_SHORT:
    'domain.bookings.validation.duration_too_short',
  BOOKING_OVERLAP_DETECTED: 'domain.bookings.overlap_detected',
  BOOKING_CANNOT_CANCEL: 'domain.bookings.cannot_cancel',
  BOOKING_TOO_LATE_TO_CANCEL: 'domain.bookings.too_late_to_cancel',
  BOOKING_NOT_FOUND: 'domain.bookings.not_found',
} as const;

/**
 * Type for all domain error codes
 * Provides type safety when using error codes
 */
export type DomainErrorCode =
  (typeof DomainErrorCodes)[keyof typeof DomainErrorCodes];

/**
 * Helper function to check if a string is a valid domain error code
 *
 * @param {string} code - The code to check
 * @returns {boolean} True if the code is a valid domain error code
 *
 * @example
 * ```typescript
 * if (isDomainErrorCode('domain.products.not_found')) {
 *   // Handle as domain error
 * }
 * ```
 */
export function isDomainErrorCode(code: string): code is DomainErrorCode {
  return Object.values(DomainErrorCodes).includes(code as DomainErrorCode);
}

/**
 * Helper function to get all error codes for a specific domain
 *
 * @param {string} domain - The domain name (e.g., 'products', 'orders')
 * @returns {string[]} Array of error codes for the specified domain
 *
 * @example
 * ```typescript
 * const productErrors = getErrorCodesForDomain('products');
 * // Returns: ['domain.products.validation.name_required', 'domain.products.not_found', ...]
 * ```
 */
export function getErrorCodesForDomain(domain: string): string[] {
  const prefix = `domain.${domain}`;
  return Object.values(DomainErrorCodes).filter((code) =>
    code.startsWith(prefix),
  );
}
