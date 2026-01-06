import { BadRequestException, HttpStatus } from '@nestjs/common';

/**
 * Domain Exception
 *
 * Base exception class for all domain-level errors. This exception uses
 * translation keys instead of hardcoded messages, enabling i18n support
 * while keeping domain models pure (no I18nService dependency).
 *
 * The exception holds a translation key and optional parameters. The actual
 * translation happens at the HTTP layer via DomainExceptionFilter.
 *
 * @class DomainException
 * @extends {BadRequestException}
 * @version 1.0.0
 * @since 2025-10-03
 *
 * @example
 * ```typescript
 * // In domain model
 * if (price < 0) {
 *   throw new DomainException('domain.validation.price.negative', { price });
 * }
 *
 * // Will be translated to:
 * // EN: "Price must be non-negative"
 * // ID: "Harga harus tidak negatif"
 * ```
 */
export class DomainException extends BadRequestException {
  /**
   * Translation key for the error message
   * @readonly
   */
  public readonly translationKey: string;

  /**
   * Parameters to be interpolated in the translated message
   * @readonly
   */
  public readonly translationParams: Record<string, any>;

  /**
   * HTTP status code for this exception
   * @readonly
   */
  public readonly statusCode: HttpStatus;

  /**
   * Original error context for debugging
   * @readonly
   */
  public readonly context?: any;

  /**
   * Creates a new DomainException
   *
   * @param {string} translationKey - i18n translation key (e.g., 'domain.validation.price.negative')
   * @param {Record<string, any>} [translationParams={}] - Parameters for message interpolation
   * @param {HttpStatus} [statusCode=HttpStatus.BAD_REQUEST] - HTTP status code
   * @param {any} [context] - Additional context for debugging
   *
   * @example
   * ```typescript
   * throw new DomainException(
   *   'domain.products.insufficient_stock',
   *   { available: 5, requested: 10 },
   *   HttpStatus.BAD_REQUEST
   * );
   * ```
   */
  constructor(
    translationKey: string,
    translationParams: Record<string, any> = {},
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    context?: any,
  ) {
    // Use translation key as temporary message (will be translated by filter)
    super(translationKey);

    this.translationKey = translationKey;
    this.translationParams = translationParams;
    this.statusCode = statusCode;
    this.context = context;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, DomainException.prototype);

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts exception to JSON for API responses
   *
   * @returns {object} JSON representation
   */
  toJSON(): object {
    return {
      name: this.name,
      translationKey: this.translationKey,
      translationParams: this.translationParams,
      statusCode: this.statusCode,
      timestamp: new Date().toISOString(),
      ...(this.context && { context: this.context }),
    };
  }
}

/**
 * Domain Validation Exception
 *
 * Specialized exception for validation errors in domain models.
 * Used when business rules or invariants are violated.
 *
 * @class DomainValidationException
 * @extends {DomainException}
 *
 * @example
 * ```typescript
 * // In ProductModel
 * if (data.price < 0) {
 *   throw new DomainValidationException(
 *     'domain.products.validation.price_negative',
 *     { price: data.price }
 *   );
 * }
 * ```
 */
export class DomainValidationException extends DomainException {
  constructor(
    translationKey: string,
    translationParams: Record<string, any> = {},
    context?: any,
  ) {
    super(translationKey, translationParams, HttpStatus.BAD_REQUEST, context);
    Object.setPrototypeOf(this, DomainValidationException.prototype);
  }
}

/**
 * Domain Not Found Exception
 *
 * Specialized exception for "not found" scenarios in domain layer.
 * Typically used in repositories when querying for entities.
 *
 * @class DomainNotFoundException
 * @extends {DomainException}
 *
 * @example
 * ```typescript
 * // In repository
 * async findByIdOrThrow(id: string): Promise<ProductModel> {
 *   const product = await this.findById(id);
 *   if (!product) {
 *     throw new DomainNotFoundException(
 *       'domain.products.not_found',
 *       { id }
 *     );
 *   }
 *   return product;
 * }
 * ```
 */
export class DomainNotFoundException extends DomainException {
  constructor(
    translationKey: string,
    translationParams: Record<string, any> = {},
    context?: any,
  ) {
    super(translationKey, translationParams, HttpStatus.NOT_FOUND, context);
    Object.setPrototypeOf(this, DomainNotFoundException.prototype);
  }
}

/**
 * Domain Conflict Exception
 *
 * Specialized exception for conflict scenarios (e.g., duplicate records, constraint violations).
 *
 * @class DomainConflictException
 * @extends {DomainException}
 *
 * @example
 * ```typescript
 * // In domain model
 * if (await this.repository.existsBySku(sku)) {
 *   throw new DomainConflictException(
 *     'domain.products.sku_already_exists',
 *     { sku }
 *   );
 * }
 * ```
 */
export class DomainConflictException extends DomainException {
  constructor(
    translationKey: string,
    translationParams: Record<string, any> = {},
    context?: any,
  ) {
    super(translationKey, translationParams, HttpStatus.CONFLICT, context);
    Object.setPrototypeOf(this, DomainConflictException.prototype);
  }
}
