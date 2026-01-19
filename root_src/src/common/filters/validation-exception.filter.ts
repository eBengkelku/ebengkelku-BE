import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nService, I18nValidationException } from 'nestjs-i18n';
import {
  StandardResponse,
  ErrorDetail,
  ValidationErrorDetail,
} from '../interfaces';
import { ErrorCodes } from '../errors';
import { ValidationException } from '../exceptions';
import { isCustomBadRequest } from '../../utils/custom-bad-request.util';

/**
 * Validation Exception Filter
 *
 * Handles validation errors from:
 * - class-validator (via ValidationPipe)
 * - nestjs-i18n (I18nValidationException)
 * - Custom ValidationException
 *
 * Transforms validation errors into standardized error response format
 * with detailed field-level error information.
 *
 * @class ValidationExceptionFilter
 * @implements {ExceptionFilter}
 * @version 1.0.0
 * @since 2025-10-10
 *
 * @example Registration in main.ts
 * ```typescript
 * app.useGlobalFilters(
 *   new ValidationExceptionFilter(i18n),
 *   // ... other filters
 * );
 * ```
 */
@Catch(ValidationException, I18nValidationException, BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  /**
   * Catches and handles validation exceptions
   *
   * @param exception - The caught validation exception
   * @param host - Execution context
   */
  catch(
    exception:
      | ValidationException
      | I18nValidationException
      | BadRequestException,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Get user's preferred language
    const lang = this.getLanguage(request);

    // Check if it's a custom bad request - handle it with custom format
    if (exception instanceof BadRequestException) {
      const exceptionResponse: any = exception.getResponse();
      if (isCustomBadRequest(exceptionResponse)) {
        // Handle custom bad request with special format and i18n support
        const requestTime = this.getRequestTime(request);

        // Translate message if it's a translation key
        const translatedMessage = this.translateIfKey(
          exceptionResponse.message,
          lang,
          exceptionResponse.translationParams,
        );

        // Translate error message if it's a translation key
        const translatedErrorMessage = this.translateIfKey(
          exceptionResponse.errors.message,
          lang,
          exceptionResponse.translationParams,
        );

        const customResponse: StandardResponse = {
          success: false,
          statusCode: exceptionResponse.statusCode, // Custom status code
          message: translatedMessage, // Translated message
          data: null,
          errors: {
            code: exceptionResponse.errors.code,
            message: translatedErrorMessage, // Translated error message
          } as any, // Type assertion for custom error format
          timestamp: new Date().toISOString(),
          path: request.url,
          ...(requestTime !== undefined && { requestTime }),
        };

        // Send custom response with HTTP 400 (BadRequest)
        response.status(400).json(customResponse);
        return;
      }
    }

    // Get status code
    const statusCode = exception.getStatus();

    // Build error response
    const errorResponse = this.buildErrorResponse(
      exception,
      statusCode,
      request.url,
      lang,
      request,
    );

    // Send response
    response.status(statusCode).json(errorResponse);
  }

  /**
   * Builds standardized error response from validation exception
   *
   * @param exception - The validation exception
   * @param statusCode - HTTP status code
   * @param path - Request path
   * @param lang - User's preferred language
   * @param request - HTTP request object
   * @returns Standard error response
   */
  private buildErrorResponse(
    exception:
      | ValidationException
      | I18nValidationException
      | BadRequestException,
    statusCode: number,
    path: string,
    lang: string,
    request?: any,
  ): StandardResponse {
    let errors: Record<string, ValidationErrorDetail> | ErrorDetail[];
    let message: string;

    // Handle custom ValidationException
    if (exception instanceof ValidationException) {
      errors = this.transformErrorsToObject(exception.errors || []);
      message = this.translateMessage(exception, lang);
    }
    // Handle I18nValidationException
    else if (exception instanceof I18nValidationException) {
      errors = this.transformI18nValidationErrorsToObject(exception, lang);
      message =
        (this.i18n.translate('common.validation.failed', { lang }) as string) ||
        'Validation failed';
    }
    // Handle generic BadRequestException
    else {
      const errorArray = this.transformBadRequestErrors(exception, lang);
      errors = this.transformErrorsToObject(errorArray);
      message = exception.message || 'Validation failed';
    }

    // Calculate request time
    const requestTime = this.getRequestTime(request);

    return {
      success: false,
      statusCode,
      message,
      data: null,
      errors,
      timestamp: new Date().toISOString(),
      path,
      ...(requestTime !== undefined && { requestTime }),
    };
  }

  /**
   * Transforms I18nValidationException errors to object format
   *
   * @param exception - I18nValidationException
   * @param lang - User's preferred language
   * @returns Object with property names as keys
   */
  private transformI18nValidationErrorsToObject(
    exception: I18nValidationException,
    lang: string,
  ): Record<string, ValidationErrorDetail> {
    const errors = exception.errors || [];
    const errorObject: Record<string, ValidationErrorDetail> = {};

    errors.forEach((error: any) => {
      const constraints = error.constraints || {};
      // Prioritize isString error if it exists (for type validation)
      const constraintKeys = Object.keys(constraints);
      const firstConstraintKey = constraintKeys.includes('isString')
        ? 'isString'
        : constraintKeys[0];
      const firstConstraintValue = constraints[firstConstraintKey];

      // Get original message (usually in English)
      const originalMessage =
        typeof firstConstraintValue === 'string'
          ? firstConstraintValue
          : error.property + ' validation failed';

      // Get translated context message
      let contextMessage: string | undefined;
      if (
        typeof firstConstraintValue === 'string' &&
        firstConstraintValue.includes('.')
      ) {
        contextMessage = this.i18n.translate(firstConstraintValue, {
          lang,
          args: error.contexts?.[firstConstraintKey],
        }) as string;
      } else {
        contextMessage = originalMessage;
      }

      // Build detailed context object
      const context = this.buildValidationContext(
        firstConstraintKey,
        error.contexts?.[firstConstraintKey],
        error.value,
      );

      // Add to error object using property name as key (without the property field)
      errorObject[error.property] = {
        value: error.value,
        code: this.getValidationErrorCode(firstConstraintKey),
        message: originalMessage,
        ...(contextMessage &&
          contextMessage !== originalMessage && {
            context_message: contextMessage,
          }),
        ...(context && Object.keys(context).length > 0 && { context }),
      };
    });

    return errorObject;
  }

  /**
   * Builds detailed validation context based on constraint type
   *
   * @param constraint - Validation constraint name
   * @param contexts - Context from validator
   * @param value - Invalid value
   * @returns Context object with relevant details
   */
  private buildValidationContext(
    constraint: string,
    contexts: any,
    value: any,
  ): Record<string, any> {
    const context: Record<string, any> = {};

    switch (constraint) {
      case 'minLength':
      case 'maxLength':
        if (contexts?.minLength !== undefined) {
          context.minLength = contexts.minLength;
        }
        if (contexts?.maxLength !== undefined) {
          context.maxLength = contexts.maxLength;
        }
        if (value !== undefined && typeof value === 'string') {
          context.currentLength = value.length;
        }
        break;

      case 'min':
      case 'max':
        if (contexts?.min !== undefined) {
          context.min = contexts.min;
        }
        if (contexts?.max !== undefined) {
          context.max = contexts.max;
        }
        if (value !== undefined) {
          context.actualValue = value;
        }
        break;

      case 'arrayMinSize':
      case 'arrayMaxSize':
        if (contexts?.minSize !== undefined) {
          context.minSize = contexts.minSize;
        }
        if (contexts?.maxSize !== undefined) {
          context.maxSize = contexts.maxSize;
        }
        if (Array.isArray(value)) {
          context.currentSize = value.length;
        }
        break;

      case 'isEnum':
        if (contexts?.enum) {
          context.allowedValues = contexts.enum;
        }
        if (value !== undefined) {
          context.providedValue = value;
        }
        break;

      default:
        // Include all context data for other constraints
        if (contexts && Object.keys(contexts).length > 0) {
          Object.assign(context, contexts);
        }
        break;
    }

    return context;
  }

  /**
   * Transforms BadRequestException errors to ErrorDetail format
   *
   * @param exception - BadRequestException
   * @param lang - User's preferred language
   * @returns Array of error details
   */
  private transformBadRequestErrors(
    exception: BadRequestException,
    lang: string,
  ): ErrorDetail[] {
    const exceptionResponse: any = exception.getResponse();

    // If response has validation errors array
    if (
      exceptionResponse &&
      Array.isArray(exceptionResponse.message) &&
      exceptionResponse.message.length > 0
    ) {
      // Check if it's class-validator format
      if (typeof exceptionResponse.message[0] === 'object') {
        return exceptionResponse.message.map((error: any) => {
          const constraints = error.constraints || {};
          const firstConstraintKey = Object.keys(constraints)[0];
          const firstConstraintValue = constraints[firstConstraintKey];

          // Build detailed context
          const context = this.buildValidationContext(
            firstConstraintKey,
            error.contexts?.[firstConstraintKey],
            error.value,
          );

          // Get translated message if available
          let contextMessage: string | undefined;
          if (
            typeof firstConstraintValue === 'string' &&
            firstConstraintValue.includes('.')
          ) {
            contextMessage = this.i18n.translate(firstConstraintValue, {
              lang,
              args: error.contexts?.[firstConstraintKey],
            }) as string;
          }

          return {
            property: error.property,
            value: error.value,
            code: this.getValidationErrorCode(firstConstraintKey),
            message: firstConstraintValue || 'Validation failed',
            ...(contextMessage &&
              contextMessage !== firstConstraintValue && {
                context_message: contextMessage,
              }),
            ...(context && Object.keys(context).length > 0 && { context }),
          };
        });
      }

      // If it's string array
      return exceptionResponse.message.map((msg: string) => ({
        code: ErrorCodes.VALIDATION_FAILED,
        message: msg,
      }));
    }

    // Generic error
    return [
      {
        code: ErrorCodes.BAD_REQUEST,
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : exceptionResponse?.message || exception.message,
      },
    ];
  }

  /**
   * Gets appropriate error code based on validation constraint
   *
   * @param constraint - Constraint name from class-validator
   * @returns Error code in descriptive format
   */
  private getValidationErrorCode(constraint?: string): string {
    if (!constraint) {
      return 'VALIDATION_FAILED';
    }

    // Map class-validator constraints to descriptive codes
    const codeMap: Record<string, string> = {
      // Required fields
      isNotEmpty: 'VALIDATION_REQUIRED',
      isDefined: 'VALIDATION_REQUIRED',

      // String validations
      minLength: 'VALIDATION_MIN_LENGTH',
      maxLength: 'VALIDATION_MAX_LENGTH',
      isLength: 'VALIDATION_LENGTH',

      // Number validations
      min: 'VALIDATION_MIN_VALUE',
      max: 'VALIDATION_MAX_VALUE',
      isPositive: 'VALIDATION_POSITIVE',
      isNegative: 'VALIDATION_NEGATIVE',
      isInt: 'VALIDATION_INTEGER',
      isDecimal: 'VALIDATION_DECIMAL',

      // Format validations
      isEmail: 'VALIDATION_EMAIL_FORMAT',
      isUrl: 'VALIDATION_URL_FORMAT',
      isUUID: 'VALIDATION_UUID_FORMAT',
      isDate: 'VALIDATION_DATE_FORMAT',
      isDateString: 'VALIDATION_DATE_STRING',
      isJSON: 'VALIDATION_JSON_FORMAT',

      // Enum validations
      isEnum: 'VALIDATION_ENUM',
      isIn: 'VALIDATION_IN',

      // Array validations
      arrayNotEmpty: 'VALIDATION_ARRAY_NOT_EMPTY',
      arrayMinSize: 'VALIDATION_ARRAY_MIN_SIZE',
      arrayMaxSize: 'VALIDATION_ARRAY_MAX_SIZE',
      arrayUnique: 'VALIDATION_ARRAY_UNIQUE',

      // Boolean
      isBoolean: 'VALIDATION_BOOLEAN',

      // String types
      isString: 'VALIDATION_STRING',
      isAlpha: 'VALIDATION_ALPHA',
      isAlphanumeric: 'VALIDATION_ALPHANUMERIC',
      isAscii: 'VALIDATION_ASCII',

      // Number types
      isNumber: 'VALIDATION_NUMBER',
      isNumberString: 'VALIDATION_NUMBER_STRING',

      // Other common validators
      matches: 'VALIDATION_PATTERN',
      contains: 'VALIDATION_CONTAINS',
      notContains: 'VALIDATION_NOT_CONTAINS',
      equals: 'VALIDATION_EQUALS',
      notEquals: 'VALIDATION_NOT_EQUALS',
    };

    return codeMap[constraint] || `VALIDATION_${constraint.toUpperCase()}`;
  }

  /**
   * Translates exception message using i18n
   *
   * @param exception - Exception with translation key
   * @param lang - User's preferred language
   * @returns Translated message
   */
  private translateMessage(exception: any, lang: string): string {
    if (exception.translationKey) {
      return this.i18n.translate(exception.translationKey, {
        lang,
        args: exception.translationParams,
      }) as string;
    }

    return exception.message || 'Validation failed';
  }

  /**
   * Transforms error array to object format (using property as key)
   *
   * @param errors - Array of error details
   * @returns Object with property names as keys
   */
  private transformErrorsToObject(
    errors: ErrorDetail[],
  ): Record<string, ValidationErrorDetail> {
    const errorObject: Record<string, ValidationErrorDetail> = {};

    errors.forEach((error) => {
      // Use property name as key, or use 'field_<index>' if property is missing
      const key = error.property || `field_${Object.keys(errorObject).length}`;

      // Omit property field when adding to object
      const { property, ...errorWithoutProperty } = error;

      errorObject[key] = errorWithoutProperty;
    });

    return errorObject;
  }

  /**
   * Extracts language preference from request
   *
   * @param request - HTTP request
   * @returns Language code
   */
  private getLanguage(request: Request): string {
    return (
      (request.headers['x-lang'] as string) ||
      (request.headers['accept-language'] as string)?.split(',')[0] ||
      'en'
    );
  }

  /**
   * Gets request processing time from request object
   *
   * @param request - HTTP request object
   * @returns Request time in milliseconds or undefined
   */
  private getRequestTime(request: any): number | undefined {
    if (request.startTime) {
      return Date.now() - request.startTime;
    }
    return undefined;
  }

  /**
   * Translates text if it's a translation key, otherwise returns as-is
   *
   * @param text - Text or translation key
   * @param lang - Language code
   * @param params - Translation parameters
   * @returns Translated text or original text
   */
  private translateIfKey(
    text: string,
    lang: string,
    params?: Record<string, any>,
  ): string {
    // Check if it's a translation key (contains dots like 'products.errors.not_found')
    if (text && text.includes('.')) {
      const translated = this.i18n.translate(text, {
        lang,
        args: params,
      }) as string;

      // If translation returned the key itself, it means translation not found
      // Return original text in that case
      return translated !== text ? translated : text;
    }

    // Return as-is if not a translation key
    return text;
  }
}
