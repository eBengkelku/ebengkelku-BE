/**
 * Encryption Service
 *
 * Provides hybrid RSA-OAEP + AES-256-GCM encryption for user PII data.
 * Uses RSA to encrypt a randomly generated AES key, then AES to encrypt the data.
 * This approach allows encrypting data of any size while maintaining security.
 *
 * Time Complexity: O(n) where n is the size of data being encrypted
 * Space Complexity: O(n) for storing encrypted output
 *
 * @module UserEncryption/Services
 * @version 1.0.0
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  IEncryptedData,
  IEncryptionService,
} from '../interfaces/encryption.interfaces';
import {
  ENCRYPTION_ALGORITHMS,
  KEY_CONFIG,
  FILE_PATHS,
  KEY_NAMES,
  ERROR_CODES,
  LOG_MESSAGES,
  SERVICE_NAMES,
  OPERATIONS,
  ENV_VARS,
} from '../constants/encryption.constants';

/**
 * Service for encrypting and decrypting user PII data using hybrid encryption
 *
 * Algorithm:
 * 1. Generate random 256-bit AES key
 * 2. Encrypt data with AES-256-GCM (provides confidentiality + integrity)
 * 3. Encrypt AES key with RSA-OAEP (secure key exchange)
 * 4. Return encrypted data + encrypted key + IV + auth tag
 */
@Injectable()
export class EncryptionService implements IEncryptionService, OnModuleInit {
  private publicKey: crypto.KeyObject | null = null;
  private privateKey: crypto.KeyObject | null = null;
  private isInitialized = false;

