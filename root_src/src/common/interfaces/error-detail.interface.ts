/**
 * Error Detail Interface
 *
 * Represents a single error in the standardized error response.
 * Used for validation errors, business rule violations, and other error scenarios.
 *
 * @interface ErrorDetail
 * @version 1.0.0
 * @since 2025-10-10
 *
 * @example
 * ```typescript
 * const validationError: ErrorDetail = {
 *   property: 'role_name',
 *   value: 'A',
 *   code: 'VALIDATION_MIN_LENGTH',
 *   message: 'role_name must be longer than or equal to 3 characters',
 *   context_message: "Nama peran 'A' terlalu pendek. Panjang minimal yang diperbolehkan adalah 3 karakter.",
 *   context: {
 *     minLength: 3,
 *     currentLength: 1
 *   }
 * };
 * ```
 */
export interface ErrorDetail {
  /**
   * The property/field name that caused the error
   * @example 'price', 'email', 'stock_quantity'
   */
  property?: string;

  /**
   * The invalid value that was provided
   * @example -10, 'invalid@', null
   */
  value?: any;

  /**
   * Standardized error code for programmatic handling
   * @example 'VALIDATION_MIN_LENGTH', 'NOT_FOUND', 'INSUFFICIENT_STOCK'
   */
  code: string;

  /**
   * Original validation message (usually in English)
   * @example 'role_name must be longer than or equal to 3 characters'
   */
  message: string;

  /**
   * Contextualized, i18n-translated error message with details
   * @example "Nama peran 'A' terlalu pendek. Panjang minimal yang diperbolehkan adalah 3 karakter."
   */
  context_message?: string;

  /**
   * Additional context about the error
   * Can include constraints, expected values, actual values, etc.
   * @example { minLength: 3, currentLength: 1 }
   */
  context?: Record<string, any>;
}

/**
 * Validation Error Detail (without property field, as property becomes the object key)
 *
 * @example
 * ```typescript
 * const errors: Record<string, ValidationErrorDetail> = {
 *   email: {
 *     code: 'VALIDATION_EMAIL_FORMAT',
 *     message: 'email must be an email',
 *     value: 'invalid-email'
 *   }
 * };
 * ```
 */
export type ValidationErrorDetail = Omit<ErrorDetail, 'property'>;
