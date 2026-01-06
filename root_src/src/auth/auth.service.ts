import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import {
  createRemoteJWKSet,
  createLocalJWKSet,
  jwtVerify,
  JWTPayload,
} from 'jose';
import { I18nService } from 'nestjs-i18n';
import fs from 'node:fs';
import path from 'node:path';

export type AuthMode = 'local' | 'keycloak';

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
  private readonly authMode: AuthMode;
  private issuer?: string;
  private audience?: string;
  private jwksUri?: string;

  private remoteJWKS: ReturnType<typeof createRemoteJWKSet> | undefined;
  private localJWKS: ReturnType<typeof createLocalJWKSet> | undefined;

  constructor(private readonly i18n: I18nService) {
    // Determine authentication mode (default: 'local')
    this.authMode = (process.env.AUTH_MODE as AuthMode) || 'local';
    this.logger.log(`Initializing AuthService in '${this.authMode}' mode`);

    if (this.authMode === 'keycloak') {
      // Keycloak mode: require ISSUER and AUDIENCE
      this.initKeycloakMode();
    } else {
      // Local mode: use local JWKS file only
      this.initLocalMode();
    }
  }

  /**
   * Initialize Keycloak SSO mode (original behavior)
   * Requires ISSUER and AUDIENCE environment variables
   */
  private initKeycloakMode(): void {
    const issuer = process.env.ISSUER;
    const audience = process.env.AUDIENCE;

    if (!issuer) {
      this.logger.error(
        'ISSUER environment variable is required for Keycloak mode',
      );
      throw new Error(
        'ISSUER environment variable is required for Keycloak mode',
      );
    }
    if (!audience) {
      this.logger.error(
        'AUDIENCE environment variable is required for Keycloak mode',
      );
      throw new Error(
        'AUDIENCE environment variable is required for Keycloak mode',
      );
    }

    this.issuer = issuer;
    this.audience = audience;
    this.jwksUri = `${this.issuer}/protocol/openid-connect/certs`;

    this.logger.log(`Keycloak issuer: ${this.issuer}`);

    try {
      this.remoteJWKS = createRemoteJWKSet(new URL(this.jwksUri));
      this.logger.log(`Remote JWKS created for: ${this.jwksUri}`);
    } catch (error) {
      this.logger.error(`Failed to create remote JWKS: ${error.message}`);
      throw new Error(`Invalid ISSUER URL: ${this.issuer}`);
    }

    // Load local JWKS as fallback for Keycloak mode
    this.loadLocalJWKS();
  }

  /**
   * Initialize local JWKS mode (no external SSO)
   * Uses local JWKS file for token verification
   */
  private initLocalMode(): void {
    this.logger.log('Using local JWKS mode - no external SSO required');

    // Load local JWKS file as primary source
    if (!this.loadLocalJWKS()) {
      this.logger.error('Local JWKS file is required for local auth mode');
      throw new Error(
        'Local JWKS file not found. Create config/jwks/jwks.json with your JWKS keys.',
      );
    }

    this.logger.log('Local auth mode initialized successfully');
  }

  /**
   * Load local JWKS file from config/jwks/jwks.json
   * @returns true if loaded successfully, false otherwise
   */
  private loadLocalJWKS(): boolean {
    // Try multiple paths for local JWKS file
    const jwksPaths = [
      './config/jwks/jwks.json',
      './jwks.json',
      path.join(process.cwd(), 'config/jwks/jwks.json'),
      path.join(process.cwd(), 'jwks.json'),
    ];

    for (const jwksPath of jwksPaths) {
      try {
        if (fs.existsSync(jwksPath)) {
          const jwksData = JSON.parse(fs.readFileSync(jwksPath, 'utf8'));
          this.localJWKS = createLocalJWKSet(jwksData);
          this.logger.log(`Loaded local JWKS from: ${jwksPath}`);
          return true;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to load JWKS from ${jwksPath}: ${error.message}`,
        );
      }
    }

    this.logger.warn('No local JWKS file found');
    return false;
  }

  async onModuleInit() {
    // Only warm up JWKS cache in Keycloak mode
    if (this.authMode === 'keycloak' && this.remoteJWKS) {
      try {
        this.logger.log(`Warming JWKS cache from ${this.jwksUri}...`);
        await jwtVerify('invalid.token.value', this.remoteJWKS).catch(() => {});
        this.logger.log('JWKS cache warmed successfully');
      } catch (err) {
        this.logger.error(`Failed to warm JWKS: ${err.message}`);
      }
    }
  }

  async verifyAccessToken(token: string, lang?: string): Promise<AccessUser> {
    // Quick sanity check
    if (!token || token.length > 8192) {
      throw new Error(
        this.i18n.t('auth.errors.tokenMissingOrTooLarge', { lang }),
      );
    }

    if (this.authMode === 'local') {
      return this.verifyWithLocalJWKS(token, lang);
    } else {
      return this.verifyWithKeycloak(token, lang);
    }
  }

  /**
   * Verify token using local JWKS only (no issuer/audience validation)
   */
  private async verifyWithLocalJWKS(
    token: string,
    lang?: string,
  ): Promise<AccessUser> {
    try {
      const { payload } = await jwtVerify(token, this.localJWKS!, {
        algorithms: ['RS256'],
        clockTolerance: '60s',
        // No issuer validation in local mode - accept tokens from any issuer
      });

      return payload as AccessUser;
    } catch (error) {
      this.handleVerificationError(error, lang);
    }
  }

  /**
   * Verify token using Keycloak remote JWKS (original behavior)
   */
  private async verifyWithKeycloak(
    token: string,
    lang?: string,
  ): Promise<AccessUser> {
    try {
      const { payload } = await jwtVerify(token, this.remoteJWKS!, {
        issuer: this.issuer,
        algorithms: ['RS256'],
        clockTolerance: '60s',
      });

      // Ensure correct audience
      const aud = payload.aud;
      const hasAudience =
        (Array.isArray(aud) && aud.includes(this.audience!)) ||
        (typeof aud === 'string' && aud === this.audience);

      if (!hasAudience) {
        throw new Error(this.i18n.t('auth.errors.invalidAudience', { lang }));
      }

      return payload as AccessUser;
    } catch (error) {
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

      this.handleVerificationError(error, lang);
    }
  }

  /**
   * Handle JWT verification errors with i18n messages
   */
  private handleVerificationError(error: any, lang?: string): never {
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

    this.logger.warn(`JWT verification failed: ${error.message}`);
    throw new Error(this.i18n.t('auth.errors.unauthorized', { lang }));
  }
}
