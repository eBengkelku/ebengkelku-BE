/**
 * User Encryption Job Service
 *
 * Cron job service for encrypting user PII data in the core.users table.
 * Implements batch processing with O(n) time complexity.
 *
 * Compliance: Indonesia Personal Data Protection (UU PDP)
 *
 * @module UserEncryption/Services
 * @version 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../../database/database.service';
import { EncryptionService } from './encryption.service';
import {
  IUserEncryptionJobService,
  IJobExecutionResult,
  IBatchResult,
  IUserPiiData,
  IUserEncryptionResult,
  IEncryptedData,
  IEncryptionJobConfig,
} from '../interfaces/encryption.interfaces';
import {
  BATCH_CONFIG,
  DATABASE,
  LOG_MESSAGES,
  ERROR_CODES,
  SERVICE_NAMES,
  OPERATIONS,
  ENV_VARS,
  CRON_SCHEDULES,
} from '../constants/encryption.constants';
import { ConfigService } from '@nestjs/config';

/**
 * Cron job service for encrypting user PII data
 *
 * Features:
 * - Batch processing to prevent memory issues
 * - Transactional updates for data integrity
 * - Comprehensive logging without PII exposure
 * - Retry mechanism for failed operations
 * - Dry-run mode for testing
 *
 * Time Complexity: O(n) where n is total users
 * Space Complexity: O(b) where b is batch size
 */
@Injectable()
export class UserEncryptionJobService implements IUserEncryptionJobService {
  private readonly config: IEncryptionJobConfig;
  private isJobRunning = false;

  constructor(
    @InjectPinoLogger(UserEncryptionJobService.name)
    private readonly logger: PinoLogger,
    private readonly databaseService: DatabaseService,
    private readonly encryptionService: EncryptionService,
    private readonly configService: ConfigService,
  ) {
    this.config = this.loadConfiguration();
  }

  /**
   * Loads job configuration from environment variables
   * @returns Configuration object
   */
  private loadConfiguration(): IEncryptionJobConfig {
    const batchSize = this.configService.get<number>(
      ENV_VARS.BATCH_SIZE,
      BATCH_CONFIG.DEFAULT_BATCH_SIZE,
    );

    return {
      batchSize: Math.min(
        Math.max(batchSize, BATCH_CONFIG.MIN_BATCH_SIZE),
        BATCH_CONFIG.MAX_BATCH_SIZE,
      ),
      batchDelayMs: BATCH_CONFIG.DEFAULT_BATCH_DELAY_MS,
      maxRetries: BATCH_CONFIG.MAX_RETRIES,
      publicKeyPath: this.configService.get<string>(
        ENV_VARS.PUBLIC_KEY_PATH,
        '',
      ),
      privateKeyPath: this.configService.get<string>(
        ENV_VARS.PRIVATE_KEY_PATH,
        '',
      ),
      passphraseEnvVar: ENV_VARS.PASSPHRASE,
      dryRun: this.configService.get<boolean>(ENV_VARS.DRY_RUN, false),
    };
  }

  /**
   * Scheduled cron job - runs daily at 2:00 AM
   *
   * Encrypts all unencrypted user PII data in batches.
   * Uses @Cron decorator for NestJS scheduling.
   */
  @Cron(CRON_SCHEDULES.DAILY_2AM, {
    name: 'user-encryption-job',
    timeZone: 'Asia/Jakarta',
  })
  async handleCron(): Promise<void> {
    // Prevent concurrent execution
    if (this.isJobRunning) {
      this.logger.warn({
        service: SERVICE_NAMES.JOB,
        operation: OPERATIONS.EXECUTE_JOB,
        message: 'Job already running, skipping this execution',
      });
      return;
    }

    try {
      this.isJobRunning = true;
      await this.executeJob();
    } finally {
      this.isJobRunning = false;
    }
  }

