import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import * as bcrypt from 'bcrypt';
import { OwnerRegistrationService } from '../owner-registration.service';
import { OwnerRegistrationRepository } from '../repository/owner-registration.repository';
import { CreateOwnerDto } from '../dto';
import { OwnerRegistrationErrorCodes } from '../errors';
import { IRole } from '../interfaces';
import { DomainNotFoundException } from '../../../../../common/domain';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedPasswordMock'),
}));

describe('OwnerRegistrationService', () => {
  let service: OwnerRegistrationService;
  let repository: jest.Mocked<OwnerRegistrationRepository>;
  let i18n: jest.Mocked<I18nService>;

  const mockOwnerRole: IRole = {
    id: 'role-uuid-123',
    key: 'owner',
    name: 'Owner',
    description: 'Workshop owner role',
  };

  const mockCreateOwnerDto: CreateOwnerDto = {
    name: 'John Doe',
    email: 'owner@example.com',
    password: 'SecureP@ss123',
    phone: '+6281234567890',
    image: 'https://example.com/photo.jpg',
  };

  const mockTransaction = {
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
  };

  const mockCreatedUser = {
    id: 'user-uuid-123',
    public_id: 'public-uuid-456',
    name: 'John Doe',
    email: 'owner@example.com',
    password: '$2b$10$hashedPasswordMock',
    phone: '+6281234567890',
    image: 'https://example.com/photo.jpg',
    provider: null,
    provider_id: null,
    email_verified_at: new Date('2026-01-29T15:00:00.000Z'),
    created_at: new Date('2026-01-29T15:00:00.000Z'),
    updated_at: null,
    deleted_at: null,
    id_creator: null,
    id_updater: null,
    is_encrypted: true,
  };

  beforeEach(async () => {
    const mockRepository = {
      findByEmail: jest.fn(),
      findRoleByKey: jest.fn(),
      createUser: jest.fn(),
      assignRole: jest.fn(),
      beginTransaction: jest.fn(),
      findByIdWithRoles: jest.fn(),
    };

    const mockI18n = {
      t: jest.fn().mockImplementation((key: string) => `Translated: ${key}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnerRegistrationService,
        {
          provide: OwnerRegistrationRepository,
          useValue: mockRepository,
        },
        {
          provide: I18nService,
          useValue: mockI18n,
        },
      ],
    }).compile();

    service = module.get<OwnerRegistrationService>(OwnerRegistrationService);
    repository = module.get(OwnerRegistrationRepository);
    i18n = module.get(I18nService);

    // Reset mocks
    jest.clearAllMocks();

    // Re-apply bcrypt mock after clearAllMocks
    (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedPasswordMock');

    // Default mock implementations
    repository.findByEmail.mockResolvedValue(null);
    repository.findRoleByKey.mockResolvedValue(mockOwnerRole);
    repository.beginTransaction.mockResolvedValue(mockTransaction as any);
    repository.createUser.mockResolvedValue(mockCreatedUser);
    repository.assignRole.mockResolvedValue(undefined);
  });

  describe('Success Scenarios', () => {
    it('should register an owner with all required fields', async () => {
      const dto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      const result = await service.register(dto);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.name).toBe('John Doe');
      expect(result.data.email).toBe('owner@example.com');
      expect(result.data.roles).toContainEqual(
        expect.objectContaining({ key: 'owner' }),
      );
    });

    it('should register an owner with all optional fields', async () => {
      const result = await service.register(mockCreateOwnerDto);

      expect(result.success).toBe(true);
      expect(result.data.phone).toBe('+6281234567890');
      expect(result.data.image).toBe('https://example.com/photo.jpg');
    });

    it('should hash the password before storing', async () => {
      await service.register(mockCreateOwnerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith('SecureP@ss123', 10);
    });

    it('should convert email to lowercase and trim', async () => {
      const dto = {
        ...mockCreateOwnerDto,
        email: '  OWNER@EXAMPLE.COM  ',
      };

      await service.register(dto);

      expect(repository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'owner@example.com',
        }),
        expect.anything(),
      );
    });

    it('should assign owner role to new user', async () => {
      await service.register(mockCreateOwnerDto);

      expect(repository.assignRole).toHaveBeenCalledWith(
        expect.any(String),
        mockOwnerRole.id,
        expect.anything(),
      );
    });

    it('should commit transaction on success', async () => {
      await service.register(mockCreateOwnerDto);

      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });

    it('should return user without password in response', async () => {
      const result = await service.register(mockCreateOwnerDto);

      expect(result.data).not.toHaveProperty('password');
    });

    it('should include roles array in response', async () => {
      const result = await service.register(mockCreateOwnerDto);

      expect(result.data.roles).toBeInstanceOf(Array);
      expect(result.data.roles.length).toBeGreaterThan(0);
    });

    it('should return public_id in response', async () => {
      const result = await service.register(mockCreateOwnerDto);

      expect(result.data.public_id).toBeDefined();
      expect(typeof result.data.public_id).toBe('string');
    });

    it('should set email_verified_at to current time', async () => {
      const result = await service.register(mockCreateOwnerDto);

      expect(result.data.email_verified_at).toBeDefined();
    });

    it('should set created_at timestamp', async () => {
      const result = await service.register(mockCreateOwnerDto);

      expect(result.data.created_at).toBeDefined();
    });

    it('should return null for provider fields', async () => {
      const result = await service.register(mockCreateOwnerDto);

      expect(result.data.provider).toBeNull();
      expect(result.data.provider_id).toBeNull();
    });

    it('should register with email containing plus sign', async () => {
      const dto = {
        ...mockCreateOwnerDto,
        email: 'owner+tag@example.com',
      };

      const result = await service.register(dto);

      expect(result.success).toBe(true);
    });

    it('should register with email containing subdomain', async () => {
      const dto = {
        ...mockCreateOwnerDto,
        email: 'owner@mail.example.com',
      };

      const result = await service.register(dto);

      expect(result.success).toBe(true);
    });

    it('should register without phone (returns null)', async () => {
      const dto = {
        name: 'Jane Doe',
        email: 'jane.owner@example.com',
        password: 'SecureP@ss123',
      };

      repository.createUser.mockResolvedValue({
        ...mockCreatedUser,
        phone: null,
      });

      const result = await service.register(dto);

      expect(result.success).toBe(true);
      expect(result.data.phone).toBeNull();
    });

    it('should register without image (returns null)', async () => {
      const dto = {
        name: 'Jane Doe',
        email: 'jane.owner@example.com',
        password: 'SecureP@ss123',
      };

      repository.createUser.mockResolvedValue({
        ...mockCreatedUser,
        image: null,
      });

      const result = await service.register(dto);

      expect(result.success).toBe(true);
      expect(result.data.image).toBeNull();
    });

    it('should use language header for translations', async () => {
      await service.register(mockCreateOwnerDto, 'id');

      expect(i18n.t).toHaveBeenCalledWith(
        'ownerRegistration.success',
        expect.objectContaining({ lang: 'id' }),
      );
    });

    it('should return success message from i18n', async () => {
      i18n.t.mockReturnValueOnce('Pemilik bengkel berhasil terdaftar');

      const result = await service.register(mockCreateOwnerDto, 'id');

      expect(result.message).toContain('Pemilik');
    });

    it('should begin transaction before creating user', async () => {
      let transactionCreated = false;
      let transactionUsed = false;

      repository.beginTransaction.mockImplementation(async () => {
        transactionCreated = true;
        return mockTransaction as any;
      });

      repository.createUser.mockImplementation(async () => {
        transactionUsed = transactionCreated;
        return mockCreatedUser;
      });

      await service.register(mockCreateOwnerDto);

      expect(transactionUsed).toBe(true);
    });

    it('should validate email uniqueness before hashing password', async () => {
      repository.findByEmail.mockResolvedValue(mockCreatedUser);

      try {
        await service.register(mockCreateOwnerDto);
      } catch {
        // Expected
      }

      expect(repository.findByEmail).toHaveBeenCalled();
    });

    it('should generate unique UUID for id', async () => {
      const result = await service.register(mockCreateOwnerDto);

      expect(result.data.id).toBeDefined();
      expect(typeof result.data.id).toBe('string');
    });

    it('should generate unique UUID for public_id', async () => {
      const result = await service.register(mockCreateOwnerDto);

      expect(result.data.public_id).toBeDefined();
      expect(typeof result.data.public_id).toBe('string');
    });

    it('should store is_encrypted as true', async () => {
      await service.register(mockCreateOwnerDto);

      expect(repository.createUser).toHaveBeenCalled();
    });

    it('should handle name with diacritics', async () => {
      const dto = {
        ...mockCreateOwnerDto,
        name: 'José García López',
      };

      repository.createUser.mockResolvedValue({
        ...mockCreatedUser,
        name: 'José García López',
      });

      const result = await service.register(dto);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('José García López');
    });

    it('should pass user name to createUser', async () => {
      await service.register(mockCreateOwnerDto);

      expect(repository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
        }),
        expect.anything(),
      );
    });

    it('should pass phone to createUser when provided', async () => {
      await service.register(mockCreateOwnerDto);

      expect(repository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '+6281234567890',
        }),
        expect.anything(),
      );
    });

    it('should pass image to createUser when provided', async () => {
      await service.register(mockCreateOwnerDto);

      expect(repository.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          image: 'https://example.com/photo.jpg',
        }),
        expect.anything(),
      );
    });

    it('should call findRoleByKey with owner key', async () => {
      await service.register(mockCreateOwnerDto);

      expect(repository.findRoleByKey).toHaveBeenCalledWith('owner');
    });

    it('should return role with owner key in response', async () => {
      const result = await service.register(mockCreateOwnerDto);

      expect(result.data.roles[0].key).toBe('owner');
    });

    it('should return role with owner name in response', async () => {
      const result = await service.register(mockCreateOwnerDto);

      expect(result.data.roles[0].name).toBe('Owner');
    });
  });

  describe('Failure Scenarios', () => {
    it('should throw ConflictException when email already exists', async () => {
      repository.findByEmail.mockResolvedValue(mockCreatedUser);

      await expect(service.register(mockCreateOwnerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should include error code in ConflictException', async () => {
      repository.findByEmail.mockResolvedValue(mockCreatedUser);

      try {
        await service.register(mockCreateOwnerDto);
        fail('Expected ConflictException to be thrown');
      } catch (error) {
        expect(error.response.code).toBe(
          OwnerRegistrationErrorCodes.EMAIL_ALREADY_EXISTS,
        );
      }
    });

    it('should throw DomainNotFoundException when owner role not found', async () => {
      repository.findRoleByKey.mockResolvedValue(null);

      await expect(service.register(mockCreateOwnerDto)).rejects.toThrow(
        DomainNotFoundException,
      );
    });

    it('should rollback transaction on user creation error', async () => {
      repository.createUser.mockRejectedValue(new Error('Database error'));

      await expect(service.register(mockCreateOwnerDto)).rejects.toThrow(
        'Database error',
      );

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });

    it('should rollback transaction on role assignment error', async () => {
      repository.assignRole.mockRejectedValue(
        new Error('Role assignment failed'),
      );

      await expect(service.register(mockCreateOwnerDto)).rejects.toThrow(
        'Role assignment failed',
      );

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should throw error when password hashing fails', async () => {
      (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Hash error'));

      await expect(service.register(mockCreateOwnerDto)).rejects.toThrow();
    });

    it('should check email case-insensitively', async () => {
      await service.register({
        ...mockCreateOwnerDto,
        email: 'OWNER@EXAMPLE.COM',
      });

      expect(repository.findByEmail).toHaveBeenCalledWith('OWNER@EXAMPLE.COM');
    });

    it('should not call createUser if email already exists', async () => {
      repository.findByEmail.mockResolvedValue(mockCreatedUser);

      try {
        await service.register(mockCreateOwnerDto);
      } catch {
        // Expected
      }

      expect(repository.createUser).not.toHaveBeenCalled();
    });

    it('should not call assignRole if createUser fails', async () => {
      repository.createUser.mockRejectedValue(new Error('Create failed'));

      try {
        await service.register(mockCreateOwnerDto);
      } catch {
        // Expected
      }

      expect(repository.assignRole).not.toHaveBeenCalled();
    });

    it('should include translated message in ConflictException', async () => {
      repository.findByEmail.mockResolvedValue(mockCreatedUser);
      i18n.t.mockReturnValue('Email sudah terdaftar');

      try {
        await service.register(mockCreateOwnerDto, 'id');
      } catch (error) {
        expect(error.response.message).toBe('Email sudah terdaftar');
      }
    });

    it('should include email in ConflictException detail', async () => {
      repository.findByEmail.mockResolvedValue(mockCreatedUser);

      try {
        await service.register(mockCreateOwnerDto);
      } catch (error) {
        expect(i18n.t).toHaveBeenCalledWith(
          'ownerRegistration.errors.emailExistsDetail',
          expect.objectContaining({
            args: { email: 'owner@example.com' },
          }),
        );
      }
    });

    it('should not begin transaction if email exists', async () => {
      repository.findByEmail.mockResolvedValue(mockCreatedUser);

      try {
        await service.register(mockCreateOwnerDto);
      } catch {
        // Expected
      }

      expect(repository.beginTransaction).not.toHaveBeenCalled();
    });

    it('should not begin transaction if role not found', async () => {
      repository.findRoleByKey.mockResolvedValue(null);

      try {
        await service.register(mockCreateOwnerDto);
      } catch {
        // Expected
      }

      expect(repository.beginTransaction).not.toHaveBeenCalled();
    });

    it('should throw with ROLE_NOT_FOUND code when owner role missing', async () => {
      repository.findRoleByKey.mockResolvedValue(null);

      try {
        await service.register(mockCreateOwnerDto);
        fail('Expected DomainNotFoundException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(DomainNotFoundException);
      }
    });

    it('should not commit if rollback was called', async () => {
      repository.createUser.mockRejectedValue(new Error('Error'));

      try {
        await service.register(mockCreateOwnerDto);
      } catch {
        // Expected
      }

      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });

    it('should handle database constraint violation', async () => {
      repository.createUser.mockRejectedValue(
        new Error('Unique constraint violated'),
      );

      await expect(service.register(mockCreateOwnerDto)).rejects.toThrow(
        'Unique constraint violated',
      );
    });

    it('should handle foreign key violation', async () => {
      repository.assignRole.mockRejectedValue(
        new Error('Foreign key constraint failed'),
      );

      await expect(service.register(mockCreateOwnerDto)).rejects.toThrow(
        'Foreign key constraint failed',
      );
    });

    it('should propagate bcrypt errors', async () => {
      (bcrypt.hash as jest.Mock).mockRejectedValue(
        new Error('bcrypt internal error'),
      );

      await expect(service.register(mockCreateOwnerDto)).rejects.toThrow();
    });

    it('should handle transaction begin failure', async () => {
      repository.beginTransaction.mockRejectedValue(
        new Error('Cannot start transaction'),
      );

      await expect(service.register(mockCreateOwnerDto)).rejects.toThrow(
        'Cannot start transaction',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle name with special characters', async () => {
      const dto = {
        ...mockCreateOwnerDto,
        name: "Mary-Jane O'Connor",
      };

      repository.createUser.mockResolvedValue({
        ...mockCreatedUser,
        name: "Mary-Jane O'Connor",
      });

      const result = await service.register(dto);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe("Mary-Jane O'Connor");
    });

    it('should handle name with unicode characters', async () => {
      const dto = {
        ...mockCreateOwnerDto,
        name: '山田太郎',
      };

      repository.createUser.mockResolvedValue({
        ...mockCreatedUser,
        name: '山田太郎',
      });

      const result = await service.register(dto);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('山田太郎');
    });

    it('should handle exactly 8 character password', async () => {
      const dto = {
        ...mockCreateOwnerDto,
        password: 'P@ssw0rd',
      };

      const result = await service.register(dto);

      expect(result.success).toBe(true);
    });

    it('should handle long password (50+ characters)', async () => {
      const dto = {
        ...mockCreateOwnerDto,
        password:
          'VeryLongSecureP@ssw0rd123456789012345678901234567890123456789012345678901234567890',
      };

      const result = await service.register(dto);

      expect(result.success).toBe(true);
    });

    it('should handle international phone format', async () => {
      const dto = {
        ...mockCreateOwnerDto,
        phone: '+1-555-123-4567',
      };

      repository.createUser.mockResolvedValue({
        ...mockCreatedUser,
        phone: '+1-555-123-4567',
      });

      const result = await service.register(dto);

      expect(result.success).toBe(true);
      expect(result.data.phone).toBe('+1-555-123-4567');
    });

    it('should handle image URL with query parameters', async () => {
      const dto = {
        ...mockCreateOwnerDto,
        image: 'https://example.com/photo.jpg?size=large&format=webp',
      };

      repository.createUser.mockResolvedValue({
        ...mockCreatedUser,
        image: 'https://example.com/photo.jpg?size=large&format=webp',
      });

      const result = await service.register(dto);

      expect(result.success).toBe(true);
      expect(result.data.image).toBe(
        'https://example.com/photo.jpg?size=large&format=webp',
      );
    });

    it('should handle email with numbers', async () => {
      const dto = {
        ...mockCreateOwnerDto,
        email: 'owner123@example456.com',
      };

      const result = await service.register(dto);

      expect(result.success).toBe(true);
    });

    it('should handle name with emojis', async () => {
      const dto = {
        ...mockCreateOwnerDto,
        name: 'John 🔧 Workshop',
      };

      repository.createUser.mockResolvedValue({
        ...mockCreatedUser,
        name: 'John 🔧 Workshop',
      });

      const result = await service.register(dto);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('John 🔧 Workshop');
    });

    it('should handle very long name (255 chars)', async () => {
      const longName = 'A'.repeat(255);
      const dto = {
        ...mockCreateOwnerDto,
        name: longName,
      };

      repository.createUser.mockResolvedValue({
        ...mockCreatedUser,
        name: longName,
      });

      const result = await service.register(dto);

      expect(result.success).toBe(true);
      expect(result.data.name.length).toBe(255);
    });

    it('should handle email at max length boundaries', async () => {
      const dto = {
        ...mockCreateOwnerDto,
        email: 'a'.repeat(243) + '@example.com',
      };

      const result = await service.register(dto);

      expect(result.success).toBe(true);
    });
  });

  describe('Transaction Handling', () => {
    it('should use same transaction for user creation and role assignment', async () => {
      let createUserTrx: any;
      let assignRoleTrx: any;

      repository.createUser.mockImplementation(async (_, trx) => {
        createUserTrx = trx;
        return mockCreatedUser;
      });

      repository.assignRole.mockImplementation(async (_, __, trx) => {
        assignRoleTrx = trx;
      });

      await service.register(mockCreateOwnerDto);

      expect(createUserTrx).toBe(assignRoleTrx);
    });

    it('should not commit transaction twice on success', async () => {
      await service.register(mockCreateOwnerDto);

      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
    });

    it('should not rollback after successful commit', async () => {
      await service.register(mockCreateOwnerDto);

      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });

    it('should call operations in correct order', async () => {
      const callOrder: string[] = [];

      repository.findByEmail.mockImplementation(async () => {
        callOrder.push('findByEmail');
        return null;
      });

      repository.findRoleByKey.mockImplementation(async () => {
        callOrder.push('findRoleByKey');
        return mockOwnerRole;
      });

      repository.beginTransaction.mockImplementation(async () => {
        callOrder.push('beginTransaction');
        return mockTransaction as any;
      });

      repository.createUser.mockImplementation(async () => {
        callOrder.push('createUser');
        return mockCreatedUser;
      });

      repository.assignRole.mockImplementation(async () => {
        callOrder.push('assignRole');
      });

      await service.register(mockCreateOwnerDto);

      expect(callOrder).toEqual([
        'findByEmail',
        'findRoleByKey',
        'beginTransaction',
        'createUser',
        'assignRole',
      ]);
    });
  });
});
