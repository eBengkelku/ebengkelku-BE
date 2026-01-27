/**
 * Encryption Health Service
 *
 * Validates encryption keys and passphrase before application startup.
 * This service performs health checks to ensure:
 * 1. Encryption key files exist (public-key.json, private-key.json)
 * 2. ENCRYPTION_KEY_PASSPHRASE is set and matches the private key
 * 3. Round-trip encryption/decryption works correctly
 *
 * @module Common/Health/Services
 * @version 1.0.0
 */

import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  ENCRYPTION_KEY_PATHS,
  ENCRYPTION_ENV_VARS,
  ENCRYPTION_KEY_NAMES,
  ENCRYPTION_HEALTH_ERROR_CODES,
  ENCRYPTION_HEALTH_LOG_MESSAGES,
  ENCRYPTION_ALGORITHMS,
  KEY_CONFIG,
  HEALTH_SERVICE_NAMES,
} from '../constants/encryption-health.constants';
import {
  IEncryptionHealthResult,
  IEncryptionHealthOptions,
  IEncryptionHealthService,
  IEncryptedData,
} from '../interfaces/encryption-health.interfaces';

/**
 * Service for validating encryption keys health before application startup
 *
 * This is a standalone service that can be used without NestJS dependency injection
 * to validate encryption keys before the application bootstrap process.
 */
export class EncryptionHealthService implements IEncryptionHealthService {
  private publicKeyPath: string;
  private privateKeyPath: string;
  private passphrase: string | undefined;
  private publicKey: crypto.KeyObject | null = null;
  private privateKey: crypto.KeyObject | null = null;

  constructor() {
    this.publicKeyPath = this.getKeyPath(
      ENCRYPTION_ENV_VARS.PUBLIC_KEY_PATH,
      ENCRYPTION_KEY_PATHS.PUBLIC_KEY,
    );
    this.privateKeyPath = this.getKeyPath(
      ENCRYPTION_ENV_VARS.PRIVATE_KEY_PATH,
      ENCRYPTION_KEY_PATHS.PRIVATE_KEY,
    );
    this.passphrase = process.env[ENCRYPTION_ENV_VARS.PASSPHRASE];
  }

  /**
   * Gets key file path from environment or default
   * @param envVar - Environment variable name
   * @param defaultPath - Default path if env var not set
   * @returns Resolved file path
   */
  private getKeyPath(envVar: string, defaultPath: string): string {
    const envPath = process.env[envVar];
    const keyPath = envPath || defaultPath;
    return path.resolve(process.cwd(), keyPath);
  }

  /**
   * Checks if encryption key files exist
   * @returns True if both key files exist
   */
  checkKeysExist(): boolean {
    const publicKeyExists = fs.existsSync(this.publicKeyPath);
    const privateKeyExists = fs.existsSync(this.privateKeyPath);
    return publicKeyExists && privateKeyExists;
  }

  /**
   * Checks if public key file exists
   * @returns True if public key file exists
   */
  checkPublicKeyExists(): boolean {
    return fs.existsSync(this.publicKeyPath);
  }

  /**
   * Checks if private key file exists
   * @returns True if private key file exists
   */
  checkPrivateKeyExists(): boolean {
    return fs.existsSync(this.privateKeyPath);
  }

  /**
   * Reads and parses a JSON key file
   * @param filePath - Path to key file
   * @returns Parsed JSON content
   * @throws Error if file cannot be read
   */
  private readKeyFile(filePath: string): Record<string, unknown> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Key file not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * Loads encryption keys from files
   * @throws Error if keys cannot be loaded
   */
  private loadKeys(): void {
    // Load public key
    const publicKeyJson = this.readKeyFile(this.publicKeyPath);
    const publicKeyPem = publicKeyJson[ENCRYPTION_KEY_NAMES.PUBLIC] as string;
    if (!publicKeyPem) {
      throw new Error(`Public key not found in file: ${this.publicKeyPath}`);
    }
    this.publicKey = crypto.createPublicKey(publicKeyPem);

    // Load private key (with passphrase)
    const privateKeyJson = this.readKeyFile(this.privateKeyPath);
    const privateKeyPem = privateKeyJson[
      ENCRYPTION_KEY_NAMES.PRIVATE
    ] as string;
    if (!privateKeyPem) {
      throw new Error(`Private key not found in file: ${this.privateKeyPath}`);
    }

    if (!this.passphrase) {
      throw new Error(
        `Passphrase not found in environment variable: ${ENCRYPTION_ENV_VARS.PASSPHRASE}`,
      );
    }

    this.privateKey = crypto.createPrivateKey({
      key: privateKeyPem,
      passphrase: this.passphrase,
    });
  }

