import { BadRequestException } from '@nestjs/common';

/**
 * Custom BadRequest Utility
 *
 * Utility for creating custom BadRequest exceptions with customizable statusCode and message
 * as agreed upon with the frontend team.
 *
 * Response format:
 * {
 *   success: false,
 *   statusCode: <custom_status_code>,
 *   message: <custom_message>,
 *   data: null,
 *   errors: {
 *     code: <error_code>,
 *     message: <error_message>
 *   },
 *   timestamp: "...",
 *   path: "...",
 *   requestTime: ...
 * }
 *
 * @module CustomBadRequestUtil
 * @version 1.0.0
 * @since 2025-10-13
 */

/**
 * Interface for custom error response options
 */
export interface CustomBadRequestOptions {
  /**
   * Custom status code (can differ from HTTP status code)
   */
  statusCode: number;

  /**
   * Custom message for the response (can be translation key or plain text)
   */
  message: string;

  /**
   * Error code for error identification
   */
  errorCode: string;

  /**
   * Detailed error message (optional, defaults to message, can be translation key)
   */
  errorMessage?: string;

  /**
   * Translation parameters for i18n (optional)
   */
  translationParams?: Record<string, any>;
}

/**
 * Throw custom BadRequest exception with the agreed-upon format
 *
 * Supports i18n by accepting translation keys as message/errorMessage.
 * The filter will detect and translate these keys based on x-lang header.
 *
 * @param {CustomBadRequestOptions} options - Custom error options
 * @throws {BadRequestException} BadRequest exception with custom format
 *
 * @example
 * ```typescript
 * // In controller - with translation key
 * import { throwCustomBadRequest } from '@/utils/custom-bad-request.util';
 *
 * if (!product) {
 *   throwCustomBadRequest({
 *     statusCode: 4001,
 *     message: 'products.errors.not_found',  // Translation key
 *     errorCode: 'PRODUCT_NOT_FOUND',
 *     errorMessage: 'products.errors.not_found_detail',  // Translation key
 *     translationParams: { id: productId }  // For interpolation
 *   });
 * }
 *
 * // Or with plain text (fallback)
 * throwCustomBadRequest({
 *   statusCode: 4001,
 *   message: 'Product not found',
 *   errorCode: 'PRODUCT_NOT_FOUND'
 * });
 * ```
 */
export function throwCustomBadRequest(options: CustomBadRequestOptions): never {
  const { statusCode, message, errorCode, errorMessage, translationParams } =
    options;

  // Create custom response object that will be recognized by the exception filter
  const customResponse = {
    __isCustomBadRequest: true, // Flag for detection in filter
    statusCode,
    message,
    errors: {
      code: errorCode,
      message: errorMessage || message,
    },
    translationParams, // Include translation params for i18n
  };

  throw new BadRequestException(customResponse);
}

/**
 * Check if exception response is a custom bad request
 *
 * @param {any} response - Exception response object
 * @returns {boolean} True if it's a custom bad request
 */
export function isCustomBadRequest(response: any): boolean {
  return (
    response &&
    typeof response === 'object' &&
    response.__isCustomBadRequest === true
  );
}
