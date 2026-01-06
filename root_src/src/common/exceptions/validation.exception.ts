import { HttpStatus } from '@nestjs/common';
import { BaseHttpException } from './base.exception';
import { ErrorCodes } from '../errors';
import { ErrorDetail } from '../interfaces';

/**
 * Validation Exception
 *
 * Thrown when request data validation fails.
 * Supports multiple validation errors with detailed field-level information.
 *
 * @class ValidationException
 * @extends BaseHttpException
 * @version 1.0.0
 * @since 2025-10-10
 *
 * @example Single validation error
 * ```typescript
 * throw new ValidationException('Validation failed', [
 *   {
 *     property: 'price',
 *     value: -10,
 *     code: 'MUST_BE_POSITIVE',
 *     message: 'Price must be positive',
 *     context: { min: 0 }
 *   }
 * ]);
 * ```
 *
 * @example Multiple validation errors
 * ```typescript
 * throw new ValidationException('Multiple validation errors', [
 *   { property: 'name', code: 'REQUIRED_FIELD', message: 'Name is required' },
 *   { property: 'price', code: 'OUT_OF_RANGE', message: 'Price is invalid' }
 * ]);
 * ```
 */
export class ValidationException extends BaseHttpException {
  /**
   * Creates a new ValidationException
   *
   * @param message - Overall validation error message
   * @param errors - Array of validation error details
   * @param translationKey - i18n translation key (optional)
   * @param translationParams - Translation parameters (optional)
   */
  constructor(
    message: string = 'Validation failed',
    errors: ErrorDetail[] = [],
    translationKey?: string,
    translationParams?: Record<string, any>,
  ) {
    super(
      message,
      HttpStatus.BAD_REQUEST,
      ErrorCodes.VALIDATION_FAILED,
      undefined,
      translationKey || 'common.validation.failed',
      translationParams,
    );

    this.setErrors(errors);

    Object.setPrototypeOf(this, ValidationException.prototype);
  }

  /**
   * Creates a ValidationException from class-validator errors
   *
   * @param validationErrors - Array of class-validator errors
   * @returns ValidationException instance
   *
   * @example
   * ```typescript
   * const errors = await validate(dto);
   * if (errors.length > 0) {
   *   throw ValidationException.fromClassValidator(errors);
   * }
   * ```
   */
  static fromClassValidator(validationErrors: any[]): ValidationException {
    const errors: ErrorDetail[] = validationErrors.map((error) => ({
      property: error.property,
      value: error.value,
      code: ErrorCodes.VALIDATION_FAILED,
      message: Object.values(error.constraints || {}).join(', '),
      context: {
        constraints: error.constraints,
        target: error.target?.constructor?.name,
      },
    }));

    return new ValidationException('Validation failed', errors);
  }

  /**
   * Creates a ValidationException for a single field
   *
   * @param field - Field name
   * @param message - Error message
   * @param value - Invalid value
   * @param context - Additional context
   * @returns ValidationException instance
   *
   * @example
   * ```typescript
   * throw ValidationException.forField(
   *   'email',
   *   'Invalid email format',
   *   'invalid@',
   *   { pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ }
   * );
   * ```
   */
  static forField(
    field: string,
    message: string,
    value?: any,
    context?: Record<string, any>,
  ): ValidationException {
    return new ValidationException(message, [
      {
        property: field,
        value,
        code: ErrorCodes.VALIDATION_FAILED,
        message,
        context,
      },
    ]);
  }

  /**
   * Creates a ValidationException for a required field
   *
   * @param field - Field name
   * @returns ValidationException instance
   *
   * @example
   * ```typescript
   * throw ValidationException.requiredField('email');
   * ```
   */
  static requiredField(field: string): ValidationException {
    return new ValidationException(`${field} is required`, [
      {
        property: field,
        code: ErrorCodes.REQUIRED_FIELD,
        message: `${field} is required`,
      },
    ]);
  }

  /**
   * Creates a ValidationException for invalid format
   *
   * @param field - Field name
   * @param value - Invalid value
   * @param expectedFormat - Expected format description
   * @returns ValidationException instance
   *
   * @example
   * ```typescript
   * throw ValidationException.invalidFormat('email', 'notanemail', 'valid email address');
   * ```
   */
  static invalidFormat(
    field: string,
    value: any,
    expectedFormat?: string,
  ): ValidationException {
    return new ValidationException(`${field} has invalid format`, [
      {
        property: field,
        value,
        code: ErrorCodes.INVALID_FORMAT,
        message: `${field} has invalid format`,
        context: expectedFormat ? { expectedFormat } : undefined,
      },
    ]);
  }

  /**
   * Creates a ValidationException for out of range value
   *
   * @param field - Field name
   * @param value - Invalid value
   * @param min - Minimum allowed value
   * @param max - Maximum allowed value
   * @returns ValidationException instance
   *
   * @example
   * ```typescript
   * throw ValidationException.outOfRange('price', -10, 0, 999999);
   * ```
   */
  static outOfRange(
    field: string,
    value: any,
    min?: number,
    max?: number,
  ): ValidationException {
    return new ValidationException(`${field} is out of range`, [
      {
        property: field,
        value,
        code: ErrorCodes.OUT_OF_RANGE,
        message: `${field} is out of range`,
        context: { min, max, value },
      },
    ]);
  }
}
