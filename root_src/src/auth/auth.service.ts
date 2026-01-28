import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { jwtVerify, importSPKI } from 'jose';
import { I18nService } from 'nestjs-i18n';
import * as fs from 'node:fs';
import * as path from 'node:path';

export type AuthMode = 'local' | 'keycloak';

export type AccessUser = {
  sub: string;
  name?: string;
  email?: string;
  roles?: string;
  permissions?: string[];
  exp?: number;
  iat?: number;
  jti?: string;
};

/** Default path for public key file */
const DEFAULT_PUBLIC_KEY_PATH = './src/config/encryption-keys/public-key.json';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly authMode: AuthMode;
  private publicKey: Awaited<ReturnType<typeof importSPKI>> | null = null;

  constructor(private readonly i18n: I18nService) {
    // Determine authentication mode (default: 'local')
    this.authMode = (process.env.AUTH_MODE as AuthMode) || 'local';
    this.logger.log(`Initializing AuthService in '${this.authMode}' mode`);

    if (this.authMode === 'keycloak') {
      this.logger.warn(
        'Keycloak mode is deprecated. Please migrate to local mode with encryption keys.',
      );
      throw new Error(
        'Keycloak mode is no longer supported. Use AUTH_MODE=local with encryption keys.',
      );
    }
  }

  async onModuleInit() {
    await this.loadPublicKey();
  }

  /**
   * Load public key from encryption-keys for JWT verification
   */
  private async loadPublicKey(): Promise<void> {
    const keyPaths = [
      process.env.JWT_PUBLIC_KEY_PATH || DEFAULT_PUBLIC_KEY_PATH,
      path.join(process.cwd(), DEFAULT_PUBLIC_KEY_PATH),
      './src/config/encryption-keys/public-key.json',
      path.join(process.cwd(), 'src/config/encryption-keys/public-key.json'),
    ];

    for (const keyPath of keyPaths) {
      try {
        if (fs.existsSync(keyPath)) {
          const keyFileContent = fs.readFileSync(keyPath, 'utf8');
          const keyData = JSON.parse(keyFileContent);
          const publicKeyPem = keyData.PUBLIC_KEY_MY_KEY;

          if (!publicKeyPem) {
            throw new Error('PUBLIC_KEY_MY_KEY not found in key file');
          }

          // Import the PEM public key for RS256 verification
          this.publicKey = await importSPKI(publicKeyPem, 'RS256');
          this.logger.log(`Loaded public key from: ${keyPath}`);
          return;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to load public key from ${keyPath}: ${error.message}`,
        );
      }
    }

    this.logger.error('No public key file found for JWT verification');
    throw new Error(
      'Public key file not found. Ensure src/config/encryption-keys/public-key.json exists.',
    );
  }

  /**
   * Verify access token using encryption public key
   */
  async verifyAccessToken(token: string, lang?: string): Promise<AccessUser> {
    // Quick sanity check
    if (!token || token.length > 8192) {
      throw new Error(
        this.i18n.t('auth.errors.tokenMissingOrTooLarge', { lang }),
      );
    }

    if (!this.publicKey) {
      throw new Error(this.i18n.t('auth.errors.serverNotReady', { lang }));
    }

    try {
      const { payload } = await jwtVerify(token, this.publicKey, {
        algorithms: ['RS256'],
        clockTolerance: '60s',
      });

      return payload as AccessUser;
    } catch (error) {
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
    if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      throw new Error(this.i18n.t('common.jwt.signatureInvalid', { lang }));
    }

    this.logger.warn(`JWT verification failed: ${error.message}`);
    throw new Error(this.i18n.t('auth.errors.unauthorized', { lang }));
  }
}
