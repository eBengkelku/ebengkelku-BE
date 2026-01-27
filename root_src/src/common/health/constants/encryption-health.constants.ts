/**
 * Encryption Health Check Constants
 *
 * Defines constants for encryption keys health validation.
 *
 * @module Common/Health/Constants
 * @version 1.0.0
 */

/**
 * File path constants for encryption keys
 */
export const ENCRYPTION_KEY_PATHS = {
  /** Default private key file path */
  PRIVATE_KEY: './src/config/encryption-keys/private-key.json',
  /** Default public key file path */
  PUBLIC_KEY: './src/config/encryption-keys/public-key.json',
} as const;

/**
 * Environment variable names for encryption configuration
 */
export const ENCRYPTION_ENV_VARS = {
  /** Encryption key passphrase */
  PASSPHRASE: 'ENCRYPTION_KEY_PASSPHRASE',
  /** Private key file path override */
  PRIVATE_KEY_PATH: 'ENCRYPTION_PRIVATE_KEY_PATH',
  /** Public key file path override */
  PUBLIC_KEY_PATH: 'ENCRYPTION_PUBLIC_KEY_PATH',
} as const;

/**
 * JSON key names in key files
 */
export const ENCRYPTION_KEY_NAMES = {
  /** Private key property name */
  PRIVATE: 'PRIVATE_KEY_MY_KEY',
  /** Public key property name */
  PUBLIC: 'PUBLIC_KEY_MY_KEY',
} as const;

/**
 * Error codes for encryption health check
 */
export const ENCRYPTION_HEALTH_ERROR_CODES = {
  /** Public key file not found */
  PUBLIC_KEY_NOT_FOUND: 'ERR_PUBLIC_KEY_NOT_FOUND',
  /** Private key file not found */
  PRIVATE_KEY_NOT_FOUND: 'ERR_PRIVATE_KEY_NOT_FOUND',
  /** Both key files not found */
  KEYS_NOT_FOUND: 'ERR_KEYS_NOT_FOUND',
  /** Passphrase not set in environment */
  PASSPHRASE_NOT_SET: 'ERR_PASSPHRASE_NOT_SET',
  /** Passphrase is invalid/incorrect */
  PASSPHRASE_INVALID: 'ERR_PASSPHRASE_INVALID',
  /** Key validation failed (round-trip test) */
  KEY_VALIDATION_FAILED: 'ERR_KEY_VALIDATION_FAILED',
  /** General health check failure */
  HEALTH_CHECK_FAILED: 'ERR_HEALTH_CHECK_FAILED',
} as const;

/**
 * Log messages for encryption health check
 */
export const ENCRYPTION_HEALTH_LOG_MESSAGES = {
  /** Health check started */
  HEALTH_CHECK_STARTED: 'Encryption keys health check started',
  /** Health check passed */
  HEALTH_CHECK_PASSED: 'Encryption keys validated successfully',
  /** Health check failed */
  HEALTH_CHECK_FAILED: 'Encryption keys health check failed',
  /** Keys not found */
  KEYS_NOT_FOUND: 'Encryption key files not found',
  /** Passphrase validation started */
  PASSPHRASE_VALIDATION_STARTED: 'Validating encryption passphrase',
  /** Passphrase validation failed */
  PASSPHRASE_VALIDATION_FAILED: 'Encryption passphrase validation failed',
} as const;

/**
 * Encryption algorithm constants (matching existing encryption.constants.ts)
 */
export const ENCRYPTION_ALGORITHMS = {
  /** RSA algorithm with OAEP padding */
  RSA: 'RSA-OAEP',
  /** AES algorithm in GCM mode */
  AES: 'aes-256-gcm',
  /** Hash algorithm for OAEP */
  OAEP_HASH: 'sha256',
} as const;

/**
 * Key configuration constants
 */
export const KEY_CONFIG = {
  /** RSA key size in bits */
  RSA_KEY_SIZE: 4096,
  /** AES key size in bytes */
  AES_KEY_SIZE: 32,
  /** Initialization vector size in bytes */
  IV_SIZE: 16,
  /** Authentication tag length in bytes */
  AUTH_TAG_LENGTH: 16,
} as const;

/**
 * Service names for logging
 */
export const HEALTH_SERVICE_NAMES = {
  /** Encryption health service name */
  ENCRYPTION_HEALTH: 'EncryptionHealthService',
} as const;

/**
 * Type exports for constants
 */
export type EncryptionHealthErrorCode =
  (typeof ENCRYPTION_HEALTH_ERROR_CODES)[keyof typeof ENCRYPTION_HEALTH_ERROR_CODES];
export type EncryptionHealthLogMessage =
  (typeof ENCRYPTION_HEALTH_LOG_MESSAGES)[keyof typeof ENCRYPTION_HEALTH_LOG_MESSAGES];
