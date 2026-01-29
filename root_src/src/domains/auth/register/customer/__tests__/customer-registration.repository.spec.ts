import { Test, TestingModule } from '@nestjs/testing';
import { Knex } from 'knex';
import { CustomerRegistrationRepository } from '../repository/customer-registration.repository';
import { DatabaseService } from '../../../../../database/database.service';
import { EncryptionService } from '../../../../../jobs/user-encryption/services/encryption.service';
import { IUserRow, IRole } from '../interfaces';

describe('CustomerRegistrationRepository', () => {
  let repository: CustomerRegistrationRepository;
  let databaseService: jest.Mocked<DatabaseService>;
  let encryptionService: jest.Mocked<EncryptionService>;

  // Helper to create mock query builder
  const createMockQueryBuilder = (
    overrides: Record<string, jest.Mock> = {},
  ) => ({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    whereNull: jest.fn().mockReturnThis(),
    first: jest.fn(),
    insert: jest.fn().mockResolvedValue([1]),
    leftJoin: jest.fn().mockReturnThis(),
    ...overrides,
  });

  // Create mock transaction as a callable function (Knex transactions are callable)
  const createMockTransaction = () => {
    const mockInsert = jest.fn().mockResolvedValue([1]);
    const mockQueryBuilder = {
      insert: mockInsert,
    };

    // Create callable function that returns query builder
    const trxFn = jest.fn().mockReturnValue(mockQueryBuilder);

    // Add transaction methods
    (trxFn as any).commit = jest.fn().mockResolvedValue(undefined);
    (trxFn as any).rollback = jest.fn().mockResolvedValue(undefined);
    (trxFn as any).insert = mockInsert; // For direct access in tests

    return trxFn as unknown as Knex.Transaction;
  };

  let mockTransaction: Knex.Transaction;

  const mockUserRow: IUserRow = {
    id: 'user-uuid-123',
    public_id: 'public-uuid-456',
    name: 'encrypted-name',
    email: 'encrypted-email',
    password: '$2b$10$hashedPasswordMock',
    phone: 'encrypted-phone',
    image: 'https://example.com/photo.jpg',
    provider: null,
    provider_id: null,
    email_verified_at: new Date('2026-01-27T15:00:00.000Z'),
    created_at: new Date('2026-01-27T15:00:00.000Z'),
    updated_at: null,
    deleted_at: null,
    id_creator: null,
    id_updater: null,
    is_encrypted: true,
  };

  const mockRole: IRole = {
    id: 'role-uuid-123',
    key: 'customer',
    name: 'Customer',
    description: 'Customer role',
  };

  // Helper to create mock Knex instance
  const createMockKnex = (
    queryBuilder: ReturnType<typeof createMockQueryBuilder>,
  ) => {
    const mockKnexFn = jest.fn().mockReturnValue(queryBuilder);
    (mockKnexFn as unknown as Knex).transaction = jest.fn();
    return mockKnexFn as unknown as Knex;
  };

  beforeEach(async () => {
    // Initialize mockTransaction for each test
    mockTransaction = createMockTransaction();

    const mockDatabaseService = {
      getKnex: jest.fn(),
    };

    const mockEncryptionService = {
      encryptToString: jest
        .fn()
        .mockImplementation((value: string) => `encrypted-${value}`),
      decryptFromString: jest.fn().mockImplementation((value: string) => {
        if (value.startsWith('encrypted-')) {
          return value.replace('encrypted-', '');
        }
        return value;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerRegistrationRepository,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    repository = module.get<CustomerRegistrationRepository>(
      CustomerRegistrationRepository,
    );
    databaseService = module.get(DatabaseService);
    encryptionService = module.get(EncryptionService);

    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should find user by exact email match (case-insensitive)', async () => {
      const mockQueryBuilder = createMockQueryBuilder({
        select: jest.fn().mockResolvedValue([mockUserRow]),
      });

      databaseService.getKnex.mockReturnValue(createMockKnex(mockQueryBuilder));

      const result = await repository.findByEmail('EMAIL');

      expect(result).not.toBeNull();
      expect(mockQueryBuilder.whereNull).toHaveBeenCalledWith('deleted_at');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
    });

    it('should return null when user not found', async () => {
      const mockQueryBuilder = createMockQueryBuilder({
        select: jest.fn().mockResolvedValue([]),
      });

      databaseService.getKnex.mockReturnValue(createMockKnex(mockQueryBuilder));

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle encrypted email decryption', async () => {
      const userWithEncryptedEmail: IUserRow = {
        ...mockUserRow,
        email: 'encrypted-test@example.com',
        is_encrypted: true,
      };

      const mockQueryBuilder = createMockQueryBuilder({
        select: jest.fn().mockResolvedValue([userWithEncryptedEmail]),
      });

      databaseService.getKnex.mockReturnValue(createMockKnex(mockQueryBuilder));

      const result = await repository.findByEmail('test@example.com');

      expect(encryptionService.decryptFromString).toHaveBeenCalled();
      expect(result).not.toBeNull();
    });

    it('should handle non-encrypted email', async () => {
      const userWithPlainEmail: IUserRow = {
        ...mockUserRow,
        email: 'plain@example.com',
        is_encrypted: false,
      };

      const mockQueryBuilder = createMockQueryBuilder({
        select: jest.fn().mockResolvedValue([userWithPlainEmail]),
      });

      databaseService.getKnex.mockReturnValue(createMockKnex(mockQueryBuilder));

      const result = await repository.findByEmail('plain@example.com');

      expect(result).not.toBeNull();
      expect(result?.email).toBe('plain@example.com');
    });

    it('should skip users with decryption errors', async () => {
      const userWithBadEncryption: IUserRow = {
        ...mockUserRow,
        email: 'bad-encrypted-data',
        is_encrypted: true,
      };

      const mockQueryBuilder = createMockQueryBuilder({
        select: jest.fn().mockResolvedValue([userWithBadEncryption]),
      });

      databaseService.getKnex.mockReturnValue(createMockKnex(mockQueryBuilder));
      encryptionService.decryptFromString.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const result = await repository.findByEmail('test@example.com');

      expect(result).toBeNull();
    });

    it('should only search non-deleted users', async () => {
      const mockQueryBuilder = createMockQueryBuilder({
        select: jest.fn().mockResolvedValue([]),
      });

      databaseService.getKnex.mockReturnValue(createMockKnex(mockQueryBuilder));

      await repository.findByEmail('test@example.com');

      expect(mockQueryBuilder.whereNull).toHaveBeenCalledWith('deleted_at');
    });
  });

  describe('findRoleByKey', () => {
    it('should find role by key', async () => {
      const mockQueryBuilder = createMockQueryBuilder({
        first: jest.fn().mockResolvedValue(mockRole),
      });

      databaseService.getKnex.mockReturnValue(createMockKnex(mockQueryBuilder));

      const result = await repository.findRoleByKey('customer');

      expect(result).toEqual(mockRole);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('key', 'customer');
    });

    it('should return null when role not found', async () => {
      const mockQueryBuilder = createMockQueryBuilder({
        first: jest.fn().mockResolvedValue(undefined),
      });

      databaseService.getKnex.mockReturnValue(createMockKnex(mockQueryBuilder));

      const result = await repository.findRoleByKey('nonexistent');

      expect(result).toBeNull();
    });

    it('should only search non-deleted roles', async () => {
      const mockQueryBuilder = createMockQueryBuilder({
        first: jest.fn().mockResolvedValue(mockRole),
      });

      databaseService.getKnex.mockReturnValue(createMockKnex(mockQueryBuilder));

      await repository.findRoleByKey('customer');

      expect(mockQueryBuilder.whereNull).toHaveBeenCalledWith('deleted_at');
    });
  });

  describe('createUser', () => {
    it('should create user with all fields', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: '$2b$10$hashedPassword',
        phone: '+6281234567890',
        image: 'https://example.com/photo.jpg',
      };

      const result = await repository.createUser(userData, mockTransaction);

      expect(result).toBeDefined();
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.password).toBe('$2b$10$hashedPassword');
      expect(result.phone).toBe('+6281234567890');
      expect(result.image).toBe('https://example.com/photo.jpg');
    });

    it('should encrypt PII fields (name, email, phone)', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: '$2b$10$hashedPassword',
        phone: '+6281234567890',
      };

      await repository.createUser(userData, mockTransaction);

      expect(encryptionService.encryptToString).toHaveBeenCalledWith(
        'John Doe',
      );
      expect(encryptionService.encryptToString).toHaveBeenCalledWith(
        'john.doe@example.com',
      );
      expect(encryptionService.encryptToString).toHaveBeenCalledWith(
        '+6281234567890',
      );
    });

    it('should handle optional phone (null)', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: '$2b$10$hashedPassword',
      };

      const result = await repository.createUser(userData, mockTransaction);

      expect(result.phone).toBeNull();
    });

    it('should handle optional image (null)', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: '$2b$10$hashedPassword',
      };

      const result = await repository.createUser(userData, mockTransaction);

      expect(result.image).toBeNull();
    });

    it('should generate UUIDs for id and public_id', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: '$2b$10$hashedPassword',
      };

      const result = await repository.createUser(userData, mockTransaction);

      expect(result.id).toBeDefined();
      expect(result.public_id).toBeDefined();
      // UUID format validation
      expect(result.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(result.public_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should set email_verified_at to current date', async () => {
      const beforeCreate = new Date();

      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: '$2b$10$hashedPassword',
      };

      const result = await repository.createUser(userData, mockTransaction);

      expect(result.email_verified_at).toBeInstanceOf(Date);
      expect(result.email_verified_at!.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime(),
      );
    });

    it('should set is_encrypted to true', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: '$2b$10$hashedPassword',
      };

      const result = await repository.createUser(userData, mockTransaction);

      expect(result.is_encrypted).toBe(true);
    });

    it('should return unencrypted values for response', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: '$2b$10$hashedPassword',
        phone: '+6281234567890',
      };

      const result = await repository.createUser(userData, mockTransaction);

      // Response should contain original unencrypted values
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john.doe@example.com');
      expect(result.phone).toBe('+6281234567890');
    });
  });

  describe('assignRole', () => {
    it('should insert user_role record', async () => {
      await repository.assignRole(
        'user-uuid-123',
        'role-uuid-456',
        mockTransaction,
      );

      expect(
        (mockTransaction as unknown as { insert: jest.Mock }).insert,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-uuid-123',
          role_id: 'role-uuid-456',
        }),
      );
    });

    it('should include created_at timestamp', async () => {
      const beforeAssign = new Date();

      await repository.assignRole(
        'user-uuid-123',
        'role-uuid-456',
        mockTransaction,
      );

      const insertMock = (mockTransaction as unknown as { insert: jest.Mock })
        .insert;
      const insertCall = insertMock.mock.calls[0][0];
      expect(insertCall.created_at).toBeInstanceOf(Date);
      expect(insertCall.created_at.getTime()).toBeGreaterThanOrEqual(
        beforeAssign.getTime(),
      );
    });
  });

  describe('findByIdWithRoles', () => {
    it('should find user by ID with roles', async () => {
      const mockUserQueryBuilder = createMockQueryBuilder({
        first: jest.fn().mockResolvedValue(mockUserRow),
      });

      const mockRolesQueryBuilder = createMockQueryBuilder({
        select: jest.fn().mockResolvedValue([mockRole]),
      });

      let callCount = 0;
      const mockKnexFn = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return mockUserQueryBuilder;
        }
        return mockRolesQueryBuilder;
      });
      (mockKnexFn as unknown as Knex).transaction = jest.fn();

      databaseService.getKnex.mockReturnValue(mockKnexFn as unknown as Knex);

      const result = await repository.findByIdWithRoles('user-uuid-123');

      expect(result).not.toBeNull();
      expect(result?.roles).toHaveLength(1);
    });

    it('should return null when user not found', async () => {
      const mockQueryBuilder = createMockQueryBuilder({
        first: jest.fn().mockResolvedValue(undefined),
      });

      databaseService.getKnex.mockReturnValue(createMockKnex(mockQueryBuilder));

      const result = await repository.findByIdWithRoles('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should decrypt user PII fields', async () => {
      const encryptedUser: IUserRow = {
        ...mockUserRow,
        name: 'encrypted-John Doe',
        email: 'encrypted-john@example.com',
        phone: 'encrypted-+6281234567890',
        is_encrypted: true,
      };

      const mockUserQueryBuilder = createMockQueryBuilder({
        first: jest.fn().mockResolvedValue(encryptedUser),
      });

      const mockRolesQueryBuilder = createMockQueryBuilder({
        select: jest.fn().mockResolvedValue([]),
      });

      let callCount = 0;
      const mockKnexFn = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return mockUserQueryBuilder;
        }
        return mockRolesQueryBuilder;
      });
      (mockKnexFn as unknown as Knex).transaction = jest.fn();

      databaseService.getKnex.mockReturnValue(mockKnexFn as unknown as Knex);

      const result = await repository.findByIdWithRoles('user-uuid-123');

      expect(encryptionService.decryptFromString).toHaveBeenCalled();
      expect(result?.name).toBe('John Doe');
      expect(result?.email).toBe('john@example.com');
    });

    it('should return empty roles array if no roles assigned', async () => {
      const mockUserQueryBuilder = createMockQueryBuilder({
        first: jest.fn().mockResolvedValue(mockUserRow),
      });

      const mockRolesQueryBuilder = createMockQueryBuilder({
        select: jest.fn().mockResolvedValue([]),
      });

      let callCount = 0;
      const mockKnexFn = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return mockUserQueryBuilder;
        }
        return mockRolesQueryBuilder;
      });
      (mockKnexFn as unknown as Knex).transaction = jest.fn();

      databaseService.getKnex.mockReturnValue(mockKnexFn as unknown as Knex);

      const result = await repository.findByIdWithRoles('user-uuid-123');

      expect(result?.roles).toEqual([]);
    });

    it('should handle decryption failure gracefully', async () => {
      const encryptedUser: IUserRow = {
        ...mockUserRow,
        is_encrypted: true,
      };

      const mockUserQueryBuilder = createMockQueryBuilder({
        first: jest.fn().mockResolvedValue(encryptedUser),
      });

      const mockRolesQueryBuilder = createMockQueryBuilder({
        select: jest.fn().mockResolvedValue([]),
      });

      let callCount = 0;
      const mockKnexFn = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return mockUserQueryBuilder;
        }
        return mockRolesQueryBuilder;
      });
      (mockKnexFn as unknown as Knex).transaction = jest.fn();

      databaseService.getKnex.mockReturnValue(mockKnexFn as unknown as Knex);

      encryptionService.decryptFromString.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      // Should not throw error, just return original encrypted values
      const result = await repository.findByIdWithRoles('user-uuid-123');

      expect(result).not.toBeNull();
    });

    it('should not decrypt non-encrypted user', async () => {
      const nonEncryptedUser: IUserRow = {
        ...mockUserRow,
        name: 'Plain Name',
        email: 'plain@example.com',
        is_encrypted: false,
      };

      const mockUserQueryBuilder = createMockQueryBuilder({
        first: jest.fn().mockResolvedValue(nonEncryptedUser),
      });

      const mockRolesQueryBuilder = createMockQueryBuilder({
        select: jest.fn().mockResolvedValue([]),
      });

      let callCount = 0;
      const mockKnexFn = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return mockUserQueryBuilder;
        }
        return mockRolesQueryBuilder;
      });
      (mockKnexFn as unknown as Knex).transaction = jest.fn();

      databaseService.getKnex.mockReturnValue(mockKnexFn as unknown as Knex);

      const result = await repository.findByIdWithRoles('user-uuid-123');

      expect(result?.name).toBe('Plain Name');
      expect(result?.email).toBe('plain@example.com');
    });
  });

  describe('beginTransaction', () => {
    it('should return Knex transaction', async () => {
      const mockTrx = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };

      const mockKnexInstance = {
        transaction: jest.fn().mockResolvedValue(mockTrx),
      } as unknown as Knex;

      databaseService.getKnex.mockReturnValue(mockKnexInstance);

      const result = await repository.beginTransaction();

      expect(mockKnexInstance.transaction).toHaveBeenCalled();
      expect(result).toBe(mockTrx);
    });
  });
});
