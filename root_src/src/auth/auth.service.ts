// src/auth/auth.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  createRemoteJWKSet,
  createLocalJWKSet,
  jwtVerify,
  JWTPayload,
} from 'jose';
import { I18nService } from 'nestjs-i18n';
import fs from 'fs';

export type AccessUser = JWTPayload & {
  sub: string;
  preferred_username?: string;
  email?: string;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles: string[] }>;
};

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly issuer: string;
  private readonly audience: string;
  private readonly jwksUri: string;

  private remoteJWKS;
  private localJWKS;

  constructor(private readonly i18n: I18nService) {
    // Validate required environment variables
    const issuer = process.env.ISSUER;
    const audience = process.env.AUDIENCE;

    if (!issuer) {
      this.logger.error('ISSUER environment variable is required');
      throw new Error('ISSUER environment variable is required');
    }
    if (!audience) {
      this.logger.error('AUDIENCE environment variable is required');
      throw new Error('AUDIENCE environment variable is required');
    }

    this.issuer = issuer;
    this.audience = audience;
    this.jwksUri = `${this.issuer}/protocol/openid-connect/certs`;

    this.logger.log(`Initializing AuthService with issuer: ${this.issuer}`);

    try {
      this.remoteJWKS = createRemoteJWKSet(new URL(this.jwksUri));
      this.logger.log(`Remote JWKS created for: ${this.jwksUri}`);
    } catch (error) {
      this.logger.error(`Failed to create remote JWKS: ${error.message}`);
      throw new Error(`Invalid ISSUER URL: ${this.issuer}`);
    }

    // Load local JWKS file if it exists
    try {
      const jwksData = JSON.parse(fs.readFileSync('./jwks.json', 'utf8'));
      this.localJWKS = createLocalJWKSet(jwksData);
      this.logger.log('Loaded local JWKS file');
    } catch {
      this.logger.warn('No local JWKS file found, starting without fallback');
    }
  }

  async onModuleInit() {
    // Warm up JWKS cache at startup
    try {
      this.logger.log(`Warming JWKS cache from ${this.jwksUri}...`);
      // Verify a dummy invalid token just to trigger JWKS fetch
      await jwtVerify('invalid.token.value', this.remoteJWKS).catch(() => {});
      this.logger.log('JWKS cache warmed successfully');
    } catch (err) {
      this.logger.error(`Failed to warm JWKS: ${err.message}`);
    }
  }

  async verifyAccessToken(token: string, lang?: string): Promise<AccessUser> {
    try {
      // Optional: quick sanity check
      if (!token || token.length > 8192)
        throw new Error(
          this.i18n.t('auth.errors.tokenMissingOrTooLarge', { lang }),
        );
      const { payload } = await jwtVerify(token, this.remoteJWKS, {
        issuer: this.issuer,
        algorithms: ['RS256'],
        clockTolerance: '60s',
      });

      // Ensure correct audience
      const aud = payload.aud;
      const hasAudience =
        (Array.isArray(aud) && aud.includes(this.audience)) ||
        (typeof aud === 'string' && aud === this.audience);

      if (!hasAudience)
        throw new Error(this.i18n.t('auth.errors.invalidAudience', { lang }));
      return payload as AccessUser;
    } catch (error) {
      // Provide more specific error messages with i18n support
      if (error.code === 'ERR_JWT_EXPIRED') {
        throw new Error(this.i18n.t('common.jwt.expired', { lang }));
      }
      if (error.code === 'ERR_JWT_INVALID') {
        throw new Error(this.i18n.t('common.jwt.invalid', { lang }));
      }
      if (error.code === 'ERR_JWT_AUDIENCE_INVALID') {
        throw new Error(this.i18n.t('common.jwt.audienceMismatch', { lang }));
      }
      if (error.code === 'ERR_JWT_ISSUER_INVALID') {
        throw new Error(this.i18n.t('common.jwt.issuerMismatch', { lang }));
      }
      if (error.code === 'ERR_JWKS_NO_MATCHING_KEY') {
        throw new Error(this.i18n.t('common.jwt.noMatchingKey', { lang }));
      }

      // Try fallback to local JWKS if available
      if (this.localJWKS) {
        try {
          const { payload } = await jwtVerify(token, this.localJWKS, {
            issuer: this.issuer,
            algorithms: ['RS256'],
            clockTolerance: '60s',
          });
          this.logger.warn(
            'Using local JWKS fallback after remote verification failed',
          );
          return payload as AccessUser;
        } catch (localError) {
          this.logger.error(
            `Local JWKS fallback also failed: ${localError.message}`,
          );
        }
      }

      // Log the error for debugging
      this.logger.warn(`JWT verification failed: ${error.message}`);

      // Default to unauthorized error for any unhandled cases
      throw new Error(this.i18n.t('auth.errors.unauthorized', { lang }));
    }
  }
}
