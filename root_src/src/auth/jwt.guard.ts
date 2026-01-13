import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { AuthService } from './auth.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { AppConfig, NodeEnv } from '@/config';
import { getDevUser, DEV_MODE_BYPASS_MESSAGE } from './dev-user.config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly i18n: I18nService,
    private readonly authService: AuthService,
    private readonly configService: ConfigService<AppConfig>,
    private readonly reflector: Reflector,
  ) {}

  /**
   * Checks if the application is running in development mode
   * @returns true if NODE_ENV is 'local' or 'development'
   */
  private isDevelopmentMode(): boolean {
    const nodeEnv = this.configService.get<NodeEnv>('nodeEnv');
    return nodeEnv === NodeEnv.Local || nodeEnv === NodeEnv.Development;
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest();

    // Development mode bypass: skip JWT verification in local/development environments
    if (this.isDevelopmentMode()) {
      this.logger.warn(DEV_MODE_BYPASS_MESSAGE);
      req.user = getDevUser();
      req.auth_metrics = {
        verify_duration_ms: 0,
        dev_mode_bypass: true,
      };
      return true;
    }

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