  /**
   * Executes the encryption job
   *
   * Algorithm:
   * 1. Validate encryption keys
   * 2. Count pending users
   * 3. Process users in batches
   * 4. Aggregate results
   *
   * Time Complexity: O(n) where n is total pending users
   * Space Complexity: O(b) where b is batch size
   *
   * @returns Job execution result
   */
  async executeJob(): Promise<IJobExecutionResult> {
    const jobRunId = uuidv4();
    const startedAt = new Date();
    const failures: Array<{ userId: number; error: string }> = [];
    let totalEncrypted = 0;
    let totalFailed = 0;
    let totalBatches = 0;

    this.logJobStart(jobRunId);

    try {
      // Step 1: Validate encryption keys
      await this.ensureEncryptionReady();

      // Step 2: Get total pending users
      const totalUsersFound = await this.getPendingCount();

      if (totalUsersFound === 0) {
        this.logger.info({
          service: SERVICE_NAMES.JOB,
          operation: OPERATIONS.EXECUTE_JOB,
          jobRunId,
          message: LOG_MESSAGES.NO_USERS_PENDING,
        });

        return this.buildResult({
          jobRunId,
          startedAt,
          totalUsersFound: 0,
          totalEncrypted: 0,
          totalFailed: 0,
          totalBatches: 0,
          status: 'completed',
          failures: [],
        });
      }

      // Step 3: Calculate total batches
      const expectedBatches = Math.ceil(
        totalUsersFound / this.config.batchSize,
      );

      this.logger.info({
        service: SERVICE_NAMES.JOB,
        operation: OPERATIONS.EXECUTE_JOB,
        jobRunId,
        totalUsersFound,
        expectedBatches,
        batchSize: this.config.batchSize,
      });

      // Step 4: Process batches
      const batchContext = { offset: 0, hasMore: true };

      while (batchContext.hasMore) {
        const batchNumber = totalBatches + 1;
        const users = await this.fetchPendingUsers(
          this.config.batchSize,
          batchContext.offset,
        );

        if (users.length === 0) {
          break;
        }

        const batchResult = await this.encryptBatch(users);
        totalEncrypted += batchResult.successCount;
        totalFailed += batchResult.failureCount;
        failures.push(...batchResult.failures);
        totalBatches++;

        this.logBatchComplete(
          jobRunId,
          batchNumber,
          expectedBatches,
          batchResult,
        );

        batchContext.offset += this.config.batchSize;
        batchContext.hasMore = users.length === this.config.batchSize;

        await this.applyBatchDelay(batchContext.hasMore);
      }

      const status = this.determineJobStatus(totalEncrypted, totalFailed);
      const result = this.buildResult({
        jobRunId,
        startedAt,
        totalUsersFound,
        totalEncrypted,
        totalFailed,
        totalBatches,
        status,
        failures,
      });

      this.logJobComplete(jobRunId, result);
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error({
        service: SERVICE_NAMES.JOB,
        operation: OPERATIONS.EXECUTE_JOB,
        jobRunId,
        errorCode: ERROR_CODES.BATCH_ERROR,
        message: LOG_MESSAGES.JOB_FAILED,
        error: errorMessage,
      });

      return this.buildResult({
        jobRunId,
        startedAt,
        totalUsersFound: 0,
        totalEncrypted,
        totalFailed,
        totalBatches,
        status: 'failed',
        failures,
      });
    }
  }

  /**
   * Logs job start with configuration
   */
  private logJobStart(jobRunId: string): void {
    this.logger.info({
      service: SERVICE_NAMES.JOB,
      operation: OPERATIONS.EXECUTE_JOB,
      jobRunId,
      message: LOG_MESSAGES.JOB_START,
      config: {
        batchSize: this.config.batchSize,
        dryRun: this.config.dryRun,
      },
    });

    if (this.config.dryRun) {
      this.logger.info({
        service: SERVICE_NAMES.JOB,
        operation: OPERATIONS.EXECUTE_JOB,
        jobRunId,
        message: LOG_MESSAGES.DRY_RUN_MODE,
      });
    }
  }

  /**
   * Ensures encryption service is ready
   */
  private async ensureEncryptionReady(): Promise<void> {
    if (!this.encryptionService.isReady()) {
      await this.encryptionService.initializeKeys();
    }

    if (!this.encryptionService.validateKeys()) {
      throw new Error('Encryption keys validation failed');
    }
  }

