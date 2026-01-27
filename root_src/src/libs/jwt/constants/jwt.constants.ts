/**
 * JWT Constants
 *
 * Configuration constants for JWT operations.
 *
 * @module Libs/JWT/Constants
 * @version 1.0.0
 * @since 2026-01-27
 */

/**
 * JWT Algorithm configuration
 */
export const JWT_ALGORITHM = 'RS256' as const;

/**
 * JWT Token type
 */
export const JWT_TOKEN_TYPE = 'Bearer' as const;

/**
 * Default expiration time in milliseconds (5 minutes)
 */
export const JWT_DEFAULT_EXPIRATION_MS = 300000;

/**
 * Environment variable names for JWT configuration
 */
export const JWT_ENV_VARS = {
  /** Expiration time in milliseconds */
  EXPIRED_TIME: 'JWT_EXPIRED_TIME',

  /** Path to JWKS file with signing key */
  SIGNING_KEY_PATH: 'JWT_SIGNING_KEY_PATH',
} as const;

/**
 * Default JTI prefix for generated tokens
 */
export const JWT_DEFAULT_JTI_PREFIX = 'jwt';

/**
 * JWKS key ID (kid) for signing key from existing JWKS
 * This matches the RS256 signing key in config/jwks/jwks.json
 */
export const JWT_SIGNING_KEY_ID = 'fI7p53Efj55rAZME0gyDDEHqD8xtsOr5Nz_iEifEYFY';

/**
 * Default JWKS file path
 */
export const JWT_DEFAULT_JWKS_PATH = './config/jwks/jwks.json';

/**
 * Database table names
 */
export const JWT_DB_TABLES = {
  USERS: 'core.users',
  ROLES: 'core.roles',
  USER_ROLES: 'core.user_roles',
  PERMISSIONS: 'core.permissions',
  ROLE_PERMISSIONS: 'core.role_permissions',
} as const;

/**
 * UUID v4 regex pattern for validation
 */
export const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
