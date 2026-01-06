import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import { StandardResponse, ErrorDetail } from '../interfaces';
import { ErrorCodes } from '../errors';

/**
 * Global Exception Filter
 *
 * Catch-all exception filter that handles any unhandled exceptions
 * in the application. This is the last line of defense and ensures
 * that all errors are properly formatted and logged.
 *
 * This filter catches:
 * - Unhandled exceptions
 * - System errors
 * - Unknown errors
 *
 * More specific filters should be registered before this one to handle
 * specific exception types (ValidationException, HttpException, etc.)
 *
 * @class GlobalExceptionFilter
 * @implements {ExceptionFilter}
 * @version 1.0.0
 * @since 2025-10-10
 *
 * @example Registration in main.ts
 * ```typescript
 * app.useGlobalFilters(
 *   new ValidationExceptionFilter(i18n),
 *   new HttpExceptionFilter(i18n),
 *   new GlobalExceptionFilter(i18n), // Last
 * );
 * ```
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly i18n?: I18nService) {}

  /**
   * Catches and handles any exception
   *
   * @param exception - The caught exception
   * @param host - Execution context
   */
  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Log the exception for debugging
    this.logException(exception, request);

    // Determine status code
    const statusCode = this.getStatusCode(exception);

    // Get user's preferred language
    const lang = this.getLanguage(request);

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
   * Builds standardized error response
   *
   * @param exception - The exception
   * @param statusCode - HTTP status code
   * @param path - Request path
   * @param lang - User's preferred language
   * @param request - HTTP request object
   * @returns Standard error response
   */
  private buildErrorResponse(
    exception: any,
    statusCode: number,
    path: string,
    lang: string,
    request?: any,
  ): StandardResponse {
    const errorDetail: ErrorDetail = {
      code:
        exception?.errorCode ||
        exception?.code ||
        ErrorCodes.INTERNAL_SERVER_ERROR,
      message: this.getErrorMessage(exception, lang),
      ...(exception?.context && { context: exception.context }),
    };

    // Calculate request time
    const requestTime = this.getRequestTime(request);

    return {
      success: false,
      statusCode,
      message: this.getMainMessage(exception, statusCode, lang),
      data: null,
      errors: [errorDetail],
      timestamp: new Date().toISOString(),
      path,
      ...(requestTime !== undefined && { requestTime }),
      // Include stack trace in development
      ...(process.env.NODE_ENV !== 'production' &&
        exception?.stack && {
          stack: exception.stack,
        }),
    };
  }

  /**
   * Gets HTTP status code from exception
   *
   * @param exception - The exception
   * @returns HTTP status code
   */
  private getStatusCode(exception: any): number {
    if (!exception) {
      return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    if (exception.status) {
      return exception.status;
    }

    if (exception.statusCode) {
      return exception.statusCode;
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Gets main error message
   *
   * @param exception - The exception
   * @param statusCode - HTTP status code
   * @param lang - User's preferred language
   * @returns Main error message
   */
  private getMainMessage(
    exception: any,
    statusCode: number,
    lang: string,
  ): string {
    // Try to get translated message
    if (this.i18n && exception?.translationKey) {
      return this.i18n.translate(exception.translationKey, {
        lang,
        args: exception.translationParams,
      }) as string;
    }

    // Use exception message if available
    if (exception?.message) {
      return exception.message;
    }

    // Fallback to default message based on status code
    return this.getDefaultMessage(statusCode, lang);
  }

  /**
   * Gets detailed error message
   *
   * @param exception - The exception
   * @param lang - User's preferred language
   * @returns Error message
   */
  private getErrorMessage(exception: any, lang: string): string {
    if (this.i18n && exception?.translationKey) {
      return this.i18n.translate(exception.translationKey, {
        lang,
        args: exception.translationParams,
      }) as string;
    }

    return (
      exception?.message ||
      exception?.error?.message ||
      'An unexpected error occurred'
    );
  }

  /**
   * Gets default error message based on status code
   *
   * @param statusCode - HTTP status code
   * @param lang - User's preferred language
   * @returns Default error message
   */
  private getDefaultMessage(statusCode: number, _lang: string): string {
    const messages: Record<number, string> = {
      400: 'Bad request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not found',
      409: 'Conflict',
      422: 'Unprocessable entity',
      500: 'Internal server error',
      502: 'Bad gateway',
      503: 'Service unavailable',
    };

    return messages[statusCode] || 'An error occurred';
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
   * Logs the exception for debugging
   *
   * @param exception - The exception
   * @param request - HTTP request
   */
  private logException(exception: any, request: Request): void {
    const statusCode = this.getStatusCode(exception);

    // Log error with context
    const logMessage = {
      message: exception?.message || 'Unhandled exception',
      statusCode,
      path: request.url,
      method: request.method,
      errorCode: exception?.errorCode || exception?.code,
      ...(exception?.context && { context: exception.context }),
    };

    // Use appropriate log level based on status code
    if (statusCode >= 500) {
      this.logger.error(logMessage, exception?.stack);
    } else if (statusCode >= 400) {
      this.logger.warn(logMessage);
    } else {
      this.logger.log(logMessage);
    }
  }

  /**
   * Gets request processing time from request object
   *
   * @param request - HTTP request object
   * @returns Request time in milliseconds or undefined
   */
  private getRequestTime(request: any): number | undefined {
    if (request && request.startTime) {
      return Date.now() - request.startTime;
    }
    return undefined;
  }
}