  constructor(
    @InjectPinoLogger(EncryptionService.name)
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Initializes the service by loading encryption keys
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.loadKeys();
      this.isInitialized = true;
      this.logger.info({
        service: SERVICE_NAMES.ENCRYPTION,
        operation: OPERATIONS.LOAD_KEYS,
        message: LOG_MESSAGES.KEYS_LOADED,
      });
    } catch (error) {
      this.logger.error({
        service: SERVICE_NAMES.ENCRYPTION,
        operation: OPERATIONS.LOAD_KEYS,
        errorCode: ERROR_CODES.KEY_NOT_FOUND,
        message: 'Failed to load encryption keys on init',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      // Don't throw - allow service to start, keys can be loaded later
    }
  }

  /**
   * Loads RSA key pair from JSON files
   *
   * Time Complexity: O(1) - File I/O operation
   * @throws Error if keys cannot be loaded
   */
  private async loadKeys(): Promise<void> {
    const publicKeyPath = this.getKeyPath(
      ENV_VARS.PUBLIC_KEY_PATH,
      FILE_PATHS.PUBLIC_KEY,
    );
    const privateKeyPath = this.getKeyPath(
      ENV_VARS.PRIVATE_KEY_PATH,
      FILE_PATHS.PRIVATE_KEY,
    );
    const passphrase = this.configService.get<string>(ENV_VARS.PASSPHRASE);

    // Load public key
    const publicKeyJson = this.readKeyFile(publicKeyPath);
    const publicKeyPem = publicKeyJson[KEY_NAMES.PUBLIC] as string;
    if (!publicKeyPem) {
      throw new Error(`Public key not found in file: ${publicKeyPath}`);
    }
    this.publicKey = crypto.createPublicKey(publicKeyPem);

    // Load private key (with passphrase)
    const privateKeyJson = this.readKeyFile(privateKeyPath);
    const privateKeyPem = privateKeyJson[KEY_NAMES.PRIVATE] as string;
    if (!privateKeyPem) {
      throw new Error(`Private key not found in file: ${privateKeyPath}`);
    }

    if (!passphrase) {
      throw new Error(
        `Passphrase not found in environment variable: ${ENV_VARS.PASSPHRASE}`,
      );
    }

    this.privateKey = crypto.createPrivateKey({
      key: privateKeyPem,
      passphrase: passphrase,
    });
  }

  /**
   * Gets key file path from environment or default
   * @param envVar - Environment variable name
   * @param defaultPath - Default path if env var not set
   * @returns Resolved file path
   */
  private getKeyPath(envVar: string, defaultPath: string): string {
    const envPath = this.configService.get<string>(envVar);
    const keyPath = envPath || defaultPath;
    return path.resolve(process.cwd(), keyPath);
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
   * Encrypts plaintext using hybrid RSA+AES encryption
   *
   * Algorithm:
   * 1. Generate random 256-bit AES key using CSPRNG
   * 2. Generate random 128-bit IV
   * 3. Encrypt plaintext with AES-256-GCM
   * 4. Encrypt AES key with RSA-OAEP
   * 5. Return all components as base64
   *
   * Time Complexity: O(n) where n is plaintext length
   * Space Complexity: O(n) for encrypted output
   *
   * @param plaintext - Data to encrypt
   * @returns Encrypted data structure with all components
   * @throws Error if encryption fails
   */
  encrypt(plaintext: string): IEncryptedData {
    this.ensureInitialized();

    if (!plaintext) {
      throw new Error('Cannot encrypt empty or null data');
    }

    try {
      // Step 1: Generate random AES key (256 bits = 32 bytes)
      const aesKey = crypto.randomBytes(KEY_CONFIG.AES_KEY_SIZE);

      // Step 2: Generate random IV (128 bits = 16 bytes)
      const iv = crypto.randomBytes(KEY_CONFIG.IV_SIZE);

      // Step 3: Encrypt data with AES-256-GCM
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

      // Step 4: Encrypt AES key with RSA-OAEP
      const encryptedKey = crypto.publicEncrypt(
        {
          key: this.publicKey!,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: ENCRYPTION_ALGORITHMS.OAEP_HASH,
        },
        aesKey,
      );

      // Step 5: Return encrypted data structure
      return {
        ciphertext: encryptedBuffer.toString('base64'),
        iv: iv.toString('base64'),
        tag: authTag.toString('base64'),
        encryptedKey: encryptedKey.toString('base64'),
        algorithm: ENCRYPTION_ALGORITHMS.AES,
        encryptedAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error({
        service: SERVICE_NAMES.ENCRYPTION,
        operation: OPERATIONS.ENCRYPT,
        errorCode: ERROR_CODES.ENCRYPTION_FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Decrypts encrypted data back to plaintext
   *
   * Algorithm:
   * 1. Decrypt AES key with RSA-OAEP (private key)
   * 2. Decrypt ciphertext with AES-256-GCM using decrypted key
   * 3. Verify authentication tag
   * 4. Return plaintext
   *
   * Time Complexity: O(n) where n is ciphertext length
   * Space Complexity: O(n) for decrypted output
   *
   * @param encryptedData - Encrypted data structure
   * @returns Original plaintext
   * @throws Error if decryption fails or tag verification fails
   */
  decrypt(encryptedData: IEncryptedData): string {
    this.ensureInitialized();

    if (!encryptedData?.ciphertext) {
      throw new Error('Invalid encrypted data structure');
    }

    try {
      // Step 1: Decrypt AES key with RSA-OAEP
      const encryptedKey = Buffer.from(encryptedData.encryptedKey, 'base64');
      const aesKey = crypto.privateDecrypt(
        {
          key: this.privateKey!,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: ENCRYPTION_ALGORITHMS.OAEP_HASH,
        },
        encryptedKey,
      );

      // Step 2: Prepare decryption components
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');
      const authTag = Buffer.from(encryptedData.tag, 'base64');

      // Step 3: Decrypt with AES-256-GCM
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
    } catch (error) {
      this.logger.error({
        service: SERVICE_NAMES.ENCRYPTION,
        operation: OPERATIONS.DECRYPT,
        errorCode: ERROR_CODES.DECRYPTION_FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Validates that encryption keys are properly loaded and functional
   *
   * Performs a round-trip encryption/decryption test
   *
   * @returns True if keys are valid and functional
   */
  validateKeys(): boolean {
    if (!this.isInitialized || !this.publicKey || !this.privateKey) {
      this.logger.warn({
        service: SERVICE_NAMES.ENCRYPTION,
        operation: OPERATIONS.VALIDATE_KEYS,
        message: LOG_MESSAGES.KEYS_VALIDATION_FAILED,
        reason: 'Keys not initialized',
      });
      return false;
    }

    try {
      // Perform round-trip test
      const testData = 'encryption-validation-test-data';
      const encrypted = this.encrypt(testData);
      const decrypted = this.decrypt(encrypted);

      const isValid = decrypted === testData;

      if (!isValid) {
        this.logger.warn({
          service: SERVICE_NAMES.ENCRYPTION,
          operation: OPERATIONS.VALIDATE_KEYS,
          message: LOG_MESSAGES.KEYS_VALIDATION_FAILED,
          reason: 'Round-trip validation failed',
        });
      }

      return isValid;
    } catch (error) {
      this.logger.error({
        service: SERVICE_NAMES.ENCRYPTION,
        operation: OPERATIONS.VALIDATE_KEYS,
        errorCode: ERROR_CODES.INVALID_KEY_FORMAT,
        message: LOG_MESSAGES.KEYS_VALIDATION_FAILED,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Ensures the service is properly initialized before operations
   * @throws Error if not initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.publicKey || !this.privateKey) {
      throw new Error(
        'Encryption service not initialized. Ensure keys are loaded.',
      );
    }
  }

  /**
   * Checks if the service is ready for encryption operations
   * @returns True if service is initialized
   */
  isReady(): boolean {
    return (
      this.isInitialized && this.publicKey !== null && this.privateKey !== null
    );
  }

  /**
   * Manually loads keys (useful for testing or deferred initialization)
   * @returns Promise that resolves when keys are loaded
   */
  async initializeKeys(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    await this.loadKeys();
    this.isInitialized = true;
    this.logger.info({
      service: SERVICE_NAMES.ENCRYPTION,
      operation: OPERATIONS.LOAD_KEYS,
      message: LOG_MESSAGES.KEYS_LOADED,
    });
  }
}
