import { Test, TestingModule } from '@nestjs/testing';
import { OwnerRegistrationController } from '../owner-registration.controller';
import { OwnerRegistrationService } from '../owner-registration.service';
import { CreateOwnerDto } from '../dto';
import { IOwnerWithRoles, IRegistrationResponse } from '../interfaces';

describe('OwnerRegistrationController', () => {
  let controller: OwnerRegistrationController;
  let service: jest.Mocked<OwnerRegistrationService>;

  const mockOwnerWithRoles: IOwnerWithRoles = {
    id: 'user-uuid-123',
    public_id: 'public-uuid-456',
    name: 'John Doe',
    email: 'owner@example.com',
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
    roles: [
      {
        id: 'role-uuid-123',
        key: 'owner',
        name: 'Owner',
        description: 'Workshop owner role',
      },
    ],
  };

  const mockRegistrationResponse: IRegistrationResponse = {
    success: true,
    message: 'Workshop owner registered successfully',
    data: mockOwnerWithRoles,
  };

  beforeEach(async () => {
    const mockService = {
      register: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OwnerRegistrationController],
      providers: [
        {
          provide: OwnerRegistrationService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<OwnerRegistrationController>(
      OwnerRegistrationController,
    );
    service = module.get(OwnerRegistrationService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should call service.register with dto', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      await controller.register(dto);

      expect(service.register).toHaveBeenCalledWith(dto, undefined);
    });

    it('should pass language header to service', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      await controller.register(dto, 'id');

      expect(service.register).toHaveBeenCalledWith(dto, 'id');
    });

    it('should return registration response from service', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result).toEqual(mockRegistrationResponse);
    });

    it('should return success:true on successful registration', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.success).toBe(true);
    });

    it('should return user data with roles', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.roles).toBeDefined();
      expect(result.data.roles.length).toBeGreaterThan(0);
      expect(result.data.roles[0].key).toBe('owner');
    });

    it('should not include password in response', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data).not.toHaveProperty('password');
    });

    it('should include public_id in response', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.public_id).toBe('public-uuid-456');
    });

    it('should include timestamps in response', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.created_at).toBeDefined();
      expect(result.data.email_verified_at).toBeDefined();
    });

    it('should propagate service errors', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockRejectedValue(new Error('Service error'));

      await expect(controller.register(dto)).rejects.toThrow('Service error');
    });

    it('should handle optional phone field', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
        phone: '+6281234567890',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.phone).toBe('+6281234567890');
    });

    it('should handle optional image field', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
        image: 'https://example.com/photo.jpg',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.image).toBe('https://example.com/photo.jpg');
    });

    it('should handle all optional fields as undefined', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      const responseWithNulls: IRegistrationResponse = {
        success: true,
        message: 'Workshop owner registered successfully',
        data: {
          ...mockOwnerWithRoles,
          phone: null,
          image: null,
        },
      };

      service.register.mockResolvedValue(responseWithNulls);

      const result = await controller.register(dto);

      expect(result.data.phone).toBeNull();
      expect(result.data.image).toBeNull();
    });

    it('should pass all dto fields to service', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
        phone: '+6281234567890',
        image: 'https://example.com/photo.jpg',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      await controller.register(dto);

      expect(service.register).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'owner@example.com',
          password: 'SecureP@ss123',
          phone: '+6281234567890',
          image: 'https://example.com/photo.jpg',
        }),
        undefined,
      );
    });

    it('should return message from service', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.message).toBe('Workshop owner registered successfully');
    });

    it('should return id in response', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.id).toBe('user-uuid-123');
    });

    it('should return name in response', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.name).toBe('John Doe');
    });

    it('should return email in response', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.email).toBe('owner@example.com');
    });
  });

  describe('registration response structure', () => {
    it('should have correct response shape', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('data');
    });

    it('should have correct data shape', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('public_id');
      expect(result.data).toHaveProperty('name');
      expect(result.data).toHaveProperty('email');
      expect(result.data).toHaveProperty('roles');
    });

    it('should have correct role shape', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.roles[0]).toHaveProperty('id');
      expect(result.data.roles[0]).toHaveProperty('key');
      expect(result.data.roles[0]).toHaveProperty('name');
    });

    it('should have role with owner key', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.roles[0].key).toBe('owner');
    });

    it('should have null provider by default', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.provider).toBeNull();
    });

    it('should have null provider_id by default', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.provider_id).toBeNull();
    });

    it('should have null updated_at by default', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.updated_at).toBeNull();
    });

    it('should have null deleted_at by default', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.deleted_at).toBeNull();
    });

    it('should have null id_creator by default', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.id_creator).toBeNull();
    });

    it('should have null id_updater by default', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.id_updater).toBeNull();
    });
  });

  describe('i18n handling', () => {
    it('should accept en language', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      await controller.register(dto, 'en');

      expect(service.register).toHaveBeenCalledWith(dto, 'en');
    });

    it('should accept id language', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      await controller.register(dto, 'id');

      expect(service.register).toHaveBeenCalledWith(dto, 'id');
    });

    it('should work without language header', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.success).toBe(true);
    });

    it('should pass undefined lang when header is not provided', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      await controller.register(dto);

      expect(service.register).toHaveBeenCalledWith(dto, undefined);
    });

    it('should return Indonesian message when lang is id', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      const indonesianResponse: IRegistrationResponse = {
        success: true,
        message: 'Pemilik bengkel berhasil terdaftar',
        data: mockOwnerWithRoles,
      };

      service.register.mockResolvedValue(indonesianResponse);

      const result = await controller.register(dto, 'id');

      expect(result.message).toBe('Pemilik bengkel berhasil terdaftar');
    });
  });

  describe('error handling', () => {
    it('should propagate ConflictException from service', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      const conflictError = {
        statusCode: 409,
        code: 'OWNER_EMAIL_ALREADY_EXISTS',
        message: 'Email already registered',
      };

      service.register.mockRejectedValue(conflictError);

      await expect(controller.register(dto)).rejects.toEqual(conflictError);
    });

    it('should propagate DomainNotFoundException from service', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      const notFoundError = new Error('Owner role not found');
      service.register.mockRejectedValue(notFoundError);

      await expect(controller.register(dto)).rejects.toThrow(
        'Owner role not found',
      );
    });

    it('should propagate database errors from service', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(controller.register(dto)).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should propagate validation errors from service', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.register(dto)).rejects.toThrow(
        'Validation failed',
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty phone as undefined', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
        phone: undefined,
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      await controller.register(dto);

      expect(service.register).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: undefined,
        }),
        undefined,
      );
    });

    it('should handle empty image as undefined', async () => {
      const dto: CreateOwnerDto = {
        name: 'John Doe',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
        image: undefined,
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      await controller.register(dto);

      expect(service.register).toHaveBeenCalledWith(
        expect.objectContaining({
          image: undefined,
        }),
        undefined,
      );
    });

    it('should handle special characters in name', async () => {
      const dto: CreateOwnerDto = {
        name: "Mary-Jane O'Connor",
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      const responseWithSpecialName: IRegistrationResponse = {
        success: true,
        message: 'Workshop owner registered successfully',
        data: {
          ...mockOwnerWithRoles,
          name: "Mary-Jane O'Connor",
        },
      };

      service.register.mockResolvedValue(responseWithSpecialName);

      const result = await controller.register(dto);

      expect(result.data.name).toBe("Mary-Jane O'Connor");
    });

    it('should handle unicode in name', async () => {
      const dto: CreateOwnerDto = {
        name: '山田太郎',
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      const responseWithUnicodeName: IRegistrationResponse = {
        success: true,
        message: 'Workshop owner registered successfully',
        data: {
          ...mockOwnerWithRoles,
          name: '山田太郎',
        },
      };

      service.register.mockResolvedValue(responseWithUnicodeName);

      const result = await controller.register(dto);

      expect(result.data.name).toBe('山田太郎');
    });

    it('should handle very long name', async () => {
      const longName = 'A'.repeat(255);
      const dto: CreateOwnerDto = {
        name: longName,
        email: 'owner@example.com',
        password: 'SecureP@ss123',
      };

      const responseWithLongName: IRegistrationResponse = {
        success: true,
        message: 'Workshop owner registered successfully',
        data: {
          ...mockOwnerWithRoles,
          name: longName,
        },
      };

      service.register.mockResolvedValue(responseWithLongName);

      const result = await controller.register(dto);

      expect(result.data.name.length).toBe(255);
    });
  });
});
