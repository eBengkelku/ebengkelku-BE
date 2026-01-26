/**
 * User Encryption Job Constants
 *
 * Defines constants for the user data encryption cron job.
 *
 * @module UserEncryption/Constants
 * @version 1.0.0
 */

/**
 * Encryption algorithm constants
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
 * Serialization format constants
 * Format: encryptedKey.iv.tag.ciphertext
 */
export const SERIALIZATION = {
  /** Delimiter for serialized encrypted string */
  DELIMITER: '.',
  /** Number of parts in serialized string */
  PARTS_COUNT: 4,
  /** Index for encrypted key in serialized parts */
  INDEX_ENCRYPTED_KEY: 0,
  /** Index for IV in serialized parts */
  INDEX_IV: 1,
  /** Index for auth tag in serialized parts */
  INDEX_TAG: 2,
  /** Index for ciphertext in serialized parts */
  INDEX_CIPHERTEXT: 3,
} as const;

/**
 * File path constants
 */
export const FILE_PATHS = {
  /** Default private key file path */
  PRIVATE_KEY: './src/config/encryption-keys/private-key.json',
  /** Default public key file path */
  PUBLIC_KEY: './src/config/encryption-keys/public-key.json',
} as const;

/**
 * JSON key names in key files
 */
export const KEY_NAMES = {
  /** Private key property name */
  PRIVATE: 'PRIVATE_KEY_MY_KEY',
  /** Public key property name */
  PUBLIC: 'PUBLIC_KEY_MY_KEY',
} as const;

/**
 * Batch processing configuration
 */
export const BATCH_CONFIG = {
  /** Default number of records per batch */
  DEFAULT_BATCH_SIZE: 100,
  /** Minimum batch size */
  MIN_BATCH_SIZE: 10,
  /** Maximum batch size */
  MAX_BATCH_SIZE: 500,
  /** Default delay between batches in milliseconds */
  DEFAULT_BATCH_DELAY_MS: 100,
  /** Maximum retries for failed operations */
  MAX_RETRIES: 3,
  /** Retry delay in milliseconds */
  RETRY_DELAY_MS: 1000,
} as const;

/**
 * Cron schedule expressions
 */
export const CRON_SCHEDULES = {
  /** Daily at 2:00 AM */
  DAILY_2AM: '0 2 * * *',
  /** Every hour */
  HOURLY: '0 * * * *',
  /** Every 6 hours */
  EVERY_6_HOURS: '0 */6 * * *',
  /** Weekly on Sunday at 3:00 AM */
  WEEKLY_SUNDAY_3AM: '0 3 * * 0',
} as const;

/**
 * Database table and column names
 */
export const DATABASE = {
  /** Schema name */
  SCHEMA: 'core',
  /** Users table name */
  TABLE: 'users',
  /** Full table name with schema */
  FULL_TABLE: 'core.users',
  /** Columns containing PII data */
  PII_COLUMNS: ['name', 'email', 'phone'] as const,
  /** Encrypted column prefix */
  ENCRYPTED_PREFIX: 'encrypted_',
  /** Flag column for encryption status */
  IS_ENCRYPTED_COLUMN: 'is_encrypted',
} as const;

/**
 * Environment variable names
 */
export const ENV_VARS = {
  /** Encryption key passphrase */
  PASSPHRASE: 'ENCRYPTION_KEY_PASSPHRASE',
  /** Private key file path override */
  PRIVATE_KEY_PATH: 'ENCRYPTION_PRIVATE_KEY_PATH',
  /** Public key file path override */
  PUBLIC_KEY_PATH: 'ENCRYPTION_PUBLIC_KEY_PATH',
  /** Batch size override */
  BATCH_SIZE: 'ENCRYPTION_BATCH_SIZE',
  /** Enable dry run mode */
  DRY_RUN: 'ENCRYPTION_DRY_RUN',
} as const;

/**
 * Log message templates (PII-safe)
 */
