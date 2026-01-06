import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { Response, Request } from 'express';
import {
  DomainException,
  DomainValidationException,
  DomainNotFoundException,
  DomainConflictException,
} from '../domain/exceptions/domain.exception';
import { ErrorDetail } from '@/common/interfaces/error-detail.interface';

/**
 * Domain Exception Filter
 *
 * Global exception filter that catches all DomainException instances and
 * translates them to user's preferred language before sending the response.
 * Uses standardized error response format.
 *
 * This filter enables i18n support for domain models while keeping them pure
 * (no I18nService dependency in domain layer).
 *
 * @class DomainExceptionFilter
 * @implements {ExceptionFilter}
 * @version 2.0.0
 * @since 2025-10-10
 *
 * @example
 * ```typescript
 * // In main.ts or app.module.ts
 * app.useGlobalFilters(new DomainExceptionFilter(i18nService));
 *
 * // Domain model throws:
 * throw new DomainValidationException('domain.products.price_negative', { price: -10 });
 *
 * // Filter translates to standardized format:
 * {
 *   success: false,
 *   message: "Price must be non-negative",
 *   errors: [{
 *     code: "DOMAIN_VALIDATION_ERROR",
 *     message: "Price must be non-negative",
 *     context: { price: -10 }
 *   }],
 *   statusCode: 400,
 *   timestamp: "2025-10-10T12:00:00.000Z",
 *   path: "/api/products"
 * }
 * ```
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  constructor(private readonly i18n: I18nService) {}

  /**
   * Catches and handles domain exceptions
   *
   * @param {DomainException} exception - The caught domain exception
   * @param {ArgumentsHost} host - Execution context
   */
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = exception.statusCode;
    const lang = this.getLanguage(request);

    // Translate the exception message
    const translatedMessage = this.i18n.translate(exception.translationKey, {
      lang,
      args: exception.translationParams,
    }) as string;

    // Build error detail
    const errorDetail: ErrorDetail = {
      code: this.getErrorCode(exception),
      message: translatedMessage,
      ...(exception.translationParams &&
        Object.keys(exception.translationParams).length > 0 && {
          context: exception.translationParams,
        }),
    };

    // Calculate request time
    const requestTime = this.getRequestTime(request);

    // Build standardized error response
    const errorResponse = {
      success: false,
      message: translatedMessage,
      data: null,
      errors: [errorDetail],
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(requestTime !== undefined && { requestTime }),
    };

    // Log error for debugging
    this.logger.warn({
      message: translatedMessage,
      translationKey: exception.translationKey,
      statusCode,
      path: request.url,
      method: request.method,
      errorCode: errorDetail.code,
    });

    // Send response
    response.status(statusCode).json(errorResponse);
  }

  /**
   * Extracts language preference from request
   *
   * Priority: x-lang header > accept-language header > fallback (en)
   *
   * @private
   * @param {Request} request - HTTP request object
   * @returns {string} Language code (e.g., 'en', 'id')
   */
  private getLanguage(request: Request): string {
    return (
      (request.headers['x-lang'] as string) ||
      (request.headers['accept-language'] as string)?.split(',')[0] ||
      'en'
    );
  }

  /**
   * Gets standardized error code from exception type
   *
   * @private
   * @param {DomainException} exception - The domain exception
   * @returns {string} Standardized error code
   */
  private getErrorCode(exception: DomainException): string {
    if (exception instanceof DomainValidationException) {
      return 'DOMAIN_VALIDATION_ERROR';
    }
    if (exception instanceof DomainNotFoundException) {
      return 'DOMAIN_NOT_FOUND';
    }
    if (exception instanceof DomainConflictException) {
      return 'DOMAIN_CONFLICT';
    }
    return 'DOMAIN_ERROR';
  }

  /**
   * Gets request processing time from request object
   *
   * @private
   * @param {Request} request - HTTP request object
   * @returns {number | undefined} Request time in milliseconds or undefined
   */
  private getRequestTime(request: any): number | undefined {
    if (request.startTime) {
      return Date.now() - request.startTime;
    }
    return undefined;
  }
}

/**
 * Create Domain Exception Filter Provider
 *
 * Factory function to create the filter with I18nService injection.
 * Use this in module providers array for proper DI.
 *
 * @returns {object} NestJS provider configuration
 *
 * @example
 * ```typescript
 * // In common.module.ts
 * import { createDomainExceptionFilterProvider } from '@/common/domain';
 *
 * @Module({
 *   providers: [
 *     createDomainExceptionFilterProvider(),
 *   ],
 * })
 * export class CommonModule {}
 * ```
 */
export function createDomainExceptionFilterProvider() {
  return {
    provide: 'APP_FILTER',
    useFactory: (i18nService: I18nService) => {
      return new DomainExceptionFilter(i18nService);
    },
    inject: [I18nService],
  };
}
