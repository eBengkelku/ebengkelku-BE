/**
 * JWT Service
 *
 * Service for generating JWT access tokens.
 * Uses RS256 algorithm with encryption private key.
 *
 * @module Libs/JWT/Services
 * @version 1.0.0
 * @since 2026-01-27
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';
import { SignJWT } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

import { JwtRepository } from './jwt.repository';
import {
  IJwtPayload,
  IJwtGenerationOptions,
  IUserData,
  IRoleData,
  IJwtService,
} from '../interfaces';
import { JwtErrorCode, JwtErrorI18nKeys } from '../errors';
import {
  JWT_ALGORITHM,
  JWT_TOKEN_TYPE,
  JWT_DEFAULT_EXPIRATION_MS,
  JWT_ENV_VARS,
  JWT_DEFAULT_JTI_PREFIX,
  UUID_V4_REGEX,
} from '../constants/jwt.constants';

/** Default path for private key file */
const DEFAULT_PRIVATE_KEY_PATH =
  './src/config/encryption-keys/private-key.json';

/**
 * JWT Generation Service
 *
 * Generates access tokens with user data, roles, and permissions.
 */
@Injectable()
export class JwtService implements IJwtService, OnModuleInit {
  private readonly logger = new Logger(JwtService.name);
  private signingKey: crypto.KeyObject | null = null;
  private readonly expirationMs: number;
  private readonly privateKeyPath: string;
  private readonly passphrase: string;

  constructor(
    private readonly repository: JwtRepository,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
  ) {
    // Load configuration
    this.expirationMs =
      this.configService.get<number>(JWT_ENV_VARS.EXPIRED_TIME) ??
      JWT_DEFAULT_EXPIRATION_MS;
    this.privateKeyPath =
      this.configService.get<string>('JWT_PRIVATE_KEY_PATH') ??
      DEFAULT_PRIVATE_KEY_PATH;
    this.passphrase =
      this.configService.get<string>('ENCRYPTION_KEY_PASSPHRASE') ?? '';

    this.logger.log(
      `JwtService configured with expiration: ${this.expirationMs}ms`,
    );
  }

  /**
   * Initialize service on module init
   */
  async onModuleInit(): Promise<void> {
    await this.loadSigningKey();
  }

  /**
   * Check if the service is ready to generate tokens
   */
  isReady(): boolean {
    return this.signingKey !== null;
  }

  /**
   * Generate access token for a user
   *
   * @param publicId - User's public_id (sub claim)
   * @param options - Optional generation options
   * @returns Signed JWT token string
   * @throws Error if user not found, role not found, or signing fails
   */
  async generateAccessToken(
    publicId: string,
    options?: IJwtGenerationOptions,
  ): Promise<string> {
    // Validate service is ready
    if (!this.isReady()) {
      throw new Error(
        this.i18n.t(JwtErrorI18nKeys[JwtErrorCode.SERVICE_NOT_INITIALIZED]),
      );
    }

    // Validate public_id format
    if (!this.isValidUuid(publicId)) {
      throw new Error(
        this.i18n.t(JwtErrorI18nKeys[JwtErrorCode.INVALID_PUBLIC_ID]),
      );
    }

    // Lookup user
    const userData = await this.repository.findUserByPublicId(publicId);
    if (!userData) {
      throw new Error(
        this.i18n.t(JwtErrorI18nKeys[JwtErrorCode.USER_NOT_FOUND]),
      );
    }

    // Lookup user role
    const roleData = await this.repository.findUserRole(userData.id);
    if (!roleData) {
      throw new Error(
        this.i18n.t(JwtErrorI18nKeys[JwtErrorCode.ROLE_NOT_FOUND]),
      );
    }

    // Lookup permissions
    const permissions = await this.repository.findRolePermissions(roleData.id);

    // Build payload
    const payload = this.buildPayload(userData, roleData, permissions, options);

    // Sign and return token
    return this.signToken(payload);
  }