export const LOG_MESSAGES = {
  /** Job start message */
  JOB_START: 'User encryption job started',
  /** Job complete message */
  JOB_COMPLETE: 'User encryption job completed',
  /** Job failed message */
  JOB_FAILED: 'User encryption job failed',
  /** Batch start message */
  BATCH_START: 'Processing encryption batch',
  /** Batch complete message */
  BATCH_COMPLETE: 'Encryption batch completed',
  /** Batch failed message */
  BATCH_FAILED: 'Encryption batch failed',
  /** User encrypted message */
  USER_ENCRYPTED: 'User data encrypted successfully',
  /** User encryption failed message */
  USER_ENCRYPTION_FAILED: 'User data encryption failed',
  /** No users to process */
  NO_USERS_PENDING: 'No users pending encryption',
  /** Keys loaded message */
  KEYS_LOADED: 'Encryption keys loaded successfully',
  /** Keys validation failed message */
  KEYS_VALIDATION_FAILED: 'Encryption keys validation failed',
  /** Database update success */
  DB_UPDATE_SUCCESS: 'Database updated with encrypted data',
  /** Database update failed */
  DB_UPDATE_FAILED: 'Failed to update database with encrypted data',
  /** Retry attempt message */
  RETRY_ATTEMPT: 'Retrying operation',
  /** Dry run mode message */
  DRY_RUN_MODE: 'Running in dry-run mode - no database changes',
} as const;

/**
 * Error codes for encryption operations
 */
export const ERROR_CODES = {
  /** Key file not found */
  KEY_NOT_FOUND: 'ERR_KEY_NOT_FOUND',
  /** Invalid key format */
  INVALID_KEY_FORMAT: 'ERR_INVALID_KEY_FORMAT',
  /** Encryption failed */
  ENCRYPTION_FAILED: 'ERR_ENCRYPTION_FAILED',
  /** Decryption failed */
  DECRYPTION_FAILED: 'ERR_DECRYPTION_FAILED',
  /** Database error */
  DATABASE_ERROR: 'ERR_DATABASE',
  /** Invalid passphrase */
  INVALID_PASSPHRASE: 'ERR_INVALID_PASSPHRASE',
  /** Configuration error */
  CONFIG_ERROR: 'ERR_CONFIG',
  /** Batch processing error */
  BATCH_ERROR: 'ERR_BATCH_PROCESSING',
  /** User not found */
  USER_NOT_FOUND: 'ERR_USER_NOT_FOUND',
  /** Already encrypted */
  ALREADY_ENCRYPTED: 'ERR_ALREADY_ENCRYPTED',
} as const;

/**
 * Service names for logging
 */
export const SERVICE_NAMES = {
  /** Encryption service name */
  ENCRYPTION: 'EncryptionService',
  /** User encryption job service name */
  JOB: 'UserEncryptionJobService',
  /** Key loader service name */
  KEY_LOADER: 'KeyLoaderService',
} as const;

/**
 * Operation names for logging
 */
export const OPERATIONS = {
  /** Encrypt operation */
  ENCRYPT: 'encrypt',
  /** Decrypt operation */
  DECRYPT: 'decrypt',
  /** Load keys operation */
  LOAD_KEYS: 'loadKeys',
  /** Validate keys operation */
  VALIDATE_KEYS: 'validateKeys',
  /** Execute job operation */
  EXECUTE_JOB: 'executeJob',
  /** Process batch operation */
  PROCESS_BATCH: 'processBatch',
  /** Update database operation */
  UPDATE_DATABASE: 'updateDatabase',
  /** Fetch users operation */
  FETCH_USERS: 'fetchUsers',
} as const;

/**
 * Type exports for constants
 */
export type EncryptionAlgorithm =
  (typeof ENCRYPTION_ALGORITHMS)[keyof typeof ENCRYPTION_ALGORITHMS];
export type PiiColumn = (typeof DATABASE.PII_COLUMNS)[number];
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
export type LogMessage = (typeof LOG_MESSAGES)[keyof typeof LOG_MESSAGES];
