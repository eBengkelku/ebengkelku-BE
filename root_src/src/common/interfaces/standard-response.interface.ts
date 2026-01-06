import { ErrorDetail, ValidationErrorDetail } from './error-detail.interface';

/**
 * Standard Response Interface
 *
 * Unified response format for all HTTP responses in the application.
 * This interface ensures consistency across success and error responses.
 *
 * @interface StandardResponse
 * @version 1.0.0
 * @since 2025-10-10
 *
 * @example Success Response
 * ```typescript
 * const response: StandardResponse<Product> = {
 *   success: true,
 *   statusCode: 200,
 *   message: 'Product retrieved successfully',
 *   data: {
 *     id: '123',
 *     name: 'iPhone',
 *     price: 999
 *   },
 *   errors: null,
 *   timestamp: '2025-10-10T07:20:09.009Z',
 *   requestTime: 45
 * };
 * ```
 *
 * @example Validation Error Response (object format)
 * ```typescript
 * const response: StandardResponse = {
 *   success: false,
 *   statusCode: 400,
 *   message: 'Validation failed',
 *   data: null,
 *   errors: {
 *     price: {
 *       value: -10,
 *       code: 'VALIDATION_MIN_VALUE',
 *       message: 'Price must be positive'
 *     },
 *     name: {
 *       value: '',
 *       code: 'VALIDATION_REQUIRED',
 *       message: 'Name is required'
 *     }
 *   },
 *   timestamp: '2025-10-10T07:20:09.009Z',
 *   path: '/v1/products',
 *   requestTime: 12
 * };
 * ```
 *
 * @example Non-Validation Error Response (array format)
 * ```typescript
 * const response: StandardResponse = {
 *   success: false,
 *   statusCode: 404,
 *   message: 'Product not found',
 *   data: null,
 *   errors: [
 *     {
 *       code: 'NOT_FOUND',
 *       message: 'Product with id 123 not found'
 *     }
 *   ],
 *   timestamp: '2025-10-10T07:20:09.009Z',
 *   path: '/v1/products/123',
 *   requestTime: 8
 * };
 * ```
 */
export interface StandardResponse<T = any> {
  /**
   * Indicates if the request was successful
   * - true: HTTP 2xx status codes
   * - false: HTTP 4xx or 5xx status codes
   */
  success: boolean;

  /**
   * HTTP status code
   * @example 200, 201, 400, 404, 500
   */
  statusCode: number;

  /**
   * Human-readable message describing the result
   * Should be i18n translated
   * @example 'Product created successfully', 'Validation failed'
   */
  message: string;

  /**
   * Response payload for successful requests
   * - For success responses: contains the actual data
   * - For error responses: always null
   */
  data?: T | null;

  /**
   * Error details for failed requests
   * - For validation errors: object with property names as keys
   * - For other errors: array of error details
   * - For success responses: null
   */
  errors?: ErrorDetail[] | Record<string, ValidationErrorDetail> | null;

  /**
   * ISO 8601 timestamp of when the response was generated
   * @example '2025-10-10T07:20:09.009Z'
   */
  timestamp?: string;

  /**
   * The request path that generated this response
   * Useful for debugging and logging
   * @example '/v1/products/123'
   */
  path?: string;

  /**
   * Request processing time in milliseconds
   * Measures the time from request start to response
   * @example 45
   */
  requestTime?: number;
}

/**
 * Paginated Response Interface
 *
 * Extension of StandardResponse for paginated data.
 * Includes pagination metadata alongside the data.
 *
 * @interface PaginatedResponse
 * @extends StandardResponse
 *
 * @example
 * ```typescript
 * const response: PaginatedResponse<Product> = {
 *   success: true,
 *   statusCode: 200,
 *   message: 'Products retrieved successfully',
 *   data: [...products],
 *   pagination: {
 *     page: 1,
 *     limit: 10,
 *     total: 100,
 *     totalPages: 10
 *   }
 * };
 * ```
 */
export interface PaginatedResponse<T = any> extends StandardResponse<T[]> {
  /**
   * Pagination metadata
   */
  pagination?: {
    /**
     * Current page number
     */
    page: number;

    /**
     * Number of items per page
     */
    limit: number;

    /**
     * Total number of items across all pages
     */
    total: number;

    /**
     * Total number of pages
     */
    totalPages: number;
  };
}

/**
 * Success Response Helper Type
 *
 * Type guard for successful responses
 */
export type SuccessResponse<T = any> = StandardResponse<T> & {
  success: true;
  data: T;
  errors: null;
};

/**
 * Error Response Helper Type
 *
 * Type guard for error responses
 */
export type ErrorResponse = StandardResponse & {
  success: false;
  data?: never;
  errors: ErrorDetail[] | Record<string, ValidationErrorDetail>;
};