  /**
   * Encrypts plaintext using hybrid RSA+AES encryption
   * @param plaintext - Data to encrypt
   * @returns Encrypted data structure
   */
  private encrypt(plaintext: string): IEncryptedData {
    if (!this.publicKey) {
      throw new Error('Public key not loaded');
    }

    // Generate random AES key
    const aesKey = crypto.randomBytes(KEY_CONFIG.AES_KEY_SIZE);
    const iv = crypto.randomBytes(KEY_CONFIG.IV_SIZE);

    // Encrypt data with AES-256-GCM
    const cipher = crypto.createCipheriv(
      ENCRYPTION_ALGORITHMS.AES,
      aesKey,
      iv,
      { authTagLength: KEY_CONFIG.AUTH_TAG_LENGTH },
    );

    const encryptedBuffer = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    // Encrypt AES key with RSA-OAEP
    const encryptedKey = crypto.publicEncrypt(
      {
        key: this.publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: ENCRYPTION_ALGORITHMS.OAEP_HASH,
      },
      aesKey,
    );

    return {
      ciphertext: encryptedBuffer.toString('base64'),
      iv: iv.toString('base64'),
      tag: authTag.toString('base64'),
      encryptedKey: encryptedKey.toString('base64'),
      algorithm: ENCRYPTION_ALGORITHMS.AES,
      encryptedAt: new Date().toISOString(),
    };
  }

  /**
   * Decrypts encrypted data back to plaintext
   * @param encryptedData - Encrypted data structure
   * @returns Original plaintext
   */
  private decrypt(encryptedData: IEncryptedData): string {
    if (!this.privateKey) {
      throw new Error('Private key not loaded');
    }

    // Decrypt AES key with RSA-OAEP
    const encryptedKey = Buffer.from(encryptedData.encryptedKey, 'base64');
    const aesKey = crypto.privateDecrypt(
      {
        key: this.privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: ENCRYPTION_ALGORITHMS.OAEP_HASH,
      },
      encryptedKey,
    );

    // Prepare decryption components
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');
    const authTag = Buffer.from(encryptedData.tag, 'base64');

    // Decrypt with AES-256-GCM
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_ALGORITHMS.AES,
      aesKey,
      iv,
      { authTagLength: KEY_CONFIG.AUTH_TAG_LENGTH },
    );

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  /**
   * Validates the passphrase by loading private key and performing round-trip test
   * @returns True if passphrase is valid
   */
  async validatePassphrase(): Promise<boolean> {
    try {
      // Load keys (will throw if passphrase is wrong)
      this.loadKeys();

      // Perform round-trip test
      const testData = 'encryption-health-check-validation-test';
      const encrypted = this.encrypt(testData);
      const decrypted = this.decrypt(encrypted);

      return decrypted === testData;
    } catch {
      return false;
    }
  }

