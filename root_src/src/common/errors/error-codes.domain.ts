/**
 * Domain-Specific Error Codes
 *
 * Error codes specific to business domains (Products, Orders, etc.)
 * Extends the base error code system with domain-specific codes.
 *
 * Error Code Format: ERR_[DOMAIN]_[NUMBER]
 * - 4xxx: Product domain
 * - 5xxx: Order domain
 * - 6xxx: User domain
 * - 7xxx: File domain
 * - 8xxx: Auth domain
 * - 9xxx+: Other domains
 *
 * @module DomainErrorCodes
 * @version 1.0.0
 * @since 2025-10-10
 */

import type { ErrorCode } from './error-codes';

/**
 * Product Domain Error Codes (4xxx)
 */
export const ProductErrorCodes = {
  /**
   * Product not found
   */
  PRODUCT_NOT_FOUND: 'ERR_4000',

  /**
   * Product price is negative
   */
  PRODUCT_PRICE_NEGATIVE: 'ERR_4001',

  /**
   * Product stock is negative
   */
  PRODUCT_STOCK_NEGATIVE: 'ERR_4002',

  /**
   * Product name is empty
   */
  PRODUCT_NAME_EMPTY: 'ERR_4003',

  /**
   * Product insufficient stock
   */
  PRODUCT_INSUFFICIENT_STOCK: 'ERR_4004',

  /**
   * Product invalid discount
   */
  PRODUCT_INVALID_DISCOUNT: 'ERR_4005',

  /**
   * Product already exists (duplicate)
   */
  PRODUCT_ALREADY_EXISTS: 'ERR_4006',

  /**
   * Product invalid restock quantity
   */
  PRODUCT_RESTOCK_INVALID: 'ERR_4007',

  /**
   * Product invalid sell quantity
   */
  PRODUCT_SELL_INVALID: 'ERR_4008',

  /**
   * Product out of stock
   */
  PRODUCT_OUT_OF_STOCK: 'ERR_4009',
} as const;

/**
 * Order Domain Error Codes (5xxx)
 */
export const OrderErrorCodes = {
  /**
   * Order not found
   */
  ORDER_NOT_FOUND: 'ERR_5000',

  /**
   * Order items required
   */
  ORDER_ITEMS_REQUIRED: 'ERR_5001',

  /**
   * Order total mismatch
   */
  ORDER_TOTAL_MISMATCH: 'ERR_5002',

  /**
   * Order cannot be confirmed
   */
  ORDER_CANNOT_CONFIRM: 'ERR_5003',

  /**
   * Order cannot be cancelled
   */
  ORDER_CANNOT_CANCEL: 'ERR_5004',

  /**
   * Order already delivered
   */
  ORDER_ALREADY_DELIVERED: 'ERR_5005',

  /**
   * Order invalid status transition
   */
  ORDER_INVALID_STATUS: 'ERR_5006',
} as const;

/**
 * User Domain Error Codes (6xxx)
 */
export const UserErrorCodes = {
  /**
   * User not found
   */
  USER_NOT_FOUND: 'ERR_6000',

  /**
   * User already exists
   */
  USER_ALREADY_EXISTS: 'ERR_6001',

  /**
   * User email already taken
   */
  USER_EMAIL_TAKEN: 'ERR_6002',

  /**
   * User invalid password
   */
  USER_INVALID_PASSWORD: 'ERR_6003',

  /**
   * User account locked
   */
  USER_ACCOUNT_LOCKED: 'ERR_6004',

  /**
   * User account not verified
   */
  USER_NOT_VERIFIED: 'ERR_6005',
} as const;

/**
 * File Domain Error Codes (7xxx)
 */
export const FileErrorCodes = {
  /**
   * File not found
   */
  FILE_NOT_FOUND: 'ERR_7000',

  /**
   * File too large
   */
  FILE_TOO_LARGE: 'ERR_7001',

  /**
   * File invalid type
   */
  FILE_INVALID_TYPE: 'ERR_7002',

  /**
   * File upload failed
   */
  FILE_UPLOAD_FAILED: 'ERR_7003',

  /**
   * File delete failed
   */
  FILE_DELETE_FAILED: 'ERR_7004',

  /**
   * File corrupted
   */
  FILE_CORRUPTED: 'ERR_7005',
} as const;

/**
 * Auth Domain Error Codes (8xxx)
 */
