/**
 * Encryption Health Check Interfaces
 *
 * Type definitions for encryption keys health validation.
 *
 * @module Common/Health/Interfaces
 * @version 1.0.0
 */

import { EncryptionHealthErrorCode } from '../constants/encryption-health.constants';

/**
 * Result of encryption health check validation
 */
export interface IEncryptionHealthResult {
  /** Whether the health check passed */
  isHealthy: boolean;
  /** Error code if health check failed */
  errorCode?: EncryptionHealthErrorCode;
  /** Human-readable error message */
  errorMessage?: string;
  /** Whether public key file exists */
  publicKeyExists: boolean;
  /** Whether private key file exists */
  privateKeyExists: boolean;
  /** Whether passphrase validation passed */
  passphraseValid?: boolean;
  /** Timestamp of the health check */
  checkedAt: string;
}

/**
 * Options for encryption health service
 */
export interface IEncryptionHealthOptions {
  /** Custom public key path */
  publicKeyPath?: string;
  /** Custom private key path */
  privateKeyPath?: string;
  /** Skip passphrase validation (only check file existence) */
  skipPassphraseValidation?: boolean;
}

/**
 * Encryption health service interface
 */
export interface IEncryptionHealthService {
  /**
   * Performs full health check validation
   * @param options - Optional configuration for health check
   * @returns Health check result
   */
  checkHealth(
    options?: IEncryptionHealthOptions,
  ): Promise<IEncryptionHealthResult>;

  /**
   * Checks if encryption key files exist
   * @returns True if both key files exist
   */
  checkKeysExist(): boolean;

  /**
   * Validates the passphrase by loading private key and performing round-trip test
   * @returns True if passphrase is valid
   */
  validatePassphrase(): Promise<boolean>;
}

/**
 * Encrypted data structure for round-trip validation
 */
export interface IEncryptedData {
  /** Encrypted data (ciphertext) */
  ciphertext: string;
  /** Initialization vector */
  iv: string;
  /** Authentication tag */
  tag: string;
  /** Encrypted AES key */
  encryptedKey: string;
  /** Encryption algorithm used */
  algorithm: string;
  /** Timestamp when encrypted */
  encryptedAt: string;
}
