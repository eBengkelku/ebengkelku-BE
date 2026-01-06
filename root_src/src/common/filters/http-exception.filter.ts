import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nService } from 'nestjs-i18n';
import { StandardResponse, ErrorDetail } from '../interfaces';
import { ErrorCodes } from '../errors';
import { BaseHttpException } from '../exceptions';
import { isCustomBadRequest } from '../../utils/custom-bad-request.util';

/**
 * HTTP Exception Filter
 *
 * Handles standard NestJS HttpException and custom BaseHttpException.
 * Transforms these exceptions into standardized error response format.
 *
 * This filter catches:
 * - HttpException (NestJS built-in)
 * - BaseHttpException (custom)
 * - NotFoundException
 * - ConflictException
 * - etc.
 *
 * @class HttpExceptionFilter
 * @implements {ExceptionFilter}
 * @version 1.0.0
 * @since 2025-10-10
 *
 * @example Registration in main.ts
 * ```typescript
 * app.useGlobalFilters(
 *   new ValidationExceptionFilter(i18n),
 *   new HttpExceptionFilter(i18n),
 *   new GlobalExceptionFilter(i18n),
 * );
 * ```
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  /**
   * Catches and handles HTTP exceptions
   *
   * @param exception - The caught HTTP exception
   * @param host - Execution context
   */
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Get user's preferred language
    const lang = this.getLanguage(request);

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
   * Builds standardized error response from HTTP exception
   *
   * @param exception - The HTTP exception
   * @param statusCode - HTTP status code
   * @param path - Request path
   * @param lang - User's preferred language
   * @param request - HTTP request object
   * @returns Standard error response
   */
  private buildErrorResponse(
    exception: HttpException,
    statusCode: number,
    path: string,
    lang: string,
    request?: any,
  ): StandardResponse {
    // Handle custom BaseHttpException
    if (exception instanceof BaseHttpException) {
      return this.buildCustomExceptionResponse(
        exception,
        statusCode,
        path,
        lang,
        request,
      );
    }

    // Handle standard HttpException
    const exceptionResponse: any = exception.getResponse();

    // Check if it's a custom bad request from utility
    if (isCustomBadRequest(exceptionResponse)) {
      return this.buildCustomBadRequestResponse(
        exceptionResponse,
        path,
        request,
      );
    }

    const errors = this.transformHttpExceptionToErrors(
      exceptionResponse,
      statusCode,
    );

    // Calculate request time
    const requestTime = this.getRequestTime(request);

    return {
      success: false,
      statusCode,
      message: this.getMainMessage(exceptionResponse, statusCode),
      data: null,
      errors,
      timestamp: new Date().toISOString(),
      path,
      ...(requestTime !== undefined && { requestTime }),
    };
  }

  /**
   * Builds response from custom bad request utility
   *
   * @param customResponse - Custom bad request response object
   * @param path - Request path
   * @param request - HTTP request object
   * @returns Standard error response with custom format
   */
  private buildCustomBadRequestResponse(
    customResponse: any,
    path: string,
    request?: any,
  ): StandardResponse {
    // Calculate request time
    const requestTime = this.getRequestTime(request);

    // Return custom format: errors as object (not array, no field_0 wrapper)
    return {
      success: false,
      statusCode: customResponse.statusCode, // Custom status code dari controller
      message: customResponse.message, // Custom message dari controller
      data: null,
      errors: customResponse.errors, // { code, message } - tanpa field_0
      timestamp: new Date().toISOString(),
      path,
      ...(requestTime !== undefined && { requestTime }),
    };
  }

  /**
   * Builds response from custom BaseHttpException
   *
   * @param exception - BaseHttpException instance
   * @param statusCode - HTTP status code
   * @param path - Request path
   * @param lang - User's preferred language
   * @returns Standard error response
   */
  private buildCustomExceptionResponse(
    exception: BaseHttpException,
    statusCode: number,
    path: string,
    lang: string,
    request?: any,
  ): StandardResponse {
    // Calculate request time
    const requestTime = this.getRequestTime(request);

    // If exception already has errors array, use it
    if (exception.errors && exception.errors.length > 0) {
      return {
        success: false,
        statusCode,
        message: this.translateMessage(exception, lang),
        data: null,
        errors: exception.errors,
        timestamp: new Date().toISOString(),
        path,
        ...(requestTime !== undefined && { requestTime }),
      };
    }

    // Otherwise, create error detail from exception
    const errorDetail: ErrorDetail = {
      code: exception.errorCode,
      message: this.translateMessage(exception, lang),
      ...(exception.context && { context: exception.context }),
    };

    return {
      success: false,
      statusCode,
      message: this.translateMessage(exception, lang),
      data: null,
      errors: [errorDetail],
      timestamp: new Date().toISOString(),
      path,
      ...(requestTime !== undefined && { requestTime }),
    };
  }

  /**
   * Transforms standard HttpException response to ErrorDetail array
   *
   * @param exceptionResponse - Exception response object
   * @param statusCode - HTTP status code
   * @returns Array of error details
   */
  private transformHttpExceptionToErrors(
    exceptionResponse: any,
    statusCode: number,
  ): ErrorDetail[] {
    // If response is a string
    if (typeof exceptionResponse === 'string') {
      return [
        {
          code: this.getErrorCodeFromStatus(statusCode),
          message: exceptionResponse,
        },
      ];
    }

    // If response has message array (e.g., from ValidationPipe)
    if (Array.isArray(exceptionResponse.message)) {
      return exceptionResponse.message.map((msg: any) => ({
        code: this.getErrorCodeFromStatus(statusCode),
        message: typeof msg === 'string' ? msg : JSON.stringify(msg),
      }));
    }

    // If response has message string
    if (exceptionResponse.message) {
      return [
        {
          code: this.getErrorCodeFromStatus(statusCode),
          message: exceptionResponse.message,
        },
      ];
    }

    // Fallback
    return [
      {
        code: this.getErrorCodeFromStatus(statusCode),
        message: exceptionResponse.error || 'An error occurred',
      },
    ];
  }

  /**
   * Gets main error message from exception response
   *
   * @param exceptionResponse - Exception response object
   * @param statusCode - HTTP status code
   * @returns Main error message
   */
  private getMainMessage(exceptionResponse: any, statusCode: number): string {
    // If response is string
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    // If response has error property
    if (exceptionResponse.error) {
      return exceptionResponse.error;
    }

    // If response has message
    if (exceptionResponse.message) {
      // If message is array, join them
      if (Array.isArray(exceptionResponse.message)) {
        return exceptionResponse.message.join(', ');
      }
      return exceptionResponse.message;
    }

    // Fallback to default message
    return this.getDefaultMessageForStatus(statusCode);
  }

  /**
   * Gets error code based on HTTP status code
   *
   * @param statusCode - HTTP status code
   * @returns Error code
   */
  private getErrorCodeFromStatus(statusCode: number): string {
    const codeMap: Record<number, string> = {
      400: ErrorCodes.BAD_REQUEST,
      401: ErrorCodes.UNAUTHORIZED,
      403: ErrorCodes.FORBIDDEN,
      404: ErrorCodes.NOT_FOUND,
      405: ErrorCodes.METHOD_NOT_ALLOWED,
      408: ErrorCodes.REQUEST_TIMEOUT,
      409: ErrorCodes.CONFLICT,
      410: ErrorCodes.GONE,
      413: ErrorCodes.PAYLOAD_TOO_LARGE,
      415: ErrorCodes.UNSUPPORTED_MEDIA_TYPE,
      429: ErrorCodes.TOO_MANY_REQUESTS,
      500: ErrorCodes.INTERNAL_SERVER_ERROR,
      503: ErrorCodes.SERVICE_UNAVAILABLE,
    };

    return codeMap[statusCode] || ErrorCodes.INTERNAL_SERVER_ERROR;
  }

  /**
   * Gets default error message for HTTP status code
   *
   * @param statusCode - HTTP status code
   * @returns Default error message
   */
  private getDefaultMessageForStatus(statusCode: number): string {
    const messages: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      408: 'Request Timeout',
      409: 'Conflict',
      410: 'Gone',
      413: 'Payload Too Large',
      415: 'Unsupported Media Type',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
    };

    return messages[statusCode] || 'An error occurred';
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

    return exception.message || 'An error occurred';
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
    if (request && request.startTime) {
      return Date.now() - request.startTime;
    }
    return undefined;
  }
}
