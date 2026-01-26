/**
 * User Encryption Job Interfaces
 *
 * Defines TypeScript interfaces for the user data encryption cron job.
 *
 * @module UserEncryption/Interfaces
 * @version 1.0.0
 */

/**
 * Encrypted data structure for internal processing
 * Contains all components needed for decryption
 */
export interface IEncryptedData {
  /** Base64 encoded encrypted data */
  ciphertext: string;
  /** Base64 encoded initialization vector */
  iv: string;
  /** Base64 encoded authentication tag (for GCM mode) */
  tag: string;
  /** Base64 encoded encrypted AES key (encrypted with RSA public key) */
  encryptedKey: string;
  /** Algorithm used for encryption */
  algorithm: string;
  /** Timestamp when encryption was performed */
  encryptedAt: string;
}

/**
 * Serialized encrypted string format
 * Format: encryptedKey.iv.tag.ciphertext (dot-separated base64 values)
 * This is what gets stored in the database columns
 */
export type SerializedEncryptedString = string;

/**
 * User record from core.users table
 * After migration, PII fields store encrypted strings directly
 */
export interface IUserRecord {
  /** Primary key */
  id: number;
  /** Public UUID */
  public_id: string;
  /** User full name (PII) - stores encrypted string when is_encrypted=true */
  name: string | null;
  /** User email address (PII) - stores encrypted string when is_encrypted=true */
  email: string;
  /** User phone number (PII) - stores encrypted string when is_encrypted=true */
  phone: string | null;
  /** Hashed password */
  password: string | null;
  /** Profile image URL */
  image: string | null;
  /** OAuth provider - stores encrypted string when is_encrypted=true */
  provider: string | null;
  /** OAuth provider ID - stores encrypted string when is_encrypted=true */
  provider_id: string | null;
  /** Whether user data is encrypted */
  is_encrypted: boolean;
  /** Created timestamp */
  created_at: Date;
  /** Updated timestamp */
  updated_at: Date;
}

/**
 * User record with only PII fields for encryption
 */
export interface IUserPiiData {
  /** User ID for reference */
  id: number;
  /** User full name */
  name: string | null;
  /** User email address */
  email: string;
  /** User phone number */
  phone: string | null;
  /** OAuth provider */
  provider: string | null;
  /** OAuth provider ID */
  provider_id: string | null;
}

/**
 * Result of encrypting a single user's data
 */
export interface IUserEncryptionResult {
  /** User ID that was processed */
  userId: number;
  /** Whether encryption was successful */
  success: boolean;
  /** Error message if encryption failed */
  error?: string;
  /** Encrypted name (serialized string format) */
  encryptedName?: string | null;
  /** Encrypted email (serialized string format) */
  encryptedEmail?: string | null;
  /** Encrypted phone (serialized string format) */
  encryptedPhone?: string | null;
  /** Encrypted provider (serialized string format) */
  encryptedProvider?: string | null;
  /** Encrypted provider_id (serialized string format) */
  encryptedProviderId?: string | null;
  /** Duration of encryption in milliseconds */
  durationMs: number;
}

/**
 * Batch processing result
 */
export interface IBatchResult {
  /** Total users processed in batch */
  totalProcessed: number;
  /** Number of successful encryptions */
  successCount: number;
  /** Number of failed encryptions */
  failureCount: number;
  /** List of failed user IDs with errors */
  failures: Array<{ userId: number; error: string }>;
  /** Batch processing duration in milliseconds */
  durationMs: number;
}

/**
 * Overall job execution result
 */
export interface IJobExecutionResult {
  /** Unique job run identifier */
  jobRunId: string;
  /** Job start timestamp */
  startedAt: Date;
  /** Job completion timestamp */
  completedAt: Date;
  /** Total users found for encryption */
  totalUsersFound: number;
  /** Total users successfully encrypted */
  totalEncrypted: number;
  /** Total users that failed encryption */
  totalFailed: number;
  /** Total batches processed */
  totalBatches: number;
  /** Total duration in milliseconds */
  durationMs: number;
  /** Job status */
  status: 'completed' | 'partial' | 'failed';
  /** List of all failures */
  failures: Array<{ userId: number; error: string }>;
}

/**
 * Configuration for the encryption job
 */
export interface IEncryptionJobConfig {
  /** Number of records to process per batch */
  batchSize: number;
  /** Delay between batches in milliseconds */
  batchDelayMs: number;
  /** Maximum retries for failed encryptions */
  maxRetries: number;
  /** Path to public key file */
  publicKeyPath: string;
  /** Path to private key file */
  privateKeyPath: string;
  /** Environment variable name for passphrase */
  passphraseEnvVar: string;
  /** Whether to run in dry-run mode */
  dryRun: boolean;
}

/**
 * Key pair for encryption/decryption
 */
export interface IKeyPair {
  /** RSA public key in PEM format */
  publicKey: string;
  /** RSA private key in PEM format (encrypted) */
  privateKey: string;
}

/**
 * Encryption service interface
 */
export interface IEncryptionService {
  /**
   * Encrypts a plaintext string using hybrid RSA+AES encryption
   * @param plaintext - Data to encrypt
   * @returns Encrypted data structure (internal format)
   */
  encrypt(plaintext: string): IEncryptedData;

  /**
   * Encrypts and serializes plaintext to a single string
   * Format: encryptedKey.iv.tag.ciphertext
   * @param plaintext - Data to encrypt
   * @returns Serialized encrypted string for database storage
   */
  encryptToString(plaintext: string): string;

  /**
   * Decrypts encrypted data back to plaintext
   * @param encryptedData - Encrypted data structure
   * @returns Original plaintext
   */
  decrypt(encryptedData: IEncryptedData): string;

  /**
   * Decrypts a serialized encrypted string back to plaintext
   * @param serialized - Serialized encrypted string (from database)
   * @returns Original plaintext
   */
  decryptFromString(serialized: string): string;

  /**
   * Validates the encryption keys are properly loaded
   * @returns True if keys are valid
   */
  validateKeys(): boolean;

  /**
   * Serializes encrypted data to a single string
   * @param data - Encrypted data structure
   * @returns Serialized string
   */
  serialize(data: IEncryptedData): string;

  /**
   * Deserializes a string back to encrypted data structure
   * @param serialized - Serialized string
   * @returns Encrypted data structure
   */
  deserialize(serialized: string): IEncryptedData;
}

/**
 * User encryption job service interface
 */
export interface IUserEncryptionJobService {
  /**
   * Executes the encryption job
   * @returns Job execution result
   */
  executeJob(): Promise<IJobExecutionResult>;

  /**
   * Encrypts a batch of users
   * @param users - Users to encrypt
   * @returns Batch processing result
   */
  encryptBatch(users: IUserPiiData[]): Promise<IBatchResult>;

  /**
   * Gets count of users pending encryption
   * @returns Count of unencrypted users
   */
  getPendingCount(): Promise<number>;
}

/**
 * Database query options
 */
export interface IQueryOptions {
  /** Page number for pagination */
  page?: number;
  /** Number of records per page */
  limit?: number;
  /** Column to order by */
  orderBy?: string;
  /** Order direction */
  orderDirection?: 'asc' | 'desc';
}

/**
 * Logging context for structured logs
 */
export interface ILogContext {
  /** Service name */
  service: string;
  /** Operation being performed */
  operation: string;
  /** Batch number if processing batches */
  batchNumber?: number;
  /** Total batches */
  totalBatches?: number;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Record count */
  count?: number;
  /** Job run ID */
  jobRunId?: string;
}
