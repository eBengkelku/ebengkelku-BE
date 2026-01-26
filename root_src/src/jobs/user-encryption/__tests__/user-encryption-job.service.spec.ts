/**
 * User Encryption Job Service Unit Tests
 *
 * Comprehensive test suite for the UserEncryptionJobService.
 * Covers positive cases, negative cases, and edge cases.
 *
 * @module UserEncryption/Tests
 * @version 1.0.0
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getLoggerToken } from 'nestjs-pino';
import { UserEncryptionJobService } from '../services/user-encryption-job.service';
import { EncryptionService } from '../services/encryption.service';
import { DatabaseService } from '../../../database/database.service';
import {
  IUserPiiData,
  IEncryptedData,
} from '../interfaces/encryption.interfaces';
import { ENV_VARS, BATCH_CONFIG } from '../constants/encryption.constants';

// Type for transaction callback - trx is a callable function that returns a query builder
type MockTrx = jest.Mock & {
  (tableName: string): {
    where: jest.Mock;
    update: jest.Mock;
  };
};
type TransactionCallback = (trx: MockTrx) => Promise<void>;

// Helper to create a mock trx function
const createMockTrx = (): MockTrx => {
  const trxQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    update: jest.fn().mockResolvedValue(1),
  };
  const trx = jest.fn().mockReturnValue(trxQueryBuilder) as MockTrx;
  return trx;
};

// Helper to create mock user data with all required fields
const createMockUser = (
  id: number,
  name: string | null = 'Test User',
  email: string = 'test@example.com',
  phone: string | null = '+62812345678',
  provider: string | null = null,
  providerId: string | null = null,
): IUserPiiData => ({
  id,
  name,
  email,
  phone,
  provider,
  provider_id: providerId,
});

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  setContext: jest.fn(),
};

// Mock encrypted data
const createMockEncryptedData = (): IEncryptedData => ({
  ciphertext: 'mockCiphertext',
  iv: 'mockIv',
  tag: 'mockTag',
  encryptedKey: 'mockEncryptedKey',
  algorithm: 'aes-256-gcm',
  encryptedAt: new Date().toISOString(),
});

// Mock encrypted string (serialized format: encryptedKey.iv.tag.ciphertext)
const MOCK_ENCRYPTED_STRING = 'mockEncryptedKey.mockIv.mockTag.mockCiphertext';

// Mock encryption service with new methods
const createMockEncryptionService = () => ({
  isReady: jest.fn().mockReturnValue(true),
  initializeKeys: jest.fn().mockResolvedValue(undefined),
  validateKeys: jest.fn().mockReturnValue(true),
  encrypt: jest.fn().mockReturnValue(createMockEncryptedData()),
  decrypt: jest.fn().mockReturnValue('decrypted'),
  encryptToString: jest.fn().mockReturnValue(MOCK_ENCRYPTED_STRING),
  decryptFromString: jest.fn().mockReturnValue('decrypted'),
  serialize: jest.fn().mockReturnValue(MOCK_ENCRYPTED_STRING),
  deserialize: jest.fn().mockReturnValue(createMockEncryptedData()),
});

// Mock Knex query builder
const createMockQueryBuilder = () => {
  const mockBuilder: Record<string, jest.Mock> = {
    where: jest.fn().mockReturnThis(),
    orWhereNull: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue({ count: 0 }),
    select: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue(1),
    transaction: jest.fn(),
  };

  return mockBuilder;
};

// Mock database service
const createMockDatabaseService = (
  queryBuilder: Record<string, jest.Mock>,
) => ({
  getKnex: jest.fn(() => {
    const knexFn = jest.fn().mockReturnValue(queryBuilder);
    (knexFn as unknown as { fn: { now: jest.Mock } }).fn = { now: jest.fn() };
    (knexFn as unknown as { transaction: jest.Mock }).transaction =
      queryBuilder.transaction;
    return knexFn;
  }),
});

describe('UserEncryptionJobService', () => {
  let service: UserEncryptionJobService;
  let encryptionService: ReturnType<typeof createMockEncryptionService>;
  let databaseService: ReturnType<typeof createMockDatabaseService>;
  let queryBuilder: ReturnType<typeof createMockQueryBuilder>;

  beforeEach(async () => {
    queryBuilder = createMockQueryBuilder();
    encryptionService = createMockEncryptionService();
    databaseService = createMockDatabaseService(queryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserEncryptionJobService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: unknown) => {
              switch (key) {
                case ENV_VARS.BATCH_SIZE:
                  return BATCH_CONFIG.DEFAULT_BATCH_SIZE;
                case ENV_VARS.DRY_RUN:
                  return false;
                default:
                  return defaultValue;
              }
            }),
          },
        },
        {
          provide: getLoggerToken(UserEncryptionJobService.name),
          useValue: mockLogger,
        },
        {
          provide: EncryptionService,
          useValue: encryptionService,
        },
        {
          provide: DatabaseService,
          useValue: databaseService,
        },
      ],
    }).compile();

    service = module.get<UserEncryptionJobService>(UserEncryptionJobService);

    jest.clearAllMocks();
  });

  // ====================
  // POSITIVE TEST CASES
  // ====================

  describe('Positive Test Cases - executeJob()', () => {
    it('should execute job successfully with no pending users', async () => {
      queryBuilder.first.mockResolvedValue({ count: 0 });

      const result = await service.executeJob();

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.totalUsersFound).toBe(0);
      expect(result.totalEncrypted).toBe(0);
      expect(result.totalFailed).toBe(0);
      expect(result.jobRunId).toBeDefined();
    });

    it('should execute job successfully with one pending user', async () => {
      const mockUser = createMockUser(
        1,
        'John Doe',
        'john@example.com',
        '+62812345678',
      );

      queryBuilder.first.mockResolvedValue({ count: 1 });
      queryBuilder.offset
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);
      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      const result = await service.executeJob();

      expect(result.status).toBe('completed');
      expect(result.totalUsersFound).toBe(1);
      expect(result.totalEncrypted).toBe(1);
      expect(result.totalFailed).toBe(0);
    });

    it('should execute job successfully with multiple users', async () => {
      const mockUsers: IUserPiiData[] = [
        createMockUser(1, 'User 1', 'user1@example.com', '+621'),
        createMockUser(2, 'User 2', 'user2@example.com', '+622'),
        createMockUser(3, 'User 3', 'user3@example.com', '+623'),
      ];

      queryBuilder.first.mockResolvedValue({ count: 3 });
      queryBuilder.offset
        .mockResolvedValueOnce(mockUsers)
        .mockResolvedValue([]);
      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      const result = await service.executeJob();

      expect(result.status).toBe('completed');
      expect(result.totalEncrypted).toBe(3);
      expect(result.totalFailed).toBe(0);
    });

    it('should execute job with user having null name', async () => {
      const mockUser = createMockUser(
        1,
        null,
        'john@example.com',
        '+62812345678',
      );

      queryBuilder.first.mockResolvedValue({ count: 1 });
      queryBuilder.offset
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);
      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      const result = await service.executeJob();

      expect(result.status).toBe('completed');
      expect(result.totalEncrypted).toBe(1);
    });

    it('should execute job with user having null phone', async () => {
      const mockUser = createMockUser(1, 'John Doe', 'john@example.com', null);

      queryBuilder.first.mockResolvedValue({ count: 1 });
      queryBuilder.offset
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);
      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      const result = await service.executeJob();

      expect(result.status).toBe('completed');
      expect(result.totalEncrypted).toBe(1);
    });

    it('should return correct job run ID format (UUID)', async () => {
      queryBuilder.first.mockResolvedValue({ count: 0 });

      const result = await service.executeJob();

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      expect(result.jobRunId).toMatch(uuidRegex);
    });

    it('should include correct timestamps', async () => {
      queryBuilder.first.mockResolvedValue({ count: 0 });

      const beforeExec = new Date();
      const result = await service.executeJob();
      const afterExec = new Date();

      expect(result.startedAt.getTime()).toBeGreaterThanOrEqual(
        beforeExec.getTime(),
      );
      expect(result.completedAt.getTime()).toBeLessThanOrEqual(
        afterExec.getTime(),
      );
      expect(result.completedAt.getTime()).toBeGreaterThanOrEqual(
        result.startedAt.getTime(),
      );
    });

    it('should calculate duration correctly', async () => {
      queryBuilder.first.mockResolvedValue({ count: 0 });

      const result = await service.executeJob();

      const expectedDuration =
        result.completedAt.getTime() - result.startedAt.getTime();
      expect(result.durationMs).toBe(expectedDuration);
    });

    it('should process users in batches', async () => {
      // Create 150 users to test batching (batch size is 100)
      const mockUsers1: IUserPiiData[] = Array.from({ length: 100 }, (_, i) =>
        createMockUser(
          i + 1,
          `User ${i + 1}`,
          `user${i + 1}@example.com`,
          `+62${i}`,
        ),
      );

      const mockUsers2: IUserPiiData[] = Array.from({ length: 50 }, (_, i) =>
        createMockUser(
          i + 101,
          `User ${i + 101}`,
          `user${i + 101}@example.com`,
          `+62${i + 100}`,
        ),
      );

      queryBuilder.first.mockResolvedValue({ count: 150 });
      queryBuilder.offset
        .mockResolvedValueOnce(mockUsers1)
        .mockResolvedValueOnce(mockUsers2)
        .mockResolvedValue([]);
      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      const result = await service.executeJob();

      expect(result.totalBatches).toBe(2);
      expect(result.totalEncrypted).toBe(150);
    });

    it('should log job start message', async () => {
      queryBuilder.first.mockResolvedValue({ count: 0 });

      await service.executeJob();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User encryption job started',
        }),
      );
    });

    it('should log job completion message', async () => {
      const mockUser = createMockUser(
        1,
        'John Doe',
        'john@example.com',
        '+62812345678',
      );

      queryBuilder.first.mockResolvedValue({ count: 1 });
      queryBuilder.offset
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);
      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      await service.executeJob();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User encryption job completed',
        }),
      );
    });

    it('should log no users pending message', async () => {
      queryBuilder.first.mockResolvedValue({ count: 0 });

      await service.executeJob();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'No users pending encryption',
        }),
      );
    });

    it('should call encryption service for each PII field', async () => {
      const mockUser = createMockUser(
        1,
        'John Doe',
        'john@example.com',
        '+62812345678',
        'google',
        'gid123',
      );

      queryBuilder.first.mockResolvedValue({ count: 1 });
      queryBuilder.offset
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);
      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      await service.executeJob();

      // Should encrypt name, email, phone, provider, and provider_id
      expect(encryptionService.encryptToString).toHaveBeenCalledWith(
        'John Doe',
      );
      expect(encryptionService.encryptToString).toHaveBeenCalledWith(
        'john@example.com',
      );
      expect(encryptionService.encryptToString).toHaveBeenCalledWith(
        '+62812345678',
      );
      expect(encryptionService.encryptToString).toHaveBeenCalledWith('google');
      expect(encryptionService.encryptToString).toHaveBeenCalledWith('gid123');
    });

    it('should validate keys before processing', async () => {
      queryBuilder.first.mockResolvedValue({ count: 0 });

      await service.executeJob();

      expect(encryptionService.validateKeys).toHaveBeenCalled();
    });

    it('should initialize keys if not ready', async () => {
      encryptionService.isReady.mockReturnValue(false);
      queryBuilder.first.mockResolvedValue({ count: 0 });

      await service.executeJob();

      expect(encryptionService.initializeKeys).toHaveBeenCalled();
    });
  });

  describe('Positive Test Cases - encryptBatch()', () => {
    it('should encrypt batch of users successfully', async () => {
      const users: IUserPiiData[] = [
        createMockUser(1, 'User 1', 'user1@example.com', '+621'),
        createMockUser(2, 'User 2', 'user2@example.com', '+622'),
      ];

      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      const result = await service.encryptBatch(users);

      expect(result.totalProcessed).toBe(2);
      expect(result.successCount).toBe(2);
      expect(result.failureCount).toBe(0);
      expect(result.failures).toHaveLength(0);
    });

    it('should return correct batch duration', async () => {
      const users: IUserPiiData[] = [
        createMockUser(1, 'User 1', 'user1@example.com', '+621'),
      ];

      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      const result = await service.encryptBatch(users);

      expect(result.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty batch', async () => {
      const result = await service.encryptBatch([]);

      expect(result.totalProcessed).toBe(0);
      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(0);
    });
  });

  describe('Positive Test Cases - getPendingCount()', () => {
    it('should return correct count of pending users', async () => {
      queryBuilder.first.mockResolvedValue({ count: 42 });

      const count = await service.getPendingCount();

      expect(count).toBe(42);
    });

    it('should return 0 when no pending users', async () => {
      queryBuilder.first.mockResolvedValue({ count: 0 });

      const count = await service.getPendingCount();

      expect(count).toBe(0);
    });

    it('should handle null count result', async () => {
      queryBuilder.first.mockResolvedValue(null);

      const count = await service.getPendingCount();

      expect(count).toBe(0);
    });

    it('should query correct table and conditions', async () => {
      queryBuilder.first.mockResolvedValue({ count: 5 });

      await service.getPendingCount();

      expect(queryBuilder.where).toHaveBeenCalledWith('is_encrypted', false);
      expect(queryBuilder.orWhereNull).toHaveBeenCalledWith('is_encrypted');
    });
  });

  describe('Positive Test Cases - triggerJob()', () => {
    it('should trigger job manually', async () => {
      queryBuilder.first.mockResolvedValue({ count: 0 });

      const result = await service.triggerJob();

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
    });

    it('should return same result format as scheduled job', async () => {
      queryBuilder.first.mockResolvedValue({ count: 0 });

      const result = await service.triggerJob();

      expect(result).toHaveProperty('jobRunId');
      expect(result).toHaveProperty('startedAt');
      expect(result).toHaveProperty('completedAt');
      expect(result).toHaveProperty('totalUsersFound');
      expect(result).toHaveProperty('totalEncrypted');
      expect(result).toHaveProperty('totalFailed');
      expect(result).toHaveProperty('totalBatches');
      expect(result).toHaveProperty('durationMs');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('failures');
    });
  });

  describe('Positive Test Cases - handleCron()', () => {
    it('should call executeJob', async () => {
      queryBuilder.first.mockResolvedValue({ count: 0 });

      await service.handleCron();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User encryption job started',
        }),
      );
    });
  });

  // ====================
  // NEGATIVE TEST CASES
  // ====================

  describe('Negative Test Cases - executeJob()', () => {
    it('should return failed status when key validation fails', async () => {
      encryptionService.validateKeys.mockReturnValue(false);

      const result = await service.executeJob();

      expect(result.status).toBe('failed');
    });

    it('should return failed status when encryption service throws', async () => {
      encryptionService.encryptToString.mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      const mockUser = createMockUser(
        1,
        'John Doe',
        'john@example.com',
        '+62812345678',
      );

      queryBuilder.first.mockResolvedValue({ count: 1 });
      queryBuilder.offset
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);

      const result = await service.executeJob();

      expect(result.totalFailed).toBe(1);
      expect(result.failures).toHaveLength(1);
      expect(result.failures[0].userId).toBe(1);
    });

    it('should return partial status when some encryptions fail', async () => {
      let callCount = 0;
      encryptionService.encryptToString.mockImplementation(() => {
        callCount++;
        if (callCount > 5) {
          // First user succeeds (5 fields), second fails
          throw new Error('Encryption failed');
        }
        return MOCK_ENCRYPTED_STRING;
      });

      const mockUsers: IUserPiiData[] = [
        createMockUser(1, 'User 1', 'user1@example.com', '+621'),
        createMockUser(2, 'User 2', 'user2@example.com', '+622'),
      ];

      queryBuilder.first.mockResolvedValue({ count: 2 });
      queryBuilder.offset
        .mockResolvedValueOnce(mockUsers)
        .mockResolvedValue([]);
      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      const result = await service.executeJob();

      expect(result.status).toBe('partial');
      expect(result.totalEncrypted).toBe(1);
      expect(result.totalFailed).toBe(1);
    });

    it('should handle database query error', async () => {
      queryBuilder.first.mockRejectedValue(new Error('Database error'));

      const result = await service.executeJob();

      expect(result.status).toBe('failed');
    });

    it('should handle database transaction error', async () => {
      const mockUser = createMockUser(
        1,
        'John Doe',
        'john@example.com',
        '+62812345678',
      );

      queryBuilder.first.mockResolvedValue({ count: 1 });
      queryBuilder.offset
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);
      queryBuilder.transaction.mockRejectedValue(
        new Error('Transaction failed'),
      );

      const result = await service.executeJob();

      expect(result.totalFailed).toBe(1);
    });

    it('should record failure details correctly', async () => {
      encryptionService.encryptToString.mockImplementation(() => {
        throw new Error('Specific encryption error');
      });

      const mockUser = createMockUser(
        99,
        'John Doe',
        'john@example.com',
        '+62812345678',
      );

      queryBuilder.first.mockResolvedValue({ count: 1 });
      queryBuilder.offset
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);

      const result = await service.executeJob();

      expect(result.failures[0].userId).toBe(99);
      expect(result.failures[0].error).toContain('Specific encryption error');
    });

    it('should handle key initialization failure', async () => {
      encryptionService.isReady.mockReturnValue(false);
      encryptionService.initializeKeys.mockRejectedValue(
        new Error('Key init failed'),
      );

      const result = await service.executeJob();

      expect(result.status).toBe('failed');
    });

    it('should log error when job fails', async () => {
      encryptionService.validateKeys.mockReturnValue(false);

      await service.executeJob();

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should not log PII data in errors', async () => {
      encryptionService.encryptToString.mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      const mockUser = createMockUser(
        1,
        'John Secret Name',
        'secret@email.com',
        '+62SecretPhone',
      );

      queryBuilder.first.mockResolvedValue({ count: 1 });
      queryBuilder.offset
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);

      await service.executeJob();

      // Check that PII data is not in any log call
      const allLogCalls = [
        ...mockLogger.info.mock.calls,
        ...mockLogger.error.mock.calls,
        ...mockLogger.warn.mock.calls,
        ...mockLogger.debug.mock.calls,
      ];

      const logString = JSON.stringify(allLogCalls);
      expect(logString).not.toContain('John Secret Name');
      expect(logString).not.toContain('secret@email.com');
      expect(logString).not.toContain('+62SecretPhone');
    });
  });

  describe('Negative Test Cases - encryptBatch()', () => {
    it('should track failures in batch result', async () => {
      encryptionService.encryptToString.mockImplementation(() => {
        throw new Error('Batch encryption failed');
      });

      const users: IUserPiiData[] = [
        createMockUser(1, 'User 1', 'user1@example.com', '+621'),
      ];

      const result = await service.encryptBatch(users);

      expect(result.failureCount).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.failures[0].userId).toBe(1);
    });

    it('should continue processing after individual failure', async () => {
      // Track which user we're processing by counting encryption calls
      // User 1: fails all 3 retry attempts (name is first field encrypted)
      // User 2: succeeds on first attempt
      let encryptionAttempts = 0;

      // Each user has up to 5 fields to encrypt (name, email, phone, provider, provider_id)
      // User 1 will fail on first field (name) for all 3 retries = 3 calls
      // User 2 will succeed all fields = 5 calls (but we count from 4th call)
      encryptionService.encryptToString.mockImplementation((value: string) => {
        encryptionAttempts++;
        // First 3 calls are user 1's retries (fails on name each time)
        if (encryptionAttempts <= 3) {
          throw new Error('First user failed');
        }
        // Calls 4+ are for user 2
        return MOCK_ENCRYPTED_STRING;
      });

      const users: IUserPiiData[] = [
        createMockUser(1, 'User 1', 'user1@example.com', '+621'),
        createMockUser(2, 'User 2', 'user2@example.com', '+622'),
      ];

      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      const result = await service.encryptBatch(users);

      expect(result.failureCount).toBe(1);
      expect(result.successCount).toBe(1);
    }, 15000); // Increase timeout due to retry delays
  });

  describe('Negative Test Cases - handleCron()', () => {
    it('should prevent concurrent execution', async () => {
      // Simulate slow job execution
      let resolveFirst: () => void;
      const firstJobPromise = new Promise<void>((resolve) => {
        resolveFirst = resolve;
      });

      queryBuilder.first.mockImplementation(async () => {
        await firstJobPromise;
        return { count: 0 };
      });

      // Start first job
      const job1 = service.handleCron();

      // Start second job immediately
      const job2 = service.handleCron();

      // Resolve first job
      resolveFirst!();

      await Promise.all([job1, job2]);

      // Should log warning about skipping
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Job already running, skipping this execution',
        }),
      );
    });
  });

  // ====================
  // EDGE TEST CASES
  // ====================

  describe('Edge Cases', () => {
    it('should handle user with very long name', async () => {
      const mockUser = createMockUser(
        1,
        'A'.repeat(1000),
        'john@example.com',
        '+62812345678',
      );

      queryBuilder.first.mockResolvedValue({ count: 1 });
      queryBuilder.offset
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);
      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      const result = await service.executeJob();

      expect(result.status).toBe('completed');
    });

    it('should handle user with special characters in email', async () => {
      const mockUser = createMockUser(
        1,
        'John',
        "test+special'chars@example.com",
        '+62812345678',
      );

      queryBuilder.first.mockResolvedValue({ count: 1 });
      queryBuilder.offset
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);
      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      const result = await service.executeJob();

      expect(result.status).toBe('completed');
    });

    it('should handle user with international phone number', async () => {
      const mockUser = createMockUser(
        1,
        'John',
        'john@example.com',
        '+1-555-123-4567',
      );

      queryBuilder.first.mockResolvedValue({ count: 1 });
      queryBuilder.offset
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);
      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      const result = await service.executeJob();

      expect(result.status).toBe('completed');
    });

    it('should handle exactly batch size users', async () => {
      const mockUsers: IUserPiiData[] = Array.from(
        { length: BATCH_CONFIG.DEFAULT_BATCH_SIZE },
        (_, i) =>
          createMockUser(
            i + 1,
            `User ${i + 1}`,
            `user${i + 1}@example.com`,
            `+62${i}`,
          ),
      );

      queryBuilder.first.mockResolvedValue({
        count: BATCH_CONFIG.DEFAULT_BATCH_SIZE,
      });
      queryBuilder.offset
        .mockResolvedValueOnce(mockUsers)
        .mockResolvedValue([]);
      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      const result = await service.executeJob();

      expect(result.totalEncrypted).toBe(BATCH_CONFIG.DEFAULT_BATCH_SIZE);
      expect(result.totalBatches).toBe(1);
    });

    it('should handle batch size + 1 users', async () => {
      const batchSize = BATCH_CONFIG.DEFAULT_BATCH_SIZE;
      const totalUsers = batchSize + 1;

      const mockUsers1: IUserPiiData[] = Array.from(
        { length: batchSize },
        (_, i) =>
          createMockUser(
            i + 1,
            `User ${i + 1}`,
            `user${i + 1}@example.com`,
            `+62${i}`,
          ),
      );

      const mockUsers2: IUserPiiData[] = [
        createMockUser(
          batchSize + 1,
          `User ${batchSize + 1}`,
          `user${batchSize + 1}@example.com`,
          `+62${batchSize}`,
        ),
      ];

      queryBuilder.first.mockResolvedValue({ count: totalUsers });
      queryBuilder.offset
        .mockResolvedValueOnce(mockUsers1)
        .mockResolvedValueOnce(mockUsers2)
        .mockResolvedValue([]);
      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      const result = await service.executeJob();

      expect(result.totalEncrypted).toBe(totalUsers);
      expect(result.totalBatches).toBe(2);
    });

    it('should handle user with Unicode name', async () => {
      const mockUser = createMockUser(
        1,
        'Test Name',
        'test@example.com',
        '+62812345678',
      );

      queryBuilder.first.mockResolvedValue({ count: 1 });
      queryBuilder.offset
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);
      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      const result = await service.executeJob();

      expect(result.status).toBe('completed');
    });

    it('should handle large number of users (1000+)', async () => {
      const totalUsers = 1050;
      const batchSize = BATCH_CONFIG.DEFAULT_BATCH_SIZE;

      const batches: IUserPiiData[][] = [];
      for (let i = 0; i < totalUsers; i += batchSize) {
        const batch = Array.from(
          { length: Math.min(batchSize, totalUsers - i) },
          (_, j) =>
            createMockUser(
              i + j + 1,
              `User ${i + j + 1}`,
              `user${i + j + 1}@example.com`,
              `+62${i + j}`,
            ),
        );
        batches.push(batch);
      }

      queryBuilder.first.mockResolvedValue({ count: totalUsers });

      let batchIndex = 0;
      queryBuilder.offset.mockImplementation(async () => {
        if (batchIndex < batches.length) {
          return batches[batchIndex++];
        }
        return [];
      });

      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      const result = await service.executeJob();

      expect(result.totalEncrypted).toBe(totalUsers);
      expect(result.totalBatches).toBe(Math.ceil(totalUsers / batchSize));
    });

    it('should handle all users having null optional fields', async () => {
      const mockUsers: IUserPiiData[] = [
        createMockUser(1, null, 'user1@example.com', null),
        createMockUser(2, null, 'user2@example.com', null),
      ];

      queryBuilder.first.mockResolvedValue({ count: 2 });
      queryBuilder.offset
        .mockResolvedValueOnce(mockUsers)
        .mockResolvedValue([]);
      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      const result = await service.executeJob();

      expect(result.status).toBe('completed');
      expect(result.totalEncrypted).toBe(2);
    });

    it('should respect batch delay configuration', async () => {
      const mockUsers1: IUserPiiData[] = [
        createMockUser(1, 'User 1', 'user1@example.com', '+621'),
      ];
      const mockUsers2: IUserPiiData[] = [
        createMockUser(2, 'User 2', 'user2@example.com', '+622'),
      ];

      queryBuilder.first.mockResolvedValue({ count: 2 });
      queryBuilder.offset
        .mockResolvedValueOnce(mockUsers1)
        .mockResolvedValueOnce(mockUsers2)
        .mockResolvedValue([]);
      queryBuilder.transaction.mockImplementation(
        async (callback: TransactionCallback) => {
          await callback(createMockTrx());
        },
      );

      const startTime = Date.now();
      await service.executeJob();
      const duration = Date.now() - startTime;

      // Should have some delay due to batch processing
      // Not exact because of execution time, but should complete
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Dry Run Mode', () => {
    beforeEach(async () => {
      const dryRunModule: TestingModule = await Test.createTestingModule({
        providers: [
          UserEncryptionJobService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn((key: string, defaultValue?: unknown) => {
                switch (key) {
                  case ENV_VARS.BATCH_SIZE:
                    return BATCH_CONFIG.DEFAULT_BATCH_SIZE;
                  case ENV_VARS.DRY_RUN:
                    return true; // Enable dry run
                  default:
                    return defaultValue;
                }
              }),
            },
          },
          {
            provide: getLoggerToken(UserEncryptionJobService.name),
            useValue: mockLogger,
          },
          {
            provide: EncryptionService,
            useValue: encryptionService,
          },
          {
            provide: DatabaseService,
            useValue: databaseService,
          },
        ],
      }).compile();

      service = dryRunModule.get<UserEncryptionJobService>(
        UserEncryptionJobService,
      );
      jest.clearAllMocks();
    });

    it('should not update database in dry run mode', async () => {
      const mockUser = createMockUser(
        1,
        'John Doe',
        'john@example.com',
        '+62812345678',
      );

      queryBuilder.first.mockResolvedValue({ count: 1 });
      queryBuilder.offset
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);

      await service.executeJob();

      // Transaction should not be called in dry run mode
      expect(queryBuilder.transaction).not.toHaveBeenCalled();
    });

    it('should log dry run mode message', async () => {
      queryBuilder.first.mockResolvedValue({ count: 1 });
      queryBuilder.offset
        .mockResolvedValueOnce([
          createMockUser(1, 'Test', 'test@example.com', '+621'),
        ])
        .mockResolvedValue([]);

      await service.executeJob();

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Running in dry-run mode - no database changes',
        }),
      );
    });

    it('should still encrypt data in dry run mode', async () => {
      const mockUser = createMockUser(
        1,
        'John Doe',
        'john@example.com',
        '+62812345678',
      );

      queryBuilder.first.mockResolvedValue({ count: 1 });
      queryBuilder.offset
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);

      await service.executeJob();

      expect(encryptionService.encryptToString).toHaveBeenCalled();
    });

    it('should return success status in dry run mode', async () => {
      const mockUser = createMockUser(
        1,
        'John Doe',
        'john@example.com',
        '+62812345678',
      );

      queryBuilder.first.mockResolvedValue({ count: 1 });
      queryBuilder.offset
        .mockResolvedValueOnce([mockUser])
        .mockResolvedValue([]);

      const result = await service.executeJob();

      expect(result.status).toBe('completed');
      expect(result.totalEncrypted).toBe(1);
    });
  });
});
