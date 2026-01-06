/**
 * Default Domain Error Codes
 *
 * This file contains ONLY common/reusable error codes that can be used
 * across all domains. Domain-specific error codes should be defined in
 * their respective domain directories.
 *
 * Each domain can extend these defaults with their own specific error codes.
 *
 * @module DomainErrorCodesDefault
 * @version 1.1.0
 * @since 2025-10-03
 * @updated 2025-10-03 - Refactored to injectable pattern
 *
 * @example
 * ```typescript
 * // In a domain (e.g., products)
 * import { DomainErrorCodesDefault } from '@/common/domain';
 *
 * export const ProductErrorCodes = {
 *   ...DomainErrorCodesDefault, // Extend from default
 *   PRODUCT_SPECIFIC_ERROR: 'domain.products.specific_error',
 * } as const;
 * ```
 */

/**
 * Default Domain Error Codes
 *
 * Contains common error codes that can be reused across all domains.
 * These errors are generic and not tied to any specific business domain.
 */
export const DomainErrorCodesDefault = {
  // ============================================================================
  // COMMON VALIDATION ERRORS
  // ============================================================================
  COMMON_VALIDATION_REQUIRED: 'domain.common.validation.required',
  COMMON_VALIDATION_INVALID: 'domain.common.validation.invalid',
  COMMON_VALIDATION_NEGATIVE_NUMBER: 'domain.common.validation.negative_number',
  COMMON_VALIDATION_EMPTY_STRING: 'domain.common.validation.empty_string',
  COMMON_VALIDATION_MIN_LENGTH: 'domain.common.validation.min_length',
  COMMON_VALIDATION_MAX_LENGTH: 'domain.common.validation.max_length',
  COMMON_VALIDATION_INVALID_FORMAT: 'domain.common.validation.invalid_format',
  COMMON_VALIDATION_OUT_OF_RANGE: 'domain.common.validation.out_of_range',

  // ============================================================================
  // COMMON NOT FOUND ERRORS
  // ============================================================================
  COMMON_NOT_FOUND: 'domain.common.not_found',
  COMMON_NOT_FOUND_BY_ID: 'domain.common.not_found_by_id',

  // ============================================================================
  // COMMON CONFLICT ERRORS
  // ============================================================================
  COMMON_ALREADY_EXISTS: 'domain.common.already_exists',
  COMMON_DUPLICATE: 'domain.common.duplicate',

  // ============================================================================
  // COMMON BUSINESS RULE ERRORS
  // ============================================================================
  COMMON_INSUFFICIENT_QUANTITY: 'domain.common.insufficient_quantity',
  COMMON_OPERATION_NOT_ALLOWED: 'domain.common.operation_not_allowed',
  COMMON_INVALID_STATE_TRANSITION: 'domain.common.invalid_state_transition',
} as const;

/**
 * Type for default domain error codes
 */
export type DomainErrorCodeDefault =
  (typeof DomainErrorCodesDefault)[keyof typeof DomainErrorCodesDefault];

/**
 * Helper function to check if a string is a valid default domain error code
 *
 * @param {string} code - The code to check
 * @returns {boolean} True if the code is a valid default domain error code
 *
 * @example
 * ```typescript
 * if (isDefaultDomainErrorCode('domain.common.not_found')) {
 *   // Handle as default domain error
 * }
 * ```
 */
export function isDefaultDomainErrorCode(
  code: string,
): code is DomainErrorCodeDefault {
  return Object.values(DomainErrorCodesDefault).includes(
    code as DomainErrorCodeDefault,
  );
}
