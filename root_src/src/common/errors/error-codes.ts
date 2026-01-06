/**
 * Error Codes Registry
 *
 * Centralized registry of all application error codes.
 * Provides type-safe error codes for consistent error handling.
 *
 * Error Code Format: ERR_[CATEGORY][NUMBER]
 * - 1xxx: HTTP/General errors
 * - 2xxx: Validation errors
 * - 3xxx: Business logic errors
 * - 4xxx+: Domain-specific errors
 *
 * @module ErrorCodes
 * @version 1.0.0
 * @since 2025-10-10
 *
 * @example
 * ```typescript
 * import { ErrorCodes } from '@/common/errors';
 *
 * throw new ValidationException(
 *   ErrorCodes.VALIDATION_FAILED,
 *   'Validation failed'
 * );
 * ```
 */

/**
 * Common Error Codes
 *
 * Generic error codes that apply across all domains
 */
export const ErrorCodes = {
  // ========================================
  // 1xxx: HTTP & General Errors
  // ========================================

  /**
   * Generic bad request error
   * HTTP 400
   */
  BAD_REQUEST: 'ERR_1000',

  /**
   * Authentication required
   * HTTP 401
   */
  UNAUTHORIZED: 'ERR_1001',

  /**
   * Payment required
   * HTTP 402
   */
  PAYMENT_REQUIRED: 'ERR_1002',

  /**
   * Insufficient permissions
   * HTTP 403
   */
  FORBIDDEN: 'ERR_1003',

  /**
   * Resource not found
   * HTTP 404
   */
  NOT_FOUND: 'ERR_1004',

  /**
   * Method not allowed
   * HTTP 405
   */
  METHOD_NOT_ALLOWED: 'ERR_1005',

  /**
   * Request timeout
   * HTTP 408
   */
  REQUEST_TIMEOUT: 'ERR_1008',

  /**
   * Resource conflict
   * HTTP 409
   */
  CONFLICT: 'ERR_1009',

  /**
   * Resource gone
   * HTTP 410
   */
  GONE: 'ERR_1010',

  /**
   * Payload too large
   * HTTP 413
   */
  PAYLOAD_TOO_LARGE: 'ERR_1013',

  /**
   * Unsupported media type
   * HTTP 415
   */
  UNSUPPORTED_MEDIA_TYPE: 'ERR_1015',

  /**
   * Too many requests
   * HTTP 429
   */
  TOO_MANY_REQUESTS: 'ERR_1029',

  /**
   * Internal server error
   * HTTP 500
   */
  INTERNAL_SERVER_ERROR: 'ERR_1500',

  /**
   * Service unavailable
   * HTTP 503
   */
  SERVICE_UNAVAILABLE: 'ERR_1503',

  // ========================================
  // 2xxx: Validation Errors
  // ========================================

  /**
   * Generic validation failure
   */
  VALIDATION_FAILED: 'ERR_2000',

  /**
   * Required field is missing
   */
  REQUIRED_FIELD: 'ERR_2001',

  /**
   * Invalid data format
   */
  INVALID_FORMAT: 'ERR_2002',

  /**
   * Value out of allowed range
   */
  OUT_OF_RANGE: 'ERR_2003',

  /**
   * Value too short (min length)
   */
  TOO_SHORT: 'ERR_2004',

  /**
   * Value too long (max length)
   */
  TOO_LONG: 'ERR_2005',

  /**
   * Invalid email format
   */
  INVALID_EMAIL: 'ERR_2006',

  /**
   * Invalid URL format
   */
  INVALID_URL: 'ERR_2007',

  /**
   * Invalid UUID format
   */
  INVALID_UUID: 'ERR_2008',

  /**
   * Invalid date format
   */
  INVALID_DATE: 'ERR_2009',

  /**
   * Invalid enum value
   */
  INVALID_ENUM: 'ERR_2010',

  /**
   * Value must be positive
   */
  MUST_BE_POSITIVE: 'ERR_2011',

  /**
   * Value must be negative
   */
  MUST_BE_NEGATIVE: 'ERR_2012',

  /**
   * Value must be zero
   */
  MUST_BE_ZERO: 'ERR_2013',

  /**
   * Array is empty
   */
  ARRAY_EMPTY: 'ERR_2014',

  /**
   * Array too short
   */
  ARRAY_TOO_SHORT: 'ERR_2015',

  /**
   * Array too long
   */
  ARRAY_TOO_LONG: 'ERR_2016',

  // ========================================
  // 3xxx: Business Logic Errors
  // ========================================

  /**
   * Generic business rule violation
   */
  BUSINESS_RULE_VIOLATION: 'ERR_3000',

  /**
   * Insufficient quantity/stock
   */
  INSUFFICIENT_QUANTITY: 'ERR_3001',

  /**
   * Duplicate entity detected
   */
  DUPLICATE_ENTITY: 'ERR_3002',

  /**
   * Invalid state transition
   */
  INVALID_STATE_TRANSITION: 'ERR_3003',

  /**
   * Operation not allowed
   */
  OPERATION_NOT_ALLOWED: 'ERR_3004',

  /**
   * Dependency exists
   */
  DEPENDENCY_EXISTS: 'ERR_3005',

  /**
   * Resource locked
   */
  RESOURCE_LOCKED: 'ERR_3006',

  /**
   * Quota exceeded
   */
  QUOTA_EXCEEDED: 'ERR_3007',

  /**
   * Invalid credentials
   */
  INVALID_CREDENTIALS: 'ERR_3008',

  /**
   * Token expired
   */
  TOKEN_EXPIRED: 'ERR_3009',

  /**
   * Token invalid
   */
  TOKEN_INVALID: 'ERR_3010',
} as const;

