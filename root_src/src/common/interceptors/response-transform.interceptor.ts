import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { StandardResponse, PaginatedResponse } from '../interfaces';

/**
 * Response Message Metadata Key
 *
 * Used by the @ResponseMessage() decorator
 */
export const RESPONSE_MESSAGE_KEY = 'response_message';

/**
 * Skip Transform Metadata Key
 *
 * Used by the @SkipTransform() decorator to bypass transformation
 */
export const SKIP_TRANSFORM_KEY = 'skip_transform';

/**
 * Response Transform Interceptor
 *
 * Global interceptor that transforms all successful HTTP responses
 * into a standardized format. This ensures consistent API responses
 * across the entire application.
 *
 * Features:
 * - Wraps response data in StandardResponse format
 * - Handles paginated responses
 * - Supports custom success messages via @ResponseMessage() decorator
 * - Can be bypassed with @SkipTransform() decorator
 * - Automatically detects HTTP status code
 *
 * @class ResponseTransformInterceptor
 * @implements {NestInterceptor}
 * @version 1.0.0
 * @since 2025-10-10
 *
 * @example Basic usage in main.ts
 * ```typescript
 * app.useGlobalInterceptors(new ResponseTransformInterceptor(new Reflector()));
 * ```
 *
 * @example Controller with custom message
 * ```typescript
 * @ResponseMessage('Product created successfully')
 * @Post()
 * async create(@Body() dto: CreateProductDto) {
 *   return this.productService.create(dto);
 * }
 * ```
 *
 * @example Skip transformation
 * ```typescript
 * @SkipTransform()
 * @Get('raw')
 * async getRawData() {
 *   return { custom: 'format' };
 * }
 * ```
 */
