import { Test, TestingModule } from '@nestjs/testing';
import { ProductTypeService } from '../product-type.service';
import { ProductTypeRepository } from '../repository/product-type.repository';
import { DatabaseService } from '../../../database/database.service';
import { I18nService } from 'nestjs-i18n';
import { ProductTypeModel } from '../models/product-type.model';
import {
  CreateProductTypeDto,
  UpdateProductTypeDto,
  DeleteProductTypeDto,
} from '../dto';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

describe('ProductTypeService', () => {
  let service: ProductTypeService;
  let repository: jest.Mocked<ProductTypeRepository>;
  let _databaseService: jest.Mocked<DatabaseService>;
  let i18nService: jest.Mocked<I18nService>;
  let mockKnex: any;
  let mockTrx: any;

  const mockUser = {
    id: 'user-internal-id',
    sub: 'user-public-id-123',
  };

  const mockBusiness = {
    id: 'business-123',
    owner_id: 'user-internal-id',
    status: 'active',
    deleted_at: null,
  };

  const validCreateDto: CreateProductTypeDto = {
    name: 'Tools',
    business_id: 'business-123',
  };

  beforeEach(async () => {
    const mockQueryBuilder = {
      where: jest.fn().mockReturnThis(),
      whereNull: jest.fn().mockReturnThis(),
      first: jest.fn(),
      insert: jest.fn().mockResolvedValue(undefined),
    };

    mockTrx = jest.fn().mockReturnValue(mockQueryBuilder);
    Object.assign(mockTrx, mockQueryBuilder);

    mockKnex = jest.fn().mockReturnValue(mockQueryBuilder);
    mockKnex.transaction = jest
      .fn()
      .mockImplementation((callback) => callback(mockTrx));
    Object.assign(mockKnex, mockQueryBuilder);

    const mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      nameExists: jest.fn(),
      hasActiveCategories: jest.fn(),
      updateProductType: jest.fn(),
      deleteProductType: jest.fn(),
      findUserIdByPublicId: jest.fn(),
    };

    const mockDatabaseService = {
      getKnex: jest.fn().mockReturnValue(mockKnex),
    };

    const mockI18nService = {
      t: jest.fn().mockImplementation((key: string) => key),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductTypeService,
        {
          provide: ProductTypeRepository,
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

    service = module.get<ProductTypeService>(ProductTypeService);
    repository = module.get(ProductTypeRepository);
    _databaseService = module.get(DatabaseService);
    i18nService = module.get(I18nService);
  });

  // ============================================================================
  // CREATE
  // ============================================================================

  describe('create', () => {
    beforeEach(() => {
      mockTrx.first.mockResolvedValue(mockBusiness);
      repository.findUserIdByPublicId.mockResolvedValue('user-internal-id');
      repository.nameExists.mockResolvedValue(false);
      repository.save.mockResolvedValue(undefined);
    });

    it('should create a product type successfully', async () => {
      const result = await service.create(validCreateDto, mockUser.sub);

      expect(result).toBeDefined();
      expect(result.name).toBe('Tools');
      expect(result.id_creator).toBe(mockUser.sub);
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when business not found', async () => {
      mockTrx.first.mockResolvedValue(null);

      await expect(
        service.create(validCreateDto, mockUser.sub),
      ).rejects.toThrow(NotFoundException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'productTypes.errors.business.notFound',
        expect.any(Object),
      );
    });

    it('should throw ForbiddenException when business is inactive', async () => {
      mockTrx.first.mockResolvedValue({ ...mockBusiness, status: 'inactive' });

      await expect(
        service.create(validCreateDto, mockUser.sub),
      ).rejects.toThrow(ForbiddenException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'productTypes.errors.business.inactive',
        expect.any(Object),
      );
    });

    it('should throw ForbiddenException when user does not own the business', async () => {
      mockTrx.first.mockResolvedValue({
        ...mockBusiness,
        owner_id: 'different-user-id',
      });

      await expect(
        service.create(validCreateDto, mockUser.sub),
      ).rejects.toThrow(ForbiddenException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'productTypes.errors.business.accessDenied',
        expect.any(Object),
      );
    });

    it('should throw ConflictException when product type name already exists', async () => {
      repository.nameExists.mockResolvedValue(true);

      await expect(
        service.create(validCreateDto, mockUser.sub),
      ).rejects.toThrow(ConflictException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'productTypes.errors.nameAlreadyExists',
        expect.any(Object),
      );
    });
  });

  // ============================================================================
  // FIND ALL
  // ============================================================================

  describe('findAll', () => {
    it('should return paginated product types', async () => {
      const mockModels = [
        ProductTypeModel.create({
          id: 'type-1',
          name: 'Tools',
          id_creator: 'user-1',
          created_at: new Date(),
        }),
        ProductTypeModel.create({
          id: 'type-2',
          name: 'Spare Parts',
          id_creator: 'user-1',
          created_at: new Date(),
        }),
      ];

      repository.findAll.mockResolvedValue({
        data: mockModels,
        total: 2,
      });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.current_page).toBe(1);
      expect(result.meta.per_page).toBe(10);
      expect(result.meta.total).toBe(2);
      expect(result.meta.last_page).toBe(1);
    });

    it('should calculate last_page correctly', async () => {
      repository.findAll.mockResolvedValue({
        data: [],
        total: 25,
      });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.meta.last_page).toBe(3);
    });
  });

  // ============================================================================
  // FIND BY ID
  // ============================================================================

  describe('findById', () => {
    it('should return product type when found', async () => {
      const mockModel = ProductTypeModel.create({
        id: 'type-123',
        name: 'Tools',
        id_creator: 'user-1',
        created_at: new Date(),
      });

      repository.findById.mockResolvedValue(mockModel);

      const result = await service.findById('type-123');

      expect(result).toBeDefined();
      expect(result.id).toBe('type-123');
      expect(result.name).toBe('Tools');
    });

    it('should throw NotFoundException when product type not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );

      expect(i18nService.t).toHaveBeenCalledWith(
        'productTypes.errors.notFound',
        expect.any(Object),
      );
    });
  });

  // ============================================================================
  // UPDATE
  // ============================================================================

  describe('update', () => {
    const mockProductType = ProductTypeModel.create({
      id: 'type-123',
      name: 'Tools',
      id_creator: 'user-1',
      created_at: new Date(),
    });

    const validUpdateDto: UpdateProductTypeDto = {
      name: 'Updated Tools',
      business_id: 'business-123',
    };

    beforeEach(() => {
      mockTrx.first.mockResolvedValue(mockBusiness);
      repository.findUserIdByPublicId.mockResolvedValue('user-internal-id');
      repository.findById.mockResolvedValue(mockProductType);
      repository.nameExists.mockResolvedValue(false);
      repository.updateProductType.mockResolvedValue(undefined);
    });

    it('should update a product type successfully', async () => {
      const result = await service.update(
        'type-123',
        validUpdateDto,
        mockUser.sub,
      );

      expect(result.name).toBe('Updated Tools');
      expect(repository.updateProductType).toHaveBeenCalled();
    });

    it('should throw NotFoundException if product type not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('type-123', validUpdateDto, mockUser.sub),
      ).rejects.toThrow(NotFoundException);
    });

    it('should check name uniqueness when name is being updated', async () => {
      await service.update('type-123', validUpdateDto, mockUser.sub);

      expect(repository.nameExists).toHaveBeenCalledWith(
        'Updated Tools',
        'type-123',
      );
    });

    it('should throw ConflictException if new name already exists', async () => {
      repository.nameExists.mockResolvedValue(true);

      await expect(
        service.update('type-123', validUpdateDto, mockUser.sub),
      ).rejects.toThrow(ConflictException);
    });

    it('should not check name uniqueness if name is not updated', async () => {
      const dtoWithoutName: UpdateProductTypeDto = {
        business_id: 'business-123',
      };

      await service.update('type-123', dtoWithoutName, mockUser.sub);

      expect(repository.nameExists).not.toHaveBeenCalled();
    });

    it('should validate business access before update', async () => {
      mockTrx.first.mockResolvedValue(null);

      await expect(
        service.update('type-123', validUpdateDto, mockUser.sub),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================================================
  // DELETE
  // ============================================================================

  describe('delete', () => {
    const mockProductType = ProductTypeModel.create({
      id: 'type-123',
      name: 'Tools',
      id_creator: 'user-1',
      created_at: new Date(),
    });

    const validDeleteDto: DeleteProductTypeDto = {
      business_id: 'business-123',
    };

    beforeEach(() => {
      mockTrx.first.mockResolvedValue(mockBusiness);
      repository.findUserIdByPublicId.mockResolvedValue('user-internal-id');
      repository.findById.mockResolvedValue(mockProductType);
      repository.hasActiveCategories.mockResolvedValue(false);
      repository.deleteProductType.mockResolvedValue(undefined);
    });

    it('should delete a product type successfully', async () => {
      await service.delete('type-123', validDeleteDto, mockUser.sub);

      expect(repository.deleteProductType).toHaveBeenCalledWith('type-123');
    });

    it('should throw NotFoundException if product type not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.delete('type-123', validDeleteDto, mockUser.sub),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if product type has active categories', async () => {
      repository.hasActiveCategories.mockResolvedValue(true);

      await expect(
        service.delete('type-123', validDeleteDto, mockUser.sub),
      ).rejects.toThrow(BadRequestException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'productTypes.errors.hasCategories',
        expect.any(Object),
      );
    });

    it('should validate business access before deletion', async () => {
      mockTrx.first.mockResolvedValue(null);

      await expect(
        service.delete('type-123', validDeleteDto, mockUser.sub),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the business', async () => {
      mockTrx.first.mockResolvedValue({
        ...mockBusiness,
        owner_id: 'different-user-id',
      });

      await expect(
        service.delete('type-123', validDeleteDto, mockUser.sub),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('edge cases', () => {
    it('should handle database transaction errors', async () => {
      mockKnex.transaction.mockRejectedValue(new Error('Database error'));

      await expect(
        service.create(validCreateDto, mockUser.sub),
      ).rejects.toThrow('Database error');
    });

    it('should handle repository errors gracefully', async () => {
      mockTrx.first.mockResolvedValue(mockBusiness);
      repository.findUserIdByPublicId.mockResolvedValue('user-internal-id');
      repository.nameExists.mockRejectedValue(new Error('Repository error'));

      await expect(
        service.create(validCreateDto, mockUser.sub),
      ).rejects.toThrow('Repository error');
    });
  });
});
