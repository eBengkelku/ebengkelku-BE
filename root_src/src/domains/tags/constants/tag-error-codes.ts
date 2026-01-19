/**
 * Tag Domain Error Codes
 *
 * Domain-specific error codes for the Tag domain.
 * Extends the default domain error codes with tag-specific errors.
 *
 * This pattern allows each domain to define its own error codes while
 * inheriting common error codes from the base domain infrastructure.
 *
 * @module TagErrorCodes
 * @version 1.0.0
 * @since 2025-01-13
 *
 * @example
 * ```typescript
 * import { TagErrorCodes } from './constants';
 *
 * // Use common error codes
 * throw new DomainValidationException(
 *   TagErrorCodes.COMMON_VALIDATION_REQUIRED,
 *   { field: 'name' }
 * );
 *
 * // Use tag-specific error codes
 * throw new DomainValidationException(
 *   TagErrorCodes.TAG_VALIDATION_NAME_TOO_LONG,
 *   { name: 'Very Long Tag Name That Exceeds Limit' }
 * );
 * ```
 */

import { DomainErrorCodesDefault } from '../../../common/domain/exceptions/constants';

/**
 * Tag Error Codes
 *
 * Combines default domain error codes with tag-specific error codes.
 * This allows tag domain to use both common and specific errors.
 */
export const TagErrorCodes = {
  // ============================================================================
  // INHERITED: Common Error Codes from Default
  // ============================================================================
  ...DomainErrorCodesDefault,

  // ============================================================================
  // TAG-SPECIFIC: Validation Errors
  // ============================================================================
  TAG_VALIDATION_NAME_REQUIRED: 'domain.tags.validation.name_required',
  TAG_VALIDATION_NAME_TOO_LONG: 'domain.tags.validation.name_too_long',
  TAG_VALIDATION_COLOR_INVALID: 'domain.tags.validation.color_invalid',
  TAG_VALIDATION_COLOR_FORMAT: 'domain.tags.validation.color_format',

  // ============================================================================
  // TAG-SPECIFIC: Business Rule Errors
  // ============================================================================
  TAG_NOT_FOUND: 'domain.tags.not_found',
  TAG_NAME_EXISTS: 'domain.tags.name_exists',
} as const;

/**
 * Type for all tag error codes (common + tag-specific)
 */
export type TagErrorCode = (typeof TagErrorCodes)[keyof typeof TagErrorCodes];

/**
 * Helper function to check if a string is a valid tag error code
 *
 * @param {string} code - The code to check
 * @returns {boolean} True if the code is a valid tag error code
 *
 * @example
 * ```typescript
 * if (isTagErrorCode('domain.tags.not_found')) {
 *   // Handle as tag error
 * }
 * ```
 */
export function isTagErrorCode(code: string): code is TagErrorCode {
  return Object.values(TagErrorCodes).includes(code as TagErrorCode);
}

/**
 * Helper function to get all tag-specific error codes (excluding common)
 *
 * @returns {string[]} Array of tag-specific error codes only
 *
 * @example
 * ```typescript
 * const tagOnlyErrors = getTagSpecificErrorCodes();
 * // Returns: ['domain.tags.validation.name_required', 'domain.tags.not_found', ...]
 * ```
 */
export function getTagSpecificErrorCodes(): string[] {
  return Object.values(TagErrorCodes).filter((code) =>
    code.startsWith('domain.tags'),
  );
}