  /**
   * Performs full health check validation
   * @param options - Optional configuration for health check
   * @returns Health check result
   */
  async checkHealth(
    options?: IEncryptionHealthOptions,
  ): Promise<IEncryptionHealthResult> {
    const checkedAt = new Date().toISOString();
    const publicKeyExists = this.checkPublicKeyExists();
    const privateKeyExists = this.checkPrivateKeyExists();

    // Check if keys exist
    if (!publicKeyExists && !privateKeyExists) {
      return {
        isHealthy: false,
        errorCode: ENCRYPTION_HEALTH_ERROR_CODES.KEYS_NOT_FOUND,
        errorMessage: `Both encryption key files not found. Expected at: ${this.publicKeyPath} and ${this.privateKeyPath}`,
        publicKeyExists,
        privateKeyExists,
        checkedAt,
      };
    }

    if (!publicKeyExists) {
      return {
        isHealthy: false,
        errorCode: ENCRYPTION_HEALTH_ERROR_CODES.PUBLIC_KEY_NOT_FOUND,
        errorMessage: `Public key file not found at: ${this.publicKeyPath}`,
        publicKeyExists,
        privateKeyExists,
        checkedAt,
      };
    }

    if (!privateKeyExists) {
      return {
        isHealthy: false,
        errorCode: ENCRYPTION_HEALTH_ERROR_CODES.PRIVATE_KEY_NOT_FOUND,
        errorMessage: `Private key file not found at: ${this.privateKeyPath}`,
        publicKeyExists,
        privateKeyExists,
        checkedAt,
      };
    }

    // Skip passphrase validation if requested
    if (options?.skipPassphraseValidation) {
      return {
        isHealthy: true,
        publicKeyExists,
        privateKeyExists,
        checkedAt,
      };
    }

    // Check if passphrase is set
    if (!this.passphrase) {
      return {
        isHealthy: false,
        errorCode: ENCRYPTION_HEALTH_ERROR_CODES.PASSPHRASE_NOT_SET,
        errorMessage: `Environment variable ${ENCRYPTION_ENV_VARS.PASSPHRASE} is not set`,
        publicKeyExists,
        privateKeyExists,
        passphraseValid: false,
        checkedAt,
      };
    }

    // Validate passphrase with round-trip test
    try {
      const passphraseValid = await this.validatePassphrase();

      if (!passphraseValid) {
        return {
          isHealthy: false,
          errorCode: ENCRYPTION_HEALTH_ERROR_CODES.KEY_VALIDATION_FAILED,
          errorMessage:
            'Encryption round-trip validation failed. Keys may be corrupted.',
          publicKeyExists,
          privateKeyExists,
          passphraseValid: false,
          checkedAt,
        };
      }

      return {
        isHealthy: true,
        publicKeyExists,
        privateKeyExists,
        passphraseValid: true,
        checkedAt,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Check if it's a passphrase error
      if (
        errorMessage.includes('bad decrypt') ||
        errorMessage.includes('wrong password') ||
        errorMessage.includes('passphrase')
      ) {
        return {
          isHealthy: false,
          errorCode: ENCRYPTION_HEALTH_ERROR_CODES.PASSPHRASE_INVALID,
          errorMessage: `Invalid passphrase for private key: ${errorMessage}`,
          publicKeyExists,
          privateKeyExists,
          passphraseValid: false,
          checkedAt,
        };
      }

      return {
        isHealthy: false,
        errorCode: ENCRYPTION_HEALTH_ERROR_CODES.HEALTH_CHECK_FAILED,
        errorMessage: `Encryption health check failed: ${errorMessage}`,
        publicKeyExists,
        privateKeyExists,
        passphraseValid: false,
        checkedAt,
      };
    }
  }

  /**
   * Throws a fatal error that should stop application startup
   * @param errorCode - Error code for the failure
   * @param message - Human-readable error message
   */
  throwFatalError(errorCode: string, message: string): never {
    const fullMessage = `[${HEALTH_SERVICE_NAMES.ENCRYPTION_HEALTH}] FATAL: ${message} (${errorCode})`;
    console.error('\x1b[31m%s\x1b[0m', fullMessage); // Red color for fatal error
    console.error(
      '\x1b[33m%s\x1b[0m',
      'Application cannot start without valid encryption keys.',
    );
    console.error(
      '\x1b[33m%s\x1b[0m',
      'Please generate encryption keys using: pnpm run generate:encryption-keys',
    );
    throw new Error(fullMessage);
  }
}

/**
 * Standalone validation function for use in main.ts before NestJS bootstrap
 * Validates encryption keys and throws fatal error if validation fails
 */
export async function validateEncryptionKeysHealth(): Promise<void> {
  const healthService = new EncryptionHealthService();

  console.log(
    `[${HEALTH_SERVICE_NAMES.ENCRYPTION_HEALTH}] ${ENCRYPTION_HEALTH_LOG_MESSAGES.HEALTH_CHECK_STARTED}`,
  );

  const result = await healthService.checkHealth();

  if (!result.isHealthy) {
    healthService.throwFatalError(
      result.errorCode || ENCRYPTION_HEALTH_ERROR_CODES.HEALTH_CHECK_FAILED,
      result.errorMessage || ENCRYPTION_HEALTH_LOG_MESSAGES.HEALTH_CHECK_FAILED,
    );
  }

  console.log(
    '\x1b[32m%s\x1b[0m',
    `[${HEALTH_SERVICE_NAMES.ENCRYPTION_HEALTH}] ${ENCRYPTION_HEALTH_LOG_MESSAGES.HEALTH_CHECK_PASSED}`,
  );
}
