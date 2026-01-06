import { SetMetadata } from '@nestjs/common';

/**
 * Decorator that marks a route or controller as publicly accessible, bypassing authentication guards.
 *
 * This decorator sets metadata using the `IS_PUBLIC_KEY` constant to indicate that the decorated
 * route or controller should be accessible without authentication.
 *
 * @returns A metadata decorator function that marks the target as public
 *
 * @example
 * ```typescript
 * @Public()
 * @Get('health')
 * healthCheck() {
 *   return { status: 'ok' };
 * }
 * ```
 *
 * @remarks
 * This decorator should be used in conjunction with an authentication guard that checks
 * for the presence of the `IS_PUBLIC_KEY` metadata to determine whether to skip authentication.
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
