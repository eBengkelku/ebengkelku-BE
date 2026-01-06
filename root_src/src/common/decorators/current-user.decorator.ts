import { AccessUser } from '@/auth/auth.service';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to get current authenticated user from request
 * User data is populated by JwtAuthGuard
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AccessUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