  /**
   * Build JWT payload from user data
   *
   * @param userData - User data from repository
   * @param roleData - Role data
   * @param permissions - Array of permission keys
   * @param options - Generation options
   * @returns Complete JWT payload
   */
  private buildPayload(
    userData: IUserData,
    roleData: IRoleData,
    permissions: string[],
    options?: IJwtGenerationOptions,
  ): IJwtPayload {
    const now = Math.floor(Date.now() / 1000);
    const expirationMs = options?.expiresInMs ?? this.expirationMs;
    const expirationSeconds = Math.floor(expirationMs / 1000);
    const authTime = options?.authTime
      ? Math.floor(options.authTime.getTime() / 1000)
      : now;
    const jtiPrefix = options?.jtiPrefix ?? JWT_DEFAULT_JTI_PREFIX;

    return {
      exp: now + expirationSeconds,
      iat: now,
      auth_time: authTime,
      jti: this.generateJti(jtiPrefix),
      sub: userData.public_id,
      typ: JWT_TOKEN_TYPE,
      roles: roleData.id,
      permissions,
      name: userData.name,
      email: userData.email,
    };
  }

  /**
   * Sign payload using RS256 with private key
   *
   * @param payload - JWT payload
   * @returns Signed JWT string
   */
  private async signToken(payload: IJwtPayload): Promise<string> {
    try {
      const jwt = await new SignJWT({ ...payload })
        .setProtectedHeader({
          alg: JWT_ALGORITHM,
          typ: 'JWT',
        })
        .setIssuedAt(payload.iat)
        .setExpirationTime(payload.exp)
        .sign(this.signingKey!);

      return jwt;
    } catch (error) {
      this.logger.error(`Failed to sign token: ${error.message}`, error.stack);
      throw new Error(
        this.i18n.t(JwtErrorI18nKeys[JwtErrorCode.TOKEN_GENERATION_FAILED]),
      );
    }
  }

  /**
   * Load private key for signing from encryption keys
   */
  private async loadSigningKey(): Promise<void> {
    try {
      // Try multiple paths for private key file
      const keyPaths = [
        this.privateKeyPath,
        path.join(process.cwd(), this.privateKeyPath),
        path.join(process.cwd(), 'src/config/encryption-keys/private-key.json'),
        './src/config/encryption-keys/private-key.json',
      ];

      let keyFileContent: string | null = null;
      let usedPath: string = '';

      for (const keyPath of keyPaths) {
        try {
          if (fs.existsSync(keyPath)) {
            keyFileContent = fs.readFileSync(keyPath, 'utf8');
            usedPath = keyPath;
            this.logger.log(`Found private key file at: ${keyPath}`);
            break;
          }
        } catch {
          // Try next path
        }
      }

      if (!keyFileContent) {
        throw new Error('Private key file not found');
      }

      // Parse the key file
      const keyData = JSON.parse(keyFileContent);
      const encryptedPem = keyData.PRIVATE_KEY_MY_KEY;

      if (!encryptedPem) {
        throw new Error('Private key PEM not found in key file');
      }

      // Decrypt the private key using passphrase
      if (!this.passphrase) {
        throw new Error(
          'ENCRYPTION_KEY_PASSPHRASE not configured - required for JWT signing',
        );
      }

      this.signingKey = crypto.createPrivateKey({
        key: encryptedPem,
        format: 'pem',
        passphrase: this.passphrase,
      });

      this.logger.log(`JWT signing key loaded successfully from: ${usedPath}`);
    } catch (error) {
      this.logger.error(
        `Failed to load signing key: ${error.message}`,
        error.stack,
      );
      // Don't throw - service can still be used but will fail on token generation
    }
  }

  /**
   * Generate unique JTI (JWT ID)
   *
   * @param prefix - Prefix for the JTI
   * @returns Unique JTI string in format "prefix:uuid-v4"
   */
  private generateJti(prefix: string): string {
    return `${prefix}:${uuidv4()}`;
  }

  /**
   * Validate UUID v4 format
   *
   * @param uuid - String to validate
   * @returns True if valid UUID v4
   */
  private isValidUuid(uuid: string): boolean {
    return UUID_V4_REGEX.test(uuid);
  }
}