  /**
   * Logs batch completion
   */
  private logBatchComplete(
    jobRunId: string,
    batchNumber: number,
    expectedBatches: number,
    batchResult: IBatchResult,
  ): void {
    this.logger.info({
      service: SERVICE_NAMES.JOB,
      operation: OPERATIONS.PROCESS_BATCH,
      jobRunId,
      batchNumber,
      totalBatches: expectedBatches,
      batchSuccessCount: batchResult.successCount,
      batchFailureCount: batchResult.failureCount,
      batchDurationMs: batchResult.durationMs,
      message: LOG_MESSAGES.BATCH_COMPLETE,
    });
  }

  /**
   * Applies delay between batches if configured
   */
  private async applyBatchDelay(hasMore: boolean): Promise<void> {
    if (hasMore && this.config.batchDelayMs > 0) {
      await this.delay(this.config.batchDelayMs);
    }
  }

  /**
   * Determines the final job status based on results
   */
  private determineJobStatus(
    totalEncrypted: number,
    totalFailed: number,
  ): 'completed' | 'partial' | 'failed' {
    if (totalFailed === 0) {
      return 'completed';
    }
    if (totalEncrypted > 0) {
      return 'partial';
    }
    return 'failed';
  }

  /**
   * Logs job completion
   */
  private logJobComplete(jobRunId: string, result: IJobExecutionResult): void {
    this.logger.info({
      service: SERVICE_NAMES.JOB,
      operation: OPERATIONS.EXECUTE_JOB,
      jobRunId,
      message: LOG_MESSAGES.JOB_COMPLETE,
      totalUsersFound: result.totalUsersFound,
      totalEncrypted: result.totalEncrypted,
      totalFailed: result.totalFailed,
      totalBatches: result.totalBatches,
      durationMs: result.durationMs,
      status: result.status,
    });
  }

  /**
   * Encrypts a batch of users
   *
   * Time Complexity: O(b) where b is batch size
   * Space Complexity: O(b) for storing results
   *
   * @param users - Array of users to encrypt
   * @returns Batch processing result
   */
  async encryptBatch(users: IUserPiiData[]): Promise<IBatchResult> {
    const startTime = Date.now();
    const failures: Array<{ userId: number; error: string }> = [];
    let successCount = 0;
    let failureCount = 0;

    for (const user of users) {
      const result = await this.encryptUserWithRetry(user);

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
        failures.push({
          userId: user.id,
          error: result.error || 'Unknown error',
        });
      }
    }

    return {
      totalProcessed: users.length,
      successCount,
      failureCount,
      failures,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Encrypts a single user with retry logic
   *
   * @param user - User data to encrypt
   * @returns Encryption result
   */
  private async encryptUserWithRetry(
    user: IUserPiiData,
  ): Promise<IUserEncryptionResult> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      const result = await this.encryptUser(user);

      if (result.success) {
        return result;
      }

      lastError = result.error;

      if (attempt < this.config.maxRetries) {
        this.logger.warn({
          service: SERVICE_NAMES.JOB,
          operation: OPERATIONS.ENCRYPT,
          userId: user.id,
          attempt,
          maxRetries: this.config.maxRetries,
          message: LOG_MESSAGES.RETRY_ATTEMPT,
        });

        await this.delay(BATCH_CONFIG.RETRY_DELAY_MS * attempt);
      }
    }

