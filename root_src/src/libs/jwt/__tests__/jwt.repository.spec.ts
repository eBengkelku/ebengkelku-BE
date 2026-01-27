/**
 * JWT Repository Unit Tests
 *
 * Test suite for the JwtRepository.
 * Tests database operations for user, role, and permission lookups.
 *
 * @module Libs/JWT/Tests
 * @version 1.0.0
 * @since 2026-01-27
 */

import { Test, TestingModule } from '@nestjs/testing';
import { JwtRepository } from '../services/jwt.repository';
import { DatabaseService } from '../../../database/database.service';
import { EncryptionService } from '../../../jobs/user-encryption/services/encryption.service';
import { IUserRow } from '../interfaces';

describe('JwtRepository', () => {
  let repository: JwtRepository;
  let databaseService: jest.Mocked<DatabaseService>;
  let encryptionService: jest.Mocked<EncryptionService>;

  // Mock Knex query builder
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    whereNull: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    first: jest.fn(),
    map: jest.fn().mockReturnThis(),
  };

  const mockKnex = jest.fn().mockReturnValue(mockQueryBuilder);

  const mockDatabaseService = {
    getKnex: jest.fn().mockReturnValue(mockKnex),
  };

  const mockEncryptionService = {
    decryptFromString: jest
      .fn()
      .mockImplementation((value: string) => `decrypted:${value}`),
  };

  // Test data
  const mockUserRow: IUserRow = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    public_id: 'ff1a1d44-8df0-4b6b-b089-a912d4bc0220',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+62812345678',
    password: 'hashed_password',
    image: null,
    provider: null,
    provider_id: null,
    email_verified_at: new Date(),
    created_at: new Date(),
    updated_at: null,
    deleted_at: null,
    id_creator: null,
    id_updater: null,
    is_encrypted: false,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtRepository,
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

    repository = module.get<JwtRepository>(JwtRepository);
    databaseService = module.get(
      DatabaseService,
    ) as jest.Mocked<DatabaseService>;
    encryptionService = module.get(
      EncryptionService,
    ) as jest.Mocked<EncryptionService>;
  });

  // ====================
  // findUserByPublicId TESTS
  // ====================

  describe('findUserByPublicId', () => {
    it('should return user data when user exists', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockUserRow);

      const result = await repository.findUserByPublicId(mockUserRow.public_id);

      expect(result).toBeDefined();
      expect(result!.public_id).toBe(mockUserRow.public_id);
    });

    it('should return null when user not found', async () => {
      mockQueryBuilder.first.mockResolvedValue(undefined);

      const result = await repository.findUserByPublicId('non-existent-id');

      expect(result).toBeNull();
    });

    it('should call whereNull for deleted_at', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockUserRow);

      await repository.findUserByPublicId(mockUserRow.public_id);

      expect(mockQueryBuilder.whereNull).toHaveBeenCalledWith('deleted_at');
    });

    it('should call where with correct public_id', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockUserRow);

      await repository.findUserByPublicId(mockUserRow.public_id);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'public_id',
        mockUserRow.public_id,
      );
    });

    it('should decrypt name when user is encrypted', async () => {
      const encryptedUser: IUserRow = { ...mockUserRow, is_encrypted: true };
      mockQueryBuilder.first.mockResolvedValue(encryptedUser);

      const result = await repository.findUserByPublicId(mockUserRow.public_id);

      expect(encryptionService.decryptFromString).toHaveBeenCalledWith(
        mockUserRow.name,
      );
      expect(result!.name).toBe(`decrypted:${mockUserRow.name}`);
    });

    it('should decrypt email when user is encrypted', async () => {
      const encryptedUser: IUserRow = { ...mockUserRow, is_encrypted: true };
      mockQueryBuilder.first.mockResolvedValue(encryptedUser);

      const result = await repository.findUserByPublicId(mockUserRow.public_id);

      expect(encryptionService.decryptFromString).toHaveBeenCalledWith(
        mockUserRow.email,
      );
      expect(result!.email).toBe(`decrypted:${mockUserRow.email}`);
    });

    it('should not decrypt when user is not encrypted', async () => {
      const unencryptedUser: IUserRow = { ...mockUserRow, is_encrypted: false };
      mockQueryBuilder.first.mockResolvedValue(unencryptedUser);

      const result = await repository.findUserByPublicId(mockUserRow.public_id);

      expect(encryptionService.decryptFromString).not.toHaveBeenCalled();
      expect(result!.name).toBe(mockUserRow.name);
    });

    it('should throw error when database query fails', async () => {
      mockQueryBuilder.first.mockRejectedValue(new Error('Database error'));

      await expect(
        repository.findUserByPublicId(mockUserRow.public_id),
      ).rejects.toThrow('Database error');
    });

    it('should return encrypted values when decryption fails', async () => {
      const encryptedUser: IUserRow = { ...mockUserRow, is_encrypted: true };
      mockQueryBuilder.first.mockResolvedValue(encryptedUser);
      encryptionService.decryptFromString.mockImplementation(() => {
        throw new Error('Decryption failed');
      });

      const result = await repository.findUserByPublicId(mockUserRow.public_id);

      // Should return original encrypted values
      expect(result!.name).toBe(mockUserRow.name);
    });
  });

  // ====================
  // findUserById TESTS
  // ====================

  describe('findUserById', () => {
    it('should return user data when user exists', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockUserRow);

      const result = await repository.findUserById(mockUserRow.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(mockUserRow.id);
    });

    it('should return null when user not found', async () => {
      mockQueryBuilder.first.mockResolvedValue(undefined);

      const result = await repository.findUserById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should call where with correct id', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockUserRow);

      await repository.findUserById(mockUserRow.id);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('id', mockUserRow.id);
    });
  });

  // ====================
  // findUserRole TESTS
  // ====================

  describe('findUserRole', () => {
    const mockRoleResult = {
      id: '660e8400-e29b-41d4-a716-446655440001',
      key: 'customer',
      name: 'Customer',
    };

    it('should return role data when role exists', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockRoleResult);

      const result = await repository.findUserRole(mockUserRow.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(mockRoleResult.id);
      expect(result!.key).toBe(mockRoleResult.key);
    });

    it('should return null when role not found', async () => {
      mockQueryBuilder.first.mockResolvedValue(undefined);

      const result = await repository.findUserRole(mockUserRow.id);

      expect(result).toBeNull();
    });

    it('should use left join for roles table', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockRoleResult);

      await repository.findUserRole(mockUserRow.id);

      expect(mockQueryBuilder.leftJoin).toHaveBeenCalled();
    });

    it('should filter by user_id', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockRoleResult);

      await repository.findUserRole(mockUserRow.id);

      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });

    it('should filter deleted user_roles', async () => {
      mockQueryBuilder.first.mockResolvedValue(mockRoleResult);

      await repository.findUserRole(mockUserRow.id);

      expect(mockQueryBuilder.whereNull).toHaveBeenCalled();
    });

    it('should throw error when database query fails', async () => {
      mockQueryBuilder.first.mockRejectedValue(new Error('Database error'));

      await expect(repository.findUserRole(mockUserRow.id)).rejects.toThrow(
        'Database error',
      );
    });
  });

  // ====================
  // findRolePermissions TESTS
  // ====================

  describe('findRolePermissions', () => {
    const mockRoleId = '660e8400-e29b-41d4-a716-446655440001';

    it('should return permission keys when permissions exist', async () => {
      const mockPermissions = [
        { key: 'read:profile' },
        { key: 'write:profile' },
      ];
      mockQueryBuilder.select.mockResolvedValue(mockPermissions);

      const result = await repository.findRolePermissions(mockRoleId);

      expect(result).toContain('read:profile');
      expect(result).toContain('write:profile');
    });

    it('should return empty array when no permissions', async () => {
      mockQueryBuilder.select.mockResolvedValue([]);

      const result = await repository.findRolePermissions(mockRoleId);

      expect(result).toEqual([]);
    });

    it('should filter out null/undefined keys', async () => {
      const mockPermissions = [
        { key: 'read:profile' },
        { key: null },
        { key: undefined },
      ];
      mockQueryBuilder.select.mockResolvedValue(mockPermissions);

      const result = await repository.findRolePermissions(mockRoleId);

      expect(result).toContain('read:profile');
      expect(result.length).toBe(1);
    });

    it('should use left join for permissions table', async () => {
      mockQueryBuilder.select.mockResolvedValue([]);

      await repository.findRolePermissions(mockRoleId);

      expect(mockQueryBuilder.leftJoin).toHaveBeenCalled();
    });

    it('should filter by role_id', async () => {
      mockQueryBuilder.select.mockResolvedValue([]);

      await repository.findRolePermissions(mockRoleId);

      expect(mockQueryBuilder.where).toHaveBeenCalled();
    });

    it('should throw error when database query fails', async () => {
      mockQueryBuilder.select.mockRejectedValue(new Error('Database error'));

      await expect(repository.findRolePermissions(mockRoleId)).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle many permissions efficiently', async () => {
      const manyPermissions = Array.from({ length: 100 }, (_, i) => ({
        key: `perm:${i}`,
      }));
      mockQueryBuilder.select.mockResolvedValue(manyPermissions);

      const result = await repository.findRolePermissions(mockRoleId);

      expect(result.length).toBe(100);
    });
  });
});