/**
 * Error Code Type
 *
 * Type-safe error code type derived from ErrorCodes object
 */
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Error Code Metadata
 *
 * Additional information about each error code
 */
export interface ErrorCodeMetadata {
  code: ErrorCode;
  defaultMessage: string;
  httpStatus: number;
  category: 'http' | 'validation' | 'business' | 'domain';
}

/**
 * Error Code Metadata Registry
 *
 * Maps error codes to their metadata
 */
export const ErrorCodeMetadata: Record<string, ErrorCodeMetadata> = {
  // HTTP Errors
  [ErrorCodes.BAD_REQUEST]: {
    code: ErrorCodes.BAD_REQUEST,
    defaultMessage: 'Bad request',
    httpStatus: 400,
    category: 'http',
  },
  [ErrorCodes.UNAUTHORIZED]: {
    code: ErrorCodes.UNAUTHORIZED,
    defaultMessage: 'Unauthorized',
    httpStatus: 401,
    category: 'http',
  },
  [ErrorCodes.FORBIDDEN]: {
    code: ErrorCodes.FORBIDDEN,
    defaultMessage: 'Forbidden',
    httpStatus: 403,
    category: 'http',
  },
  [ErrorCodes.NOT_FOUND]: {
    code: ErrorCodes.NOT_FOUND,
    defaultMessage: 'Resource not found',
    httpStatus: 404,
    category: 'http',
  },
  [ErrorCodes.CONFLICT]: {
    code: ErrorCodes.CONFLICT,
    defaultMessage: 'Resource conflict',
    httpStatus: 409,
    category: 'http',
  },
  [ErrorCodes.INTERNAL_SERVER_ERROR]: {
    code: ErrorCodes.INTERNAL_SERVER_ERROR,
    defaultMessage: 'Internal server error',
    httpStatus: 500,
    category: 'http',
  },

  // Validation Errors
  [ErrorCodes.VALIDATION_FAILED]: {
    code: ErrorCodes.VALIDATION_FAILED,
    defaultMessage: 'Validation failed',
    httpStatus: 400,
    category: 'validation',
  },
  [ErrorCodes.REQUIRED_FIELD]: {
    code: ErrorCodes.REQUIRED_FIELD,
    defaultMessage: 'Required field is missing',
    httpStatus: 400,
    category: 'validation',
  },
  [ErrorCodes.INVALID_FORMAT]: {
    code: ErrorCodes.INVALID_FORMAT,
    defaultMessage: 'Invalid format',
    httpStatus: 400,
    category: 'validation',
  },
  [ErrorCodes.OUT_OF_RANGE]: {
    code: ErrorCodes.OUT_OF_RANGE,
    defaultMessage: 'Value out of range',
    httpStatus: 400,
    category: 'validation',
  },

  // Business Logic Errors
  [ErrorCodes.BUSINESS_RULE_VIOLATION]: {
    code: ErrorCodes.BUSINESS_RULE_VIOLATION,
    defaultMessage: 'Business rule violation',
    httpStatus: 400,
    category: 'business',
  },
  [ErrorCodes.INSUFFICIENT_QUANTITY]: {
    code: ErrorCodes.INSUFFICIENT_QUANTITY,
    defaultMessage: 'Insufficient quantity',
    httpStatus: 400,
    category: 'business',
  },
  [ErrorCodes.DUPLICATE_ENTITY]: {
    code: ErrorCodes.DUPLICATE_ENTITY,
    defaultMessage: 'Duplicate entity',
    httpStatus: 409,
    category: 'business',
  },
  [ErrorCodes.INVALID_STATE_TRANSITION]: {
    code: ErrorCodes.INVALID_STATE_TRANSITION,
    defaultMessage: 'Invalid state transition',
    httpStatus: 400,
    category: 'business',
  },
  [ErrorCodes.OPERATION_NOT_ALLOWED]: {
    code: ErrorCodes.OPERATION_NOT_ALLOWED,
    defaultMessage: 'Operation not allowed',
    httpStatus: 403,
    category: 'business',
  },
};

/**
 * Check if a string is a valid error code
 *
 * @param code - The code to check
 * @returns True if the code is valid
 *
 * @example
 * ```typescript
 * if (isErrorCode('ERR_1000')) {
 *   // Valid error code
 * }
 * ```
 */
export function isErrorCode(code: string): code is ErrorCode {
  return Object.values(ErrorCodes).includes(code as ErrorCode);
}

/**
 * Get error code metadata
 *
 * @param code - The error code
 * @returns Metadata for the error code
 *
 * @example
 * ```typescript
 * const metadata = getErrorMetadata(ErrorCodes.NOT_FOUND);
 * console.log(metadata.httpStatus); // 404
 * ```
 */
export function getErrorMetadata(code: ErrorCode): ErrorCodeMetadata | null {
  return ErrorCodeMetadata[code] || null;
}

/**
 * Get HTTP status code for an error code
 *
 * @param code - The error code
 * @returns HTTP status code
 *
 * @example
 * ```typescript
 * const status = getHttpStatus(ErrorCodes.NOT_FOUND); // 404
 * ```
 */
export function getHttpStatus(code: ErrorCode): number {
  const metadata = getErrorMetadata(code);
  return metadata?.httpStatus || 500;
}
