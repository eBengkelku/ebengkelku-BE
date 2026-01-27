/**
 * Customer Registration Error Codes
 *
 * Domain-specific error codes for customer registration operations.
 * These codes are used in custom exceptions and error responses.
 *
 * @module CustomerRegistrationErrorCodes
 * @version 1.0.0
 * @since 2026-01-27
 */

export const CustomerRegistrationErrorCodes = {
  /**
   * Email is already registered
   */
  EMAIL_ALREADY_EXISTS: 'CUSTOMER_EMAIL_ALREADY_EXISTS',

  /**
   * Customer role not found in database
   */
  ROLE_NOT_FOUND: 'CUSTOMER_ROLE_NOT_FOUND',

  /**
   * Registration failed due to unexpected error
   */
  REGISTRATION_FAILED: 'CUSTOMER_REGISTRATION_FAILED',

  /**
   * Password hashing failed
   */
  PASSWORD_HASH_FAILED: 'CUSTOMER_PASSWORD_HASH_FAILED',

  /**
   * Encryption of user data failed
   */
  ENCRYPTION_FAILED: 'CUSTOMER_ENCRYPTION_FAILED',
} as const;

/**
 * Customer Registration Error Code Type
 */
export type CustomerRegistrationErrorCode =
  (typeof CustomerRegistrationErrorCodes)[keyof typeof CustomerRegistrationErrorCodes];

/**
 * Check if a string is a valid customer registration error code
 */
export function isCustomerRegistrationErrorCode(
  code: string,
): code is CustomerRegistrationErrorCode {
  return Object.values(CustomerRegistrationErrorCodes).includes(
    code as CustomerRegistrationErrorCode,
  );
}
