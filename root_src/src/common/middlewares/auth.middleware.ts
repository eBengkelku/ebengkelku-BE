import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(
    private readonly i18n: I18nService,
    private readonly configService: ConfigService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const lang = (req.headers['x-lang'] as string) || 'en';
    const serviceConfig = this.configService.get('service');
    const requestPath = req.originalUrl || req.path;

    // Skip authentication for file read routes
    const isFileReadRoute =
      requestPath.includes(serviceConfig.fileReadRoutes.pattern) &&
      serviceConfig.fileReadRoutes.allowedActions.some((action: string) =>
        requestPath.includes(action),
      );

    if (isFileReadRoute) {
      return next();
    }

    // Check for JWT Bearer token first
    const authHeader = req.headers['authorization'] as string;
    const hasJwtBearer = authHeader && authHeader.startsWith('Bearer ');

    // If JWT Bearer token is present, let the guards handle validation
    if (hasJwtBearer) {
      return next();
    }

    // Check for service-to-service authentication as fallback
    const appServiceId = req.headers['app_service_id'] as string;
    const appServiceSecret = req.headers['app_service_secret'] as string;
    const hasClientCredentials = appServiceId && appServiceSecret;

    if (hasClientCredentials) {
      // Get service credentials from service config
      const serviceId = serviceConfig.serviceId;
      const serviceSecret = serviceConfig.serviceSecret;

      if (!serviceId || !serviceSecret) {
        res.status(500).json({
          success: false,
          message:
            this.i18n.t('auth.errors.configError', { lang }) ||
            'Authentication configuration error',
          data: [],
          errors: [],
          status: 500,
        });
        return;
      }

      // Validate client credentials against service credentials
      if (appServiceId === serviceId && appServiceSecret === serviceSecret) {
        // Add client info to request for downstream use
        (req as any).client = {
          authenticated: true,
          type: 'client_credentials',
          appServiceId: appServiceId,
        };
        return next();
      } else {
        res.status(401).json({
          success: false,
          message:
            this.i18n.t('auth.errors.invalidCredentials', { lang }) ||
            'Invalid client credentials',
          data: [],
          errors: [],
          status: 401,
        });
        return;
      }
    }

    // If no authentication method provided, let the guards handle it
    // The guards will check for @Public() decorator and allow/deny accordingly
    return next();
  }
}
