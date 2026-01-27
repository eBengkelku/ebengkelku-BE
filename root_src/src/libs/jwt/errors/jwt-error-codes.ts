/**
 * JWT Error Codes
 *
 * Error codes and messages for JWT operations.
 *
 * @module Libs/JWT/Errors
 * @version 1.0.0
 * @since 2026-01-27
 */

/**
 * JWT Error Code Enum
 */
export enum JwtErrorCode {
  /** User not found in database */
  USER_NOT_FOUND = 'JWT_USER_NOT_FOUND',

  /** User role not found */
  ROLE_NOT_FOUND = 'JWT_ROLE_NOT_FOUND',

  /** Signing key not available */
  SIGNING_KEY_NOT_FOUND = 'JWT_SIGNING_KEY_NOT_FOUND',

  /** Invalid public ID format */
  INVALID_PUBLIC_ID = 'JWT_INVALID_PUBLIC_ID',

  /** Token generation failed */
  TOKEN_GENERATION_FAILED = 'JWT_TOKEN_GENERATION_FAILED',

  /** Service not initialized */
  SERVICE_NOT_INITIALIZED = 'JWT_SERVICE_NOT_INITIALIZED',

  /** Database error */
  DATABASE_ERROR = 'JWT_DATABASE_ERROR',

  /** Encryption service error */
  ENCRYPTION_ERROR = 'JWT_ENCRYPTION_ERROR',
}

/**
 * JWT Error i18n keys mapping
 */
export const JwtErrorI18nKeys: Record<JwtErrorCode, string> = {
  [JwtErrorCode.USER_NOT_FOUND]: 'jwt.errors.userNotFound',
  [JwtErrorCode.ROLE_NOT_FOUND]: 'jwt.errors.roleNotFound',
  [JwtErrorCode.SIGNING_KEY_NOT_FOUND]: 'jwt.errors.signingKeyNotFound',
  [JwtErrorCode.INVALID_PUBLIC_ID]: 'jwt.errors.invalidPublicId',
  [JwtErrorCode.TOKEN_GENERATION_FAILED]: 'jwt.errors.tokenGenerationFailed',
  [JwtErrorCode.SERVICE_NOT_INITIALIZED]: 'jwt.errors.serviceNotInitialized',
  [JwtErrorCode.DATABASE_ERROR]: 'jwt.errors.databaseError',
  [JwtErrorCode.ENCRYPTION_ERROR]: 'jwt.errors.encryptionError',
};

/**
 * Check if a code is a valid JWT error code
 */
export function isJwtErrorCode(code: string): code is JwtErrorCode {
  return Object.values(JwtErrorCode).includes(code as JwtErrorCode);
}
