/**
 * User Encryption Job Interfaces
 *
 * Defines TypeScript interfaces for the user data encryption cron job.
 *
 * @module UserEncryption/Interfaces
 * @version 1.0.0
 */

/**
 * Encrypted data structure for storing encrypted values with metadata
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
 * User record from core.users table
 */
export interface IUserRecord {
  /** Primary key */
  id: number;
  /** Public UUID */
  public_id: string;
  /** User full name (PII) */
  name: string | null;
  /** User email address (PII) */
  email: string;
  /** User phone number (PII) */
  phone: string | null;
  /** Hashed password */
  password: string | null;
  /** Profile image URL */
  image: string | null;
  /** OAuth provider */
  provider: string | null;
  /** OAuth provider ID */
  provider_id: string | null;
  /** Whether user data is encrypted */
  is_encrypted: boolean;
  /** Encrypted name data */
  encrypted_name: string | null;
  /** Encrypted email data */
  encrypted_email: string | null;
  /** Encrypted phone data */
  encrypted_phone: string | null;
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
  /** Encrypted name data */
  encryptedName?: IEncryptedData | null;
  /** Encrypted email data */
  encryptedEmail?: IEncryptedData | null;
  /** Encrypted phone data */
  encryptedPhone?: IEncryptedData | null;
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
   * @returns Encrypted data structure
   */
  encrypt(plaintext: string): IEncryptedData;

  /**
   * Decrypts encrypted data back to plaintext
   * @param encryptedData - Encrypted data structure
   * @returns Original plaintext
   */
  decrypt(encryptedData: IEncryptedData): string;

  /**
   * Validates the encryption keys are properly loaded
   * @returns True if keys are valid
   */
  validateKeys(): boolean;
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
