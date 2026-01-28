/**
 * Login Error Codes
 *
 * Domain-specific error codes for login operations.
 * These codes are used in custom exceptions and error responses.
 *
 * @module LoginErrorCodes
 * @version 1.0.0
 * @since 2026-01-28
 */

export const LoginErrorCodes = {
  /**
   * Invalid email or password (generic to prevent user enumeration)
   */
  INVALID_CREDENTIALS: 'LOGIN_INVALID_CREDENTIALS',

  /**
   * Email is not verified - user needs to verify email first
   */
  EMAIL_NOT_VERIFIED: 'LOGIN_EMAIL_NOT_VERIFIED',

  /**
   * Failed to generate JWT token
   */
  TOKEN_GENERATION_FAILED: 'LOGIN_TOKEN_GENERATION_FAILED',

  /**
   * Failed to decrypt user PII data
   */
  DECRYPTION_FAILED: 'LOGIN_DECRYPTION_FAILED',
} as const;

/**
 * Login Error Code Type
 */
export type LoginErrorCode =
  (typeof LoginErrorCodes)[keyof typeof LoginErrorCodes];

/**
 * Check if a string is a valid login error code
 */
export function isLoginErrorCode(code: string): code is LoginErrorCode {
  return Object.values(LoginErrorCodes).includes(code as LoginErrorCode);
}
