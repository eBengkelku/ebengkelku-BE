/**
 * Category Domain Error Codes
 *
 * Domain-specific error codes for the Category domain.
 * Extends the default domain error codes with category-specific errors.
 *
 * This pattern allows each domain to define its own error codes while
 * inheriting common error codes from the base domain infrastructure.
 *
 * @module CategoryErrorCodes
 * @version 1.0.0
 * @since 2025-01-13
 *
 * @example
 * ```typescript
 * import { CategoryErrorCodes } from './constants';
 *
 * // Use common error codes
 * throw new DomainValidationException(
 *   CategoryErrorCodes.COMMON_VALIDATION_REQUIRED,
 *   { field: 'name' }
 * );
 *
 * // Use category-specific error codes
 * throw new DomainValidationException(
 *   CategoryErrorCodes.CATEGORY_VALIDATION_NAME_REQUIRED,
 *   { name: '' }
 * );
 * ```
 */

import { DomainErrorCodesDefault } from '../../../common/domain/exceptions/constants';

/**
 * Category Error Codes
 *
 * Combines default domain error codes with category-specific error codes.
 * This allows category domain to use both common and specific errors.
 */
export const CategoryErrorCodes = {
  // ============================================================================
  // INHERITED: Common Error Codes from Default
  // ============================================================================
  ...DomainErrorCodesDefault,

  // ============================================================================
  // CATEGORY-SPECIFIC: Validation Errors
  // ============================================================================
  CATEGORY_VALIDATION_NAME_REQUIRED: 'domain.categories.validation.name_required',
  CATEGORY_VALIDATION_NAME_EMPTY: 'domain.categories.validation.name_empty',
  CATEGORY_VALIDATION_SLUG_INVALID: 'domain.categories.validation.slug_invalid',
  CATEGORY_VALIDATION_SLUG_FORMAT: 'domain.categories.validation.slug_format',

  // ============================================================================
  // CATEGORY-SPECIFIC: Business Rule Errors
  // ============================================================================
  CATEGORY_NOT_FOUND: 'domain.categories.not_found',
  CATEGORY_NAME_EXISTS: 'domain.categories.name_exists',
  CATEGORY_SLUG_EXISTS: 'domain.categories.slug_exists',
} as const;

/**
 * Type for all category error codes (common + category-specific)
 */
export type CategoryErrorCode =
  (typeof CategoryErrorCodes)[keyof typeof CategoryErrorCodes];

/**
 * Helper function to check if a string is a valid category error code
 *
 * @param {string} code - The code to check
 * @returns {boolean} True if the code is a valid category error code
 *
 * @example
 * ```typescript
 * if (isCategoryErrorCode('domain.categories.not_found')) {
 *   // Handle as category error
 * }
 * ```
 */
export function isCategoryErrorCode(code: string): code is CategoryErrorCode {
  return Object.values(CategoryErrorCodes).includes(code as CategoryErrorCode);
}

/**
 * Helper function to get all category-specific error codes (excluding common)
 *
 * @returns {string[]} Array of category-specific error codes only
 *
 * @example
 * ```typescript
 * const categoryOnlyErrors = getCategorySpecificErrorCodes();
 * // Returns: ['domain.categories.validation.name_required', 'domain.categories.not_found', ...]
 * ```
 */
export function getCategorySpecificErrorCodes(): string[] {
  return Object.values(CategoryErrorCodes).filter((code) =>
    code.startsWith('domain.categories'),
  );
}
