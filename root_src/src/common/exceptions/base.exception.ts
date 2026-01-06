import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../errors';
import { ErrorDetail } from '../interfaces';

/**
 * Base HTTP Exception
 *
 * Base class for all custom HTTP exceptions in the application.
 * Extends NestJS HttpException with error code support and standardized structure.
 *
 * @class BaseHttpException
 * @extends HttpException
 * @version 1.0.0
 * @since 2025-10-10
 *
 * @example
 * ```typescript
 * throw new BaseHttpException(
 *   'Product not found',
 *   HttpStatus.NOT_FOUND,
 *   ErrorCodes.NOT_FOUND,
 *   { productId: '123' }
 * );
 * ```
 */
export class BaseHttpException extends HttpException {
  /**
   * Standardized error code for programmatic handling
   */
  public readonly errorCode: ErrorCode | string;

  /**
   * Translation key for i18n support
   */
  public readonly translationKey?: string;

  /**
   * Parameters for i18n translation
   */
  public readonly translationParams?: Record<string, any>;

  /**
   * Additional context about the error
   */
  public readonly context?: Record<string, any>;

  /**
   * Array of error details (for multiple errors)
   */
  public readonly errors?: ErrorDetail[];

  /**
   * Creates a new BaseHttpException
   *
   * @param message - Human-readable error message
   * @param statusCode - HTTP status code
   * @param errorCode - Standardized error code
   * @param context - Additional error context
   * @param translationKey - i18n translation key
   * @param translationParams - Parameters for translation
   */
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
    errorCode: ErrorCode | string = 'ERR_1500',
    context?: Record<string, any>,
    translationKey?: string,
    translationParams?: Record<string, any>,
  ) {
    super(message, statusCode);

    this.errorCode = errorCode;
    this.context = context;
    this.translationKey = translationKey;
    this.translationParams = translationParams;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, BaseHttpException.prototype);

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Converts exception to JSON for API responses
   */
  toJSON(): object {
    return {
      name: this.constructor.name,
      message: this.message,
      statusCode: this.getStatus(),
      errorCode: this.errorCode,
      timestamp: new Date().toISOString(),
      ...(this.context && { context: this.context }),
      ...(this.translationKey && { translationKey: this.translationKey }),
      ...(this.translationParams && {
        translationParams: this.translationParams,
      }),
      ...(this.errors && { errors: this.errors }),
    };
  }

  /**
   * Sets multiple error details
   *
   * @param errors - Array of error details
   */
  setErrors(errors: ErrorDetail[]): this {
    (this as any).errors = errors;
    return this;
  }

  /**
   * Adds a single error detail
   *
   * @param error - Error detail to add
   */
  addError(error: ErrorDetail): this {
    if (!this.errors) {
      (this as any).errors = [];
    }
    this.errors!.push(error);
    return this;
  }
}