    return {
      userId: user.id,
      success: false,
      error: lastError,
      durationMs: 0,
    };
  }

  /**
   * Encrypts a single user's PII data
   *
   * @param user - User data to encrypt
   * @returns Encryption result
   */
  private async encryptUser(
    user: IUserPiiData,
  ): Promise<IUserEncryptionResult> {
    const startTime = Date.now();

    try {
      // Encrypt each PII field
      const encryptedName = user.name
        ? this.encryptionService.encrypt(user.name)
        : null;

      const encryptedEmail = this.encryptionService.encrypt(user.email);

      const encryptedPhone = user.phone
        ? this.encryptionService.encrypt(user.phone)
        : null;

      // Update database (skip if dry-run)
      if (!this.config.dryRun) {
        await this.updateUserEncryptedData(
          user.id,
          encryptedName,
          encryptedEmail,
          encryptedPhone,
        );
      }

      this.logger.debug({
        service: SERVICE_NAMES.JOB,
        operation: OPERATIONS.ENCRYPT,
        userId: user.id,
        message: LOG_MESSAGES.USER_ENCRYPTED,
        durationMs: Date.now() - startTime,
      });

      return {
        userId: user.id,
        success: true,
        encryptedName,
        encryptedEmail,
        encryptedPhone,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      this.logger.error({
        service: SERVICE_NAMES.JOB,
        operation: OPERATIONS.ENCRYPT,
        userId: user.id,
        errorCode: ERROR_CODES.ENCRYPTION_FAILED,
        message: LOG_MESSAGES.USER_ENCRYPTION_FAILED,
        error: errorMessage,
      });

      return {
        userId: user.id,
        success: false,
        error: errorMessage,
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Updates user record with encrypted data in a transaction
   *
   * @param userId - User ID
   * @param encryptedName - Encrypted name
   * @param encryptedEmail - Encrypted email
   * @param encryptedPhone - Encrypted phone
   */
  private async updateUserEncryptedData(
    userId: number,
    encryptedName: IEncryptedData | null,
    encryptedEmail: IEncryptedData,
    encryptedPhone: IEncryptedData | null,
  ): Promise<void> {
    const knex = this.databaseService.getKnex();

    await knex.transaction(async (trx) => {
      await trx(DATABASE.FULL_TABLE)
        .where('id', userId)
        .update({
          encrypted_name: encryptedName ? JSON.stringify(encryptedName) : null,
          encrypted_email: JSON.stringify(encryptedEmail),
          encrypted_phone: encryptedPhone
            ? JSON.stringify(encryptedPhone)
            : null,
          is_encrypted: true,
          updated_at: knex.fn.now(),
        });
    });

    this.logger.debug({
      service: SERVICE_NAMES.JOB,
      operation: OPERATIONS.UPDATE_DATABASE,
      userId,
      message: LOG_MESSAGES.DB_UPDATE_SUCCESS,
    });
  }

  /**
   * Gets count of users pending encryption
   *
   * @returns Count of unencrypted users
   */
  async getPendingCount(): Promise<number> {
    const knex = this.databaseService.getKnex();

    const result = await knex(DATABASE.FULL_TABLE)
      .where('is_encrypted', false)
      .orWhereNull('is_encrypted')
      .count('id as count')
      .first();

    return Number(result?.count || 0);
  }

  /**
   * Fetches pending users for encryption
   *
   * @param limit - Number of users to fetch
   * @param offset - Offset for pagination
   * @returns Array of user PII data
   */
  private async fetchPendingUsers(
    limit: number,
    offset: number,
  ): Promise<IUserPiiData[]> {
    const knex = this.databaseService.getKnex();

    const users = await knex(DATABASE.FULL_TABLE)
      .select('id', 'name', 'email', 'phone')
      .where('is_encrypted', false)
      .orWhereNull('is_encrypted')
      .orderBy('id', 'asc')
      .limit(limit)
      .offset(offset);

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    }));
  }

  /**
   * Builds job execution result object
   */
  private buildResult(params: {
    jobRunId: string;
    startedAt: Date;
    totalUsersFound: number;
    totalEncrypted: number;
    totalFailed: number;
    totalBatches: number;
    status: 'completed' | 'partial' | 'failed';
    failures: Array<{ userId: number; error: string }>;
  }): IJobExecutionResult {
    const completedAt = new Date();

    return {
      jobRunId: params.jobRunId,
      startedAt: params.startedAt,
      completedAt,
      totalUsersFound: params.totalUsersFound,
      totalEncrypted: params.totalEncrypted,
      totalFailed: params.totalFailed,
      totalBatches: params.totalBatches,
      durationMs: completedAt.getTime() - params.startedAt.getTime(),
      status: params.status,
      failures: params.failures,
    };
  }

  /**
   * Delays execution for specified milliseconds
   *
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Manually triggers the encryption job (for testing/admin)
   *
   * @returns Job execution result
   */
  async triggerJob(): Promise<IJobExecutionResult> {
    return this.executeJob();
  }
}