export const AuthErrorCodes = {
  /**
   * Authentication failed
   */
  AUTH_FAILED: 'ERR_8000',

  /**
   * Invalid credentials
   */
  AUTH_INVALID_CREDENTIALS: 'ERR_8001',

  /**
   * Token expired
   */
  AUTH_TOKEN_EXPIRED: 'ERR_8002',

  /**
   * Token invalid
   */
  AUTH_TOKEN_INVALID: 'ERR_8003',

  /**
   * Refresh token expired
   */
  AUTH_REFRESH_TOKEN_EXPIRED: 'ERR_8004',

  /**
   * Refresh token invalid
   */
  AUTH_REFRESH_TOKEN_INVALID: 'ERR_8005',

  /**
   * Session expired
   */
  AUTH_SESSION_EXPIRED: 'ERR_8006',

  /**
   * Insufficient permissions
   */
  AUTH_INSUFFICIENT_PERMISSIONS: 'ERR_8007',
} as const;

/**
 * Booking Domain Error Codes (9xxx)
 */
export const BookingErrorCodes = {
  /**
   * Booking not found
   */
  BOOKING_NOT_FOUND: 'ERR_9000',

  /**
   * Booking date invalid
   */
  BOOKING_DATE_INVALID: 'ERR_9001',

  /**
   * Booking past date
   */
  BOOKING_PAST_DATE: 'ERR_9002',

  /**
   * Booking duration too short
   */
  BOOKING_DURATION_TOO_SHORT: 'ERR_9003',

  /**
   * Booking overlap detected
   */
  BOOKING_OVERLAP: 'ERR_9004',

  /**
   * Booking cannot cancel
   */
  BOOKING_CANNOT_CANCEL: 'ERR_9005',

  /**
   * Booking too late to cancel
   */
  BOOKING_TOO_LATE_TO_CANCEL: 'ERR_9006',
} as const;

/**
 * All Domain Error Codes
 *
 * Combined object of all domain-specific error codes
 */
export const DomainErrorCodes = {
  ...ProductErrorCodes,
  ...OrderErrorCodes,
  ...UserErrorCodes,
  ...FileErrorCodes,
  ...AuthErrorCodes,
  ...BookingErrorCodes,
} as const;

/**
 * Domain Error Code Type
 */
export type DomainErrorCode =
  (typeof DomainErrorCodes)[keyof typeof DomainErrorCodes];

/**
 * Check if a code is a domain error code
 *
 * @param code - The code to check
 * @returns True if the code is a domain error code
 */
export function isDomainErrorCode(code: string): code is DomainErrorCode {
  return Object.values(DomainErrorCodes).includes(code as DomainErrorCode);
}

/**
 * Get domain name from error code
 *
 * @param code - The domain error code
 * @returns Domain name (e.g., 'product', 'order')
 *
 * @example
 * ```typescript
 * getDomainFromCode('ERR_4000'); // 'product'
 * getDomainFromCode('ERR_5000'); // 'order'
 * ```
 */
export function getDomainFromCode(code: DomainErrorCode): string {
  const codeNumber = parseInt(code.replace('ERR_', ''));

  if (codeNumber >= 4000 && codeNumber < 5000) return 'product';
  if (codeNumber >= 5000 && codeNumber < 6000) return 'order';
  if (codeNumber >= 6000 && codeNumber < 7000) return 'user';
  if (codeNumber >= 7000 && codeNumber < 8000) return 'file';
  if (codeNumber >= 8000 && codeNumber < 9000) return 'auth';
  if (codeNumber >= 9000 && codeNumber < 10000) return 'booking';

  return 'unknown';
}

/**
 * Get all error codes for a specific domain
 *
 * @param domain - The domain name
 * @returns Array of error codes for the domain
 *
 * @example
 * ```typescript
 * const productCodes = getErrorCodesForDomain('product');
 * // ['ERR_4000', 'ERR_4001', ...]
 * ```
 */
export function getErrorCodesForDomain(domain: string): string[] {
  switch (domain.toLowerCase()) {
    case 'product':
      return Object.values(ProductErrorCodes);
    case 'order':
      return Object.values(OrderErrorCodes);
    case 'user':
      return Object.values(UserErrorCodes);
    case 'file':
      return Object.values(FileErrorCodes);
    case 'auth':
      return Object.values(AuthErrorCodes);
    case 'booking':
      return Object.values(BookingErrorCodes);
    default:
      return [];
  }
}
