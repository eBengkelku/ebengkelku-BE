/**
 * Owner Registration Error Codes
 *
 * Domain-specific error codes for owner registration operations.
 * These codes are used in custom exceptions and error responses.
 *
 * @module OwnerRegistrationErrorCodes
 * @version 1.0.0
 * @since 2026-01-29
 */

export const OwnerRegistrationErrorCodes = {
  /**
   * Email is already registered
   */
  EMAIL_ALREADY_EXISTS: 'OWNER_EMAIL_ALREADY_EXISTS',

  /**
   * Owner role not found in database
   */
  ROLE_NOT_FOUND: 'OWNER_ROLE_NOT_FOUND',

  /**
   * Registration failed due to unexpected error
   */
  REGISTRATION_FAILED: 'OWNER_REGISTRATION_FAILED',

  /**
   * Password hashing failed
   */
  PASSWORD_HASH_FAILED: 'OWNER_PASSWORD_HASH_FAILED',

  /**
   * Encryption of user data failed
   */
  ENCRYPTION_FAILED: 'OWNER_ENCRYPTION_FAILED',
} as const;

/**
 * Owner Registration Error Code Type
 */
export type OwnerRegistrationErrorCode =
  (typeof OwnerRegistrationErrorCodes)[keyof typeof OwnerRegistrationErrorCodes];

/**
 * Check if a string is a valid owner registration error code
 */
export function isOwnerRegistrationErrorCode(
  code: string,
): code is OwnerRegistrationErrorCode {
  return Object.values(OwnerRegistrationErrorCodes).includes(
    code as OwnerRegistrationErrorCode,
  );
}
