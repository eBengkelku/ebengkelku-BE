import { Test, TestingModule } from '@nestjs/testing';
import { CustomerRegistrationController } from '../customer-registration.controller';
import { CustomerRegistrationService } from '../customer-registration.service';
import { CreateCustomerDto } from '../dto';
import { ICustomerWithRoles, IRegistrationResponse } from '../interfaces';

describe('CustomerRegistrationController', () => {
  let controller: CustomerRegistrationController;
  let service: jest.Mocked<CustomerRegistrationService>;

  const mockCustomerWithRoles: ICustomerWithRoles = {
    id: 'user-uuid-123',
    public_id: 'public-uuid-456',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+6281234567890',
    image: 'https://example.com/photo.jpg',
    provider: null,
    provider_id: null,
    email_verified_at: new Date('2026-01-27T15:00:00.000Z'),
    created_at: new Date('2026-01-27T15:00:00.000Z'),
    updated_at: null,
    deleted_at: null,
    id_creator: null,
    id_updater: null,
    roles: [
      {
        id: 'role-uuid-123',
        key: 'customer',
        name: 'Customer',
        description: 'Customer role',
      },
    ],
  };

  const mockRegistrationResponse: IRegistrationResponse = {
    success: true,
    message: 'Customer registered successfully',
    data: mockCustomerWithRoles,
  };

  beforeEach(async () => {
    const mockService = {
      register: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerRegistrationController],
      providers: [
        {
          provide: CustomerRegistrationService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CustomerRegistrationController>(
      CustomerRegistrationController,
    );
    service = module.get(CustomerRegistrationService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should call service.register with dto', async () => {
      const dto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      await controller.register(dto);

      expect(service.register).toHaveBeenCalledWith(dto, undefined);
    });

    it('should pass language header to service', async () => {
      const dto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      await controller.register(dto, 'id');

      expect(service.register).toHaveBeenCalledWith(dto, 'id');
    });

    it('should return registration response from service', async () => {
      const dto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result).toEqual(mockRegistrationResponse);
    });

    it('should return success:true on successful registration', async () => {
      const dto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.success).toBe(true);
    });

    it('should return user data with roles', async () => {
      const dto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.roles).toBeDefined();
      expect(result.data.roles.length).toBeGreaterThan(0);
      expect(result.data.roles[0].key).toBe('customer');
    });

    it('should not include password in response', async () => {
      const dto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data).not.toHaveProperty('password');
    });

    it('should include public_id in response', async () => {
      const dto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.public_id).toBe('public-uuid-456');
    });

    it('should include timestamps in response', async () => {
      const dto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.created_at).toBeDefined();
      expect(result.data.email_verified_at).toBeDefined();
    });

    it('should propagate service errors', async () => {
      const dto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockRejectedValue(new Error('Service error'));

      await expect(controller.register(dto)).rejects.toThrow('Service error');
    });

    it('should handle optional phone field', async () => {
      const dto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecureP@ss123',
        phone: '+6281234567890',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.phone).toBe('+6281234567890');
    });

    it('should handle optional image field', async () => {
      const dto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecureP@ss123',
        image: 'https://example.com/photo.jpg',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.image).toBe('https://example.com/photo.jpg');
    });

    it('should handle all optional fields as undefined', async () => {
      const dto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecureP@ss123',
      };

      const responseWithNulls: IRegistrationResponse = {
        success: true,
        message: 'Customer registered successfully',
        data: {
          ...mockCustomerWithRoles,
          phone: null,
          image: null,
        },
      };

      service.register.mockResolvedValue(responseWithNulls);

      const result = await controller.register(dto);

      expect(result.data.phone).toBeNull();
      expect(result.data.image).toBeNull();
    });
  });

  describe('registration response structure', () => {
    it('should have correct response shape', async () => {
      const dto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('data');
    });

    it('should have correct data shape', async () => {
      const dto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
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
      const dto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.data.roles[0]).toHaveProperty('id');
      expect(result.data.roles[0]).toHaveProperty('key');
      expect(result.data.roles[0]).toHaveProperty('name');
    });
  });

  describe('i18n handling', () => {
    it('should accept en language', async () => {
      const dto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      await controller.register(dto, 'en');

      expect(service.register).toHaveBeenCalledWith(dto, 'en');
    });

    it('should accept id language', async () => {
      const dto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      await controller.register(dto, 'id');

      expect(service.register).toHaveBeenCalledWith(dto, 'id');
    });

    it('should work without language header', async () => {
      const dto: CreateCustomerDto = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'SecureP@ss123',
      };

      service.register.mockResolvedValue(mockRegistrationResponse);

      const result = await controller.register(dto);

      expect(result.success).toBe(true);
    });
  });
});
