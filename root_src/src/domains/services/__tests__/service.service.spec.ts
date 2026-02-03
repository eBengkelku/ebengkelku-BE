import { Test, TestingModule } from '@nestjs/testing';
import { ServiceService } from '../service.service';
import { ServiceRepository } from '../repository/service.repository';
import { DatabaseService } from '../../../database/database.service';
import { I18nService } from 'nestjs-i18n';
import { ServiceModel } from '../models/service.model';
import {
  CreateServiceDto,
  BatchCreateServicesDto,
} from '../dto/create-service.dto';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

describe('ServiceService', () => {
  let service: ServiceService;
  let repository: jest.Mocked<ServiceRepository>;
  let _databaseService: jest.Mocked<DatabaseService>;
  let i18nService: jest.Mocked<I18nService>;
  let mockKnex: any;
  let mockTrx: any;

  const mockUser = {
    id: 'user-123',
    sub: 'user-123',
  };

  const mockBusiness = {
    id: 'business-123',
    status: 'active',
    deleted_at: null,
  };

  const validCreateDto: CreateServiceDto = {
    business_id: 'business-123',
    name: 'Oil Change Service',
    description: 'Complete oil change service',
    price: 150000,
    duration_minutes: 30,
    daily_quota: 10,
  };

  beforeEach(async () => {
    // Mock transaction
    mockTrx = {
      insert: jest.fn().mockResolvedValue(undefined),
      where: jest.fn().mockReturnThis(),
      whereNull: jest.fn().mockReturnThis(),
      first: jest.fn(),
      '()': jest.fn(),
    };

    // Mock Knex
    mockKnex = {
      transaction: jest
        .fn()
        .mockImplementation((callback) => callback(mockTrx)),
      '()': jest.fn().mockReturnValue(mockTrx),
    };

    // Mock services
    const mockRepository = {
      findById: jest.fn(),
      findByBusinessId: jest.fn(),
      nameExistsForBusiness: jest.fn(),
      findExistingNames: jest.fn(),
      batchInsert: jest.fn(),
    };

    const mockDatabaseService = {
      getKnex: jest.fn().mockReturnValue(mockKnex),
    };

    const mockI18nService = {
      t: jest.fn().mockImplementation((key: string) => key),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceService,
        {
          provide: ServiceRepository,
          useValue: mockRepository,
        },
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
      ],
    }).compile();

    service = module.get<ServiceService>(ServiceService);
    repository = module.get(ServiceRepository);
    _databaseService = module.get(DatabaseService);
    i18nService = module.get(I18nService);
  });

  describe('createSingle', () => {
    beforeEach(() => {
      // Mock business validation
      mockTrx.first.mockResolvedValue(mockBusiness);
      repository.nameExistsForBusiness.mockResolvedValue(false);
      repository.batchInsert.mockResolvedValue(undefined);
    });

    it('should create a single service successfully', async () => {
      const result = await service.createSingle(validCreateDto, mockUser.id);

      expect(result).toBeDefined();
      expect(result.name).toBe(validCreateDto.name);
      expect(result.business_id).toBe(validCreateDto.business_id);
      expect(result.price).toBe(validCreateDto.price);
    });

    it('should throw NotFoundException when business not found', async () => {
      mockTrx.first.mockResolvedValue(null);

      await expect(
        service.createSingle(validCreateDto, mockUser.id),
      ).rejects.toThrow(NotFoundException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'services.errors.business.notFound',
        expect.any(Object),
      );
    });

    it('should throw ForbiddenException when business is inactive', async () => {
      mockTrx.first.mockResolvedValue({ ...mockBusiness, status: 'inactive' });

      await expect(
        service.createSingle(validCreateDto, mockUser.id),
      ).rejects.toThrow(ForbiddenException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'services.errors.business.inactive',
        expect.any(Object),
      );
    });

    it('should throw ConflictException when service name already exists', async () => {
      repository.nameExistsForBusiness.mockResolvedValue(true);

      await expect(
        service.createSingle(validCreateDto, mockUser.id),
      ).rejects.toThrow(ConflictException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'services.errors.nameAlreadyExists',
        expect.any(Object),
      );
    });

    it('should handle optional fields correctly', async () => {
      const dtoWithoutOptionals = {
        business_id: 'business-123',
        name: 'Basic Service',
        price: 100000,
      };

      const result = await service.createSingle(
        dtoWithoutOptionals as CreateServiceDto,
        mockUser.id,
      );

      expect(result.description).toBeNull();
      expect(result.duration_minutes).toBeNull();
      expect(result.daily_quota).toBeNull();
    });
  });

  describe('createBatch', () => {
    const validBatchDto: BatchCreateServicesDto = {
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

    beforeEach(() => {
      mockTrx.first.mockResolvedValue(mockBusiness);
      repository.findExistingNames.mockResolvedValue([]);
      repository.batchInsert.mockResolvedValue(undefined);
    });

    it('should create batch services successfully', async () => {
      const result = await service.createBatch(validBatchDto, mockUser.id);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Service 1');
      expect(result[1].name).toBe('Service 2');
      expect(repository.batchInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(ServiceModel),
          expect.any(ServiceModel),
        ]),
        mockTrx,
      );
    });

    it('should throw BadRequestException when batch size exceeds limit', async () => {
      const largeBatchDto = {
        business_id: 'business-123',
        services: Array(21).fill({ name: 'Service', price: 100000 }),
      };

      await expect(
        service.createBatch(largeBatchDto, mockUser.id),
      ).rejects.toThrow(BadRequestException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'services.errors.batch.tooLarge',
        expect.any(Object),
      );
    });

    it('should throw ConflictException when duplicate names in batch', async () => {
      const duplicateBatchDto = {
        business_id: 'business-123',
        services: [
          { name: 'Duplicate Service', price: 100000 },
          { name: 'Duplicate Service', price: 150000 }, // Same name
        ],
      };

      await expect(
        service.createBatch(duplicateBatchDto, mockUser.id),
      ).rejects.toThrow(ConflictException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'services.errors.batch.duplicateNames',
        expect.any(Object),
      );
    });

    it('should throw ConflictException when names exist in database', async () => {
      repository.findExistingNames.mockResolvedValue(['Service 1']);

      await expect(
        service.createBatch(validBatchDto, mockUser.id),
      ).rejects.toThrow(ConflictException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'services.errors.nameAlreadyExists',
        expect.any(Object),
      );
    });

    it('should handle case-insensitive duplicate detection', async () => {
      const caseInsensitiveBatchDto = {
        business_id: 'business-123',
        services: [
          { name: 'Service Name', price: 100000 },
          { name: 'SERVICE NAME', price: 150000 }, // Different case
        ],
      };

      await expect(
        service.createBatch(caseInsensitiveBatchDto, mockUser.id),
      ).rejects.toThrow(ConflictException);
    });

    it('should handle empty batch', async () => {
      const emptyBatchDto = {
        business_id: 'business-123',
        services: [],
      };

      const result = await service.createBatch(emptyBatchDto, mockUser.id);

      expect(result).toEqual([]);
      expect(repository.batchInsert).toHaveBeenCalledWith([], mockTrx);
    });
  });

  describe('findById', () => {
    it('should return service when found', async () => {
      const mockService = ServiceModel.create({
        id: 'service-123',
        business_id: 'business-123',
        name: 'Test Service',
        price: 100000,
        id_creator: 'user-123',
        created_at: new Date(),
      });

      repository.findById.mockResolvedValue(mockService);

      const result = await service.findById('service-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('service-123');
    });

    it('should throw NotFoundException when service not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );

      expect(i18nService.t).toHaveBeenCalledWith(
        'services.errors.notFound',
        expect.any(Object),
      );
    });
  });

  describe('findByBusinessId', () => {
    beforeEach(() => {
      mockKnex.mockReturnValue(mockTrx);
      mockTrx.first.mockResolvedValue(mockBusiness);
    });

    it('should return services for valid business', async () => {
      const mockServices = [
        ServiceModel.create({
          id: 'service-1',
          business_id: 'business-123',
          name: 'Service 1',
          price: 100000,
          id_creator: 'user-123',
          created_at: new Date(),
        }),
      ];

      repository.findByBusinessId.mockResolvedValue(mockServices);

      const result = await service.findByBusinessId(
        'business-123',
        mockUser.id,
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('service-1');
    });

    it('should validate business access before returning services', async () => {
      mockTrx.first.mockResolvedValue(null);

      await expect(
        service.findByBusinessId('business-123', mockUser.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle database transaction errors', async () => {
      mockKnex.transaction.mockRejectedValue(new Error('Database error'));

      await expect(
        service.createSingle(validCreateDto, mockUser.id),
      ).rejects.toThrow('Database error');
    });

    it('should handle i18n service errors gracefully', async () => {
      i18nService.t.mockImplementation(() => {
        throw new Error('I18n error');
      });

      mockTrx.first.mockResolvedValue(null);

      await expect(
        service.createSingle(validCreateDto, mockUser.id),
      ).rejects.toThrow('I18n error');
    });

    it('should handle repository errors', async () => {
      mockTrx.first.mockResolvedValue(mockBusiness);
      repository.nameExistsForBusiness.mockRejectedValue(
        new Error('Repository error'),
      );

      await expect(
        service.createSingle(validCreateDto, mockUser.id),
      ).rejects.toThrow('Repository error');
    });
  });
});
