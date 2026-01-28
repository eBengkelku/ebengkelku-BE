import { AccessUser } from './auth.service';

/**
 * Development mode mock user configuration
 *
 * This file provides a mock user for development mode,
 * allowing developers to bypass JWT authentication during local testing.
 *
 * @remarks
 * - Only used when NODE_ENV is 'local' or 'development'
 * - Never used in production environment
 * - Provides full admin access for development convenience
 */

/**
 * Returns a mock AccessUser for development mode
 *
 * @returns AccessUser object with development credentials and full access roles
 *
 * @example
 * ```typescript
 * // In jwt.guard.ts when development mode is detected:
 * const devUser = getDevUser();
 * req.user = devUser;
 * ```
 */
export function getDevUser(): AccessUser {
  const now = Math.floor(Date.now() / 1000);

  return {
    sub: 'dev-user-001',
    name: 'developer',
    email: 'dev@ebengkelku.local',
    roles: 'admin,user',
    permissions: ['read', 'write', 'delete', 'admin'],
    iat: now,
    exp: now + 86400, // 1 day expiration
  };
}

/**
 * Development mode indicator for logging purposes
 */
export const DEV_MODE_BYPASS_MESSAGE =
  'Development mode: JWT authentication bypassed. Using mock dev user.';
