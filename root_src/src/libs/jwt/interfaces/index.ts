/**
 * JWT Payload Interface
 *
 * Defines the structure of the JWT access token payload.
 * Matches the required decoded token format.
 *
 * @module Libs/JWT/Interfaces
 * @version 1.0.0
 * @since 2026-01-27
 */

/**
 * JWT Token Payload Structure
 */
export interface IJwtPayload {
  /** Expiration time (seconds since Unix epoch) */
  exp: number;

  /** Issued at (seconds since Unix epoch) */
  iat: number;

  /** Time when authentication occurred (seconds since Unix epoch) */
  auth_time: number;

  /** JWT ID (unique identifier for this token) */
  jti: string;

  /** Subject - User's public_id from core.users */
  sub: string;

  /** Token type - Always "Bearer" */
  typ: 'Bearer';

  /** User's role_id from core.user_roles */
  roles: string;

  /** Permission keys from core.permissions */
  permissions: string[];

  /** User's name (decrypted) */
  name: string;

  /** User's email (decrypted) */
  email: string;
}

/**
 * Options for JWT token generation
 */
export interface IJwtGenerationOptions {
  /** Custom expiration time in milliseconds (overrides env config) */
  expiresInMs?: number;

  /** Custom auth_time (defaults to current time) */
  authTime?: Date;

  /** Custom JTI prefix (defaults to 'jwt') */
  jtiPrefix?: string;
}

/**
 * User data retrieved from database
 */
export interface IUserData {
  /** Internal user ID (UUID) */
  id: string;

  /** Public user ID (UUID) - used as 'sub' claim */
  public_id: string;

  /** User's name (decrypted) */
  name: string;

  /** User's email (decrypted) */
  email: string;

  /** Whether the user data is encrypted */
  is_encrypted: boolean;
}

/**
 * Role data retrieved from database
 */
export interface IRoleData {
  /** Role ID (UUID) */
  id: string;

  /** Role key (e.g., 'customer', 'owner', 'admin') */
  key: string;

  /** Role name */
  name: string;
}

/**
 * Database row type for users table
 */
export interface IUserRow {
  id: string;
  public_id: string;
  name: string;
  email: string;
  phone: string | null;
  password: string | null;
  image: string | null;
  provider: string | null;
  provider_id: string | null;
  email_verified_at: Date | null;
  created_at: Date;
  updated_at: Date | null;
  deleted_at: Date | null;
  id_creator: string | null;
  id_updater: string | null;
  is_encrypted: boolean;
}

/**
 * Database row type for user_roles join result
 */
export interface IUserRoleRow {
  user_id: string;
  role_id: string;
  role_key: string;
  role_name: string;
}

/**
 * Database row type for permissions
 */
export interface IPermissionRow {
  id: string;
  key: string;
  name: string;
}

/**
 * JWT Service interface
 */
export interface IJwtService {
  /**
   * Generate access token for a user
   * @param publicId - User's public_id
   * @param options - Optional generation options
   * @returns Signed JWT token string
   */
  generateAccessToken(
    publicId: string,
    options?: IJwtGenerationOptions,
  ): Promise<string>;

  /**
   * Check if the service is ready to generate tokens
   */
  isReady(): boolean;
}