@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T> | PaginatedResponse<any>>
{
  constructor(
    private readonly reflector: Reflector,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Intercepts the request/response cycle and transforms the response
   *
   * @param context - Execution context
   * @param next - Call handler
   * @returns Observable of transformed response
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T> | PaginatedResponse<any>> {
    // Check if transformation should be skipped
    const skipTransform = this.reflector.getAllAndOverride<boolean>(
      SKIP_TRANSFORM_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipTransform) {
      return next.handle();
    }

    // Get custom response message from decorator
    const customMessage = this.reflector.getAllAndOverride<string>(
      RESPONSE_MESSAGE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Get HTTP context
    const httpContext = context.switchToHttp();
    const response = httpContext.getResponse();
    const request = httpContext.getRequest();

    return next.handle().pipe(
      map((data) => {
        // Get current status code (may have been set by controller)
        const statusCode = response.statusCode || HttpStatus.OK;

        // Calculate request time
        const requestTime = this.getRequestTime(request);

        // Get user's preferred language
        const lang = this.getLanguage(request);

        // Transform the response
        return this.transformResponse(
          data,
          statusCode,
          customMessage,
          request.url,
          requestTime,
          lang,
        );
      }),
    );
  }

  /**
   * Transforms raw data into StandardResponse format
   *
   * @param data - Raw response data
   * @param statusCode - HTTP status code
   * @param customMessage - Custom success message (translation key or plain text)
   * @param path - Request path
   * @param requestTime - Request processing time in milliseconds
   * @param lang - User's preferred language
   * @returns Transformed standard response
   */
  private transformResponse(
    data: any,
    statusCode: number,
    customMessage?: string,
    path?: string,
    requestTime?: number,
    lang?: string,
  ): StandardResponse<T> | PaginatedResponse<any> {
    // If data is already in StandardResponse format, return as is
    if (this.isStandardResponse(data)) {
      return data;
    }

    // Check if data is a paginated response
    if (this.isPaginatedResponse(data)) {
      return this.transformPaginatedResponse(
        data,
        statusCode,
        customMessage,
        path,
        requestTime,
        lang,
      );
    }

    // Check if data has a success wrapper (legacy format)
    if (this.isLegacySuccessResponse(data)) {
      return this.transformLegacyResponse(
        data,
        statusCode,
        path,
        requestTime,
        lang,
      );
    }

    // Translate message if it's a translation key
    const translatedMessage =
      this.translateMessage(customMessage, lang) ||
      this.getDefaultMessage(statusCode, lang);

    // Standard transformation
    return {
      success: true,
      statusCode,
      message: translatedMessage,
      data,
      errors: null,
      timestamp: new Date().toISOString(),
      ...(path && { path }),
      ...(requestTime !== undefined && { requestTime }),
    };
  }

  /**
   * Transforms paginated data into PaginatedResponse format
   *
   * @param data - Paginated data
   * @param statusCode - HTTP status code
   * @param customMessage - Custom success message (translation key or plain text)
   * @param path - Request path
   * @param requestTime - Request processing time in milliseconds
   * @param lang - User's preferred language
   * @returns Transformed paginated response
   */
  private transformPaginatedResponse(
    data: any,
    statusCode: number,
    customMessage?: string,
    path?: string,
    requestTime?: number,
    lang?: string,
  ): any {
    // Translate message if it's a translation key
    const translatedMessage =
      this.translateMessage(customMessage, lang) ||
      data.message ||
      this.getDefaultMessage(statusCode, lang);

    // Handle format with 'meta' key
    if (data.meta) {
      return {
        success: true,
        statusCode,
        message: translatedMessage,
        data: data.data,
        meta: data.meta,
        errors: null,
        timestamp: new Date().toISOString(),
        ...(path && { path }),
        ...(requestTime !== undefined && { requestTime }),
      };
    }

    // Handle format with 'pagination' key
    return {
      success: true,
      statusCode,
      message: translatedMessage,
      data: data.data,
      errors: null,
      pagination: data.pagination || {
        page: data.page || 1,
        limit: data.limit || 10,
        total: data.total || 0,
        totalPages: data.totalPages || Math.ceil(data.total / data.limit) || 0,
      },
      timestamp: new Date().toISOString(),
      ...(path && { path }),
      ...(requestTime !== undefined && { requestTime }),
    };
  }

  /**
   * Transforms legacy response format to new standard format
   *
   * @param data - Legacy response data
   * @param statusCode - HTTP status code
   * @param path - Request path
   * @param requestTime - Request processing time in milliseconds
   * @param lang - User's preferred language
   * @returns Transformed standard response
   */
  private transformLegacyResponse(
    data: any,
    statusCode: number,
    path?: string,
    requestTime?: number,
    lang?: string,
  ): StandardResponse<T> {
    return {
      success: data.success !== false,
      statusCode,
      message: data.message || this.getDefaultMessage(statusCode, lang),
      data: data.data,
      errors: null,
      timestamp: new Date().toISOString(),
      ...(path && { path }),
      ...(requestTime !== undefined && { requestTime }),
    };
  }

  /**
   * Checks if data is already in StandardResponse format
   *
   * @param data - Data to check
   * @returns True if data is StandardResponse
   */
  private isStandardResponse(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      'success' in data &&
      'statusCode' in data &&
      'message' in data &&
      ('data' in data || 'errors' in data)
    );
  }

  /**
   * Checks if data is a paginated response
   *
   * @param data - Data to check
   * @returns True if data is paginated
   */
  private isPaginatedResponse(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      ('pagination' in data ||
        'meta' in data ||
        ('page' in data && 'limit' in data && 'total' in data))
    );
  }

  /**
   * Checks if data is in legacy success response format
   *
   * @param data - Data to check
   * @returns True if data is legacy format
   */
  private isLegacySuccessResponse(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      'success' in data &&
      !('statusCode' in data)
    );
  }

  /**
   * Gets default success message based on status code
   *
   * @param statusCode - HTTP status code
   * @param lang - User's preferred language
   * @returns Default message (translated if possible)
   */
  private getDefaultMessage(statusCode: number, lang?: string): string {
    let translationKey: string;

    switch (statusCode) {
      case HttpStatus.OK:
        translationKey = 'common.success.request_successful';
        break;
      case HttpStatus.CREATED:
        translationKey = 'common.success.resource_created';
        break;
      case HttpStatus.ACCEPTED:
        translationKey = 'common.success.request_accepted';
        break;
      case HttpStatus.NO_CONTENT:
        translationKey = 'common.success.no_content';
        break;
      default:
        translationKey = 'common.success.default';
        break;
    }

    // Try to translate, fallback to English if translation not found
    const translated = this.i18n.translate(translationKey, {
      lang: lang || 'en',
    }) as string;

    // If translation returns the key itself, use fallback English message
    if (translated === translationKey) {
      switch (statusCode) {
        case HttpStatus.OK:
          return 'Request successful';
        case HttpStatus.CREATED:
          return 'Resource created successfully';
        case HttpStatus.ACCEPTED:
          return 'Request accepted';
        case HttpStatus.NO_CONTENT:
          return 'No content';
        default:
          return 'Success';
      }
    }

    return translated;
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
   * Translates a message using i18n service
   *
   * @param message - Message to translate (can be translation key or plain text)
   * @param lang - User's preferred language
   * @returns Translated message or original message if not a translation key
   */
  private translateMessage(
    message?: string,
    lang?: string,
  ): string | undefined {
    if (!message) {
      return undefined;
    }

    // If message doesn't look like a translation key (no dots), return as is
    if (!message.includes('.')) {
      return message;
    }

    // Try to translate
    const translated = this.i18n.translate(message, {
      lang: lang || 'en',
    }) as string;

    // If translation returns the key itself, return the original message
    if (translated === message) {
      return message;
    }

    return translated;
  }

  /**
   * Extracts language preference from request
   *
   * @param request - HTTP request
   * @returns Language code
   */
  private getLanguage(request: any): string {
    return (
      (request.headers['x-lang'] as string) ||
      (request.headers['accept-language'] as string)?.split(',')[0] ||
      'en'
    );
  }
}
