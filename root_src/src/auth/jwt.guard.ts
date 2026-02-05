import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AuthService } from './auth.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly i18n: I18nService,
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest();
    const auth = req.headers['authorization'];
    const lang = (req.headers['x-lang'] as string) || 'en';

    // Check if Authorization header exists
    if (!auth?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        this.i18n.t('auth.errors.noToken', { lang }),
      );
    }

    const token = auth.slice(7); // Remove 'Bearer ' prefix
    const startTime = Date.now();

    try {
      // Verify JWT token and extract user payload
      this.logger.debug('Verifying JWT token...');
      const accessUser = await this.authService.verifyAccessToken(token, lang);

      const duration = Date.now() - startTime;
      this.logger.debug(
        `JWT verified in ${duration}ms: ${accessUser.email} (sub: ${accessUser.sub})`,
      );

      // Attach user payload to request
      req.user = accessUser;

      // Add JWT verification metrics
      req.auth_metrics = {
        verify_duration_ms: duration,
      };

      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `JWT verification failed after ${duration}ms: ${error.message}`,
      );
      throw error;
    }
  }
}
