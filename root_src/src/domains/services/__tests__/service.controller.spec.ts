import { Test, TestingModule } from '@nestjs/testing';
import { ServiceController } from '../service.controller';
import { ServiceService } from '../service.service';
import { JwtAuthGuard } from '../../../auth/jwt.guard';
import {
  CreateServiceDto,
  BatchCreateServicesDto,
  UpdateServiceDto,
  DeleteServiceDto,
} from '../dto';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('ServiceController', () => {
  let controller: ServiceController;
  let service: jest.Mocked<ServiceService>;

  const mockUser = { sub: 'user-123' };
  const mockService = {
    id: 'service-123',
    business_id: 'business-123',
    name: 'Test Service',
    description: 'Test description',
    price: 150000,
    duration_minutes: 30,
    daily_quota: 10,
    id_creator: 'user-123',
    created_at: new Date(),
    updated_at: null,
    deleted_at: null,
  };

  beforeEach(async () => {
    const mockServiceService = {
      createSingle: jest.fn(),
      createBatch: jest.fn(),
      findById: jest.fn(),
      findByBusinessId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceController],
      providers: [
        {
          provide: ServiceService,
          useValue: mockServiceService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ServiceController>(ServiceController);
    service = module.get(ServiceService);
  });

  describe('create', () => {
    const createDto: CreateServiceDto = {
      business_id: 'business-123',
      name: 'New Service',
      description: 'Service description',
      price: 100000,
      duration_minutes: 30,
      daily_quota: 5,
    };

    it('should create a service successfully', async () => {
      service.createSingle.mockResolvedValue(mockService);

      const result = await controller.create(createDto, 'en', mockUser);

      expect(service.createSingle).toHaveBeenCalledWith(
        createDto,
        mockUser.sub,
        'en',
      );
      expect(result).toEqual(mockService);
    });

    it('should handle default language parameter', async () => {
      service.createSingle.mockResolvedValue(mockService);

      await controller.create(createDto, undefined, mockUser);

      expect(service.createSingle).toHaveBeenCalledWith(
        createDto,
        mockUser.sub,
        'en',
      );
    });

    it('should propagate service layer errors', async () => {
      service.createSingle.mockRejectedValue(
        new ConflictException('Name exists'),
      );

      await expect(
        controller.create(createDto, 'en', mockUser),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('createBatch', () => {
    const batchDto: BatchCreateServicesDto = {
      business_id: 'business-123',
      services: [
        {
          name: 'Service 1',
          price: 100000,
          duration_minutes: 30,
        },
        {
          name: 'Service 2',
          price: 150000,
          daily_quota: 5,
        },
      ],
    };

    it('should create batch services successfully', async () => {
      const mockBatchResult = [
        mockService,
        { ...mockService, id: 'service-124', name: 'Service 2' },
      ];
      service.createBatch.mockResolvedValue(mockBatchResult);

      const result = await controller.createBatch(batchDto, 'en', mockUser);

      expect(service.createBatch).toHaveBeenCalledWith(
        batchDto,
        mockUser.sub,
        'en',
      );
      expect(result).toEqual(mockBatchResult);
    });

    it('should handle Indonesian language', async () => {
      service.createBatch.mockResolvedValue([mockService]);

      await controller.createBatch(batchDto, 'id', mockUser);

      expect(service.createBatch).toHaveBeenCalledWith(
        batchDto,
        mockUser.sub,
        'id',
      );
    });
  });

  describe('findById', () => {
    it('should return service by ID', async () => {
      service.findById.mockResolvedValue(mockService);

      const result = await controller.findById('service-123', 'en');

      expect(service.findById).toHaveBeenCalledWith('service-123', 'en');
      expect(result).toEqual(mockService);
    });

    it('should throw NotFoundException when service not found', async () => {
      service.findById.mockRejectedValue(
        new NotFoundException('Service not found'),
      );

      await expect(controller.findById('nonexistent-id', 'en')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle default language', async () => {
      service.findById.mockResolvedValue(mockService);

      await controller.findById('service-123', undefined);

      expect(service.findById).toHaveBeenCalledWith('service-123', 'en');
    });
  });

  describe('findByBusinessId', () => {
    it('should return services for business', async () => {
      const mockServices = [mockService, { ...mockService, id: 'service-124' }];
      service.findByBusinessId.mockResolvedValue(mockServices);

      const result = await controller.findByBusinessId(
        'business-123',
        'en',
        mockUser,
      );

      expect(service.findByBusinessId).toHaveBeenCalledWith(
        'business-123',
        mockUser.sub,
        'en',
      );
      expect(result).toEqual(mockServices);
    });

    it('should handle empty results', async () => {
      service.findByBusinessId.mockResolvedValue([]);

      const result = await controller.findByBusinessId(
        'business-123',
        'en',
        mockUser,
      );

      expect(result).toEqual([]);
    });
  });

  describe('HTTP decorators and metadata', () => {
    it('should be decorated with proper route prefixes', () => {
      const metadata = Reflect.getMetadata('path', ServiceController);
      expect(metadata).toBe('v1');
    });

    it('should have JwtAuthGuard applied', () => {
      const guards = Reflect.getMetadata('__guards__', ServiceController);
      expect(guards).toBeDefined();
    });

    it('should have proper API tags', () => {
      const tags = Reflect.getMetadata('swagger/apiUseTags', ServiceController);
      expect(tags).toContain('Services');
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle malformed user object', async () => {
      const createDto: CreateServiceDto = {
        business_id: 'business-123',
        name: 'Test Service',
        price: 100000,
      };

      service.createSingle.mockResolvedValue(mockService);

      // Test with undefined user.sub
      const malformedUser = { sub: undefined } as any;

      await controller.create(createDto, 'en', malformedUser);

      expect(service.createSingle).toHaveBeenCalledWith(
        createDto,
        undefined,
        'en',
      );
    });

    it('should handle special characters in service names', async () => {
      const createDto: CreateServiceDto = {
        business_id: 'business-123',
        name: 'Service with émoji 🚗 and spëcial chars',
        price: 100000,
      };

      service.createSingle.mockResolvedValue({
        ...mockService,
        name: createDto.name,
      });

      const result = await controller.create(createDto, 'en', mockUser);

      expect(result.name).toBe('Service with émoji 🚗 and spëcial chars');
    });

    it('should handle very large batch requests', async () => {
      const largeBatchDto: BatchCreateServicesDto = {
        business_id: 'business-123',
        services: Array(20)
          .fill({
            name: 'Bulk Service',
            price: 100000,
          })
          .map((item, index) => ({
            ...item,
            name: `${item.name} ${index + 1}`,
          })),
      };

      const mockResults = largeBatchDto.services.map((_, index) => ({
        ...mockService,
        id: `service-${index + 1}`,
        name: `Bulk Service ${index + 1}`,
      }));

      service.createBatch.mockResolvedValue(mockResults);

      const result = await controller.createBatch(
        largeBatchDto,
        'en',
        mockUser,
      );

      expect(result).toHaveLength(20);
      expect(service.createBatch).toHaveBeenCalledWith(
        largeBatchDto,
        mockUser.sub,
        'en',
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateServiceDto = {
      business_id: 'business-123',
      name: 'Updated Service',
      price: 200000,
    };

    const updatedService = {
      ...mockService,
      name: 'Updated Service',
      price: 200000,
      updated_at: new Date(),
    };

    it('should update a service successfully', async () => {
      service.update.mockResolvedValue(updatedService);

      const result = await controller.update(
        'service-123',
        updateDto,
        'en',
        mockUser,
      );

      expect(service.update).toHaveBeenCalledWith(
        'service-123',
        updateDto,
        mockUser.sub,
        'en',
      );
      expect(result).toEqual(updatedService);
    });

    it('should handle default language parameter', async () => {
      service.update.mockResolvedValue(updatedService);

      await controller.update('service-123', updateDto, undefined, mockUser);

      expect(service.update).toHaveBeenCalledWith(
        'service-123',
        updateDto,
        mockUser.sub,
        'en',
      );
    });

    it('should propagate NotFoundExceptions', async () => {
      service.update.mockRejectedValue(
        new NotFoundException('Service not found'),
      );

      await expect(
        controller.update('service-123', updateDto, 'en', mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ConflictExceptions', async () => {
      service.update.mockRejectedValue(
        new ConflictException('Name already exists'),
      );

      await expect(
        controller.update('service-123', updateDto, 'en', mockUser),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    const deleteDto: DeleteServiceDto = {
      business_id: 'business-123',
    };

    it('should delete a service successfully', async () => {
      service.delete.mockResolvedValue(undefined);

      await controller.delete('service-123', deleteDto, 'en', mockUser);

      expect(service.delete).toHaveBeenCalledWith(
        'service-123',
        deleteDto,
        mockUser.sub,
        'en',
      );
    });

    it('should handle default language parameter', async () => {
      service.delete.mockResolvedValue(undefined);

      await controller.delete('service-123', deleteDto, undefined, mockUser);

      expect(service.delete).toHaveBeenCalledWith(
        'service-123',
        deleteDto,
        mockUser.sub,
        'en',
      );
    });

    it('should propagate NotFoundExceptions', async () => {
      service.delete.mockRejectedValue(
        new NotFoundException('Service not found'),
      );

      await expect(
        controller.delete('service-123', deleteDto, 'en', mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
