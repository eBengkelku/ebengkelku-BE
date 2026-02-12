import { Test, TestingModule } from '@nestjs/testing';
import { ProductCategoryService } from '../product-category.service';
import { ProductCategoryRepository } from '../repository/product-category.repository';
import { DatabaseService } from '../../../database/database.service';
import { I18nService } from 'nestjs-i18n';
import { ProductCategoryModel } from '../models/product-category.model';
import {
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
  DeleteProductCategoryDto,
} from '../dto';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

describe('ProductCategoryService', () => {
  let service: ProductCategoryService;
  let repository: jest.Mocked<ProductCategoryRepository>;
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

  const validCreateDto: CreateProductCategoryDto = {
    name: 'Engine Oil',
    product_type_id: 'type-123',
    description: 'Various engine oils',
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
      findByIdWithType: jest.fn(),
      findAllWithType: jest.fn(),
      save: jest.fn(),
      nameExists: jest.fn(),
      productTypeExists: jest.fn(),
      hasActiveProducts: jest.fn(),
      updateProductCategory: jest.fn(),
      deleteProductCategory: jest.fn(),
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
        ProductCategoryService,
        {
          provide: ProductCategoryRepository,
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

    service = module.get<ProductCategoryService>(ProductCategoryService);
    repository = module.get(ProductCategoryRepository);
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
      repository.productTypeExists.mockResolvedValue(true);
      repository.nameExists.mockResolvedValue(false);
      repository.save.mockResolvedValue(undefined);
      repository.findByIdWithType.mockResolvedValue({
        id: 'cat-new',
        name: 'Engine Oil',
        description: 'Various engine oils',
        product_type_id: 'type-123',
        created_at: new Date(),
        updated_at: null,
        deleted_at: null,
        id_creator: mockUser.sub,
        id_updater: null,
        product_type: { id: 'type-123', name: 'Tools' },
      });
    });

    it('should create a product category successfully', async () => {
      const result = await service.create(validCreateDto, mockUser.sub);

      expect(result).toBeDefined();
      expect(result.name).toBe('Engine Oil');
      expect(result.product_type).toBeDefined();
      expect(repository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when business not found', async () => {
      mockTrx.first.mockResolvedValue(null);

      await expect(
        service.create(validCreateDto, mockUser.sub),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when business is inactive', async () => {
      mockTrx.first.mockResolvedValue({ ...mockBusiness, status: 'inactive' });

      await expect(
        service.create(validCreateDto, mockUser.sub),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user does not own the business', async () => {
      mockTrx.first.mockResolvedValue({
        ...mockBusiness,
        owner_id: 'different-user-id',
      });

      await expect(
        service.create(validCreateDto, mockUser.sub),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when product type not found', async () => {
      repository.productTypeExists.mockResolvedValue(false);

      await expect(
        service.create(validCreateDto, mockUser.sub),
      ).rejects.toThrow(NotFoundException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'productCategories.errors.typeNotFound',
        expect.any(Object),
      );
    });

    it('should throw ConflictException when name already exists', async () => {
      repository.nameExists.mockResolvedValue(true);

      await expect(
        service.create(validCreateDto, mockUser.sub),
      ).rejects.toThrow(ConflictException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'productCategories.errors.nameAlreadyExists',
        expect.any(Object),
      );
    });
  });

  // ============================================================================
  // FIND ALL
  // ============================================================================

  describe('findAll', () => {
    it('should return paginated product categories with type info', async () => {
      repository.findAllWithType.mockResolvedValue({
        data: [
          {
            id: 'cat-1',
            name: 'Engine Oil',
            description: null,
            product_type_id: 'type-1',
            created_at: new Date(),
            updated_at: null,
            deleted_at: null,
            id_creator: 'user-1',
            id_updater: null,
            product_type: { id: 'type-1', name: 'Tools' },
          },
        ],
        total: 1,
      });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].product_type).toBeDefined();
      expect(result.meta.current_page).toBe(1);
      expect(result.meta.total).toBe(1);
    });

    it('should pass product type filter to repository', async () => {
      repository.findAllWithType.mockResolvedValue({
        data: [],
        total: 0,
      });

      await service.findAll({ page: 1, limit: 10 }, 'type-123');

      expect(repository.findAllWithType).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        'type-123',
      );
    });
  });

  // ============================================================================
  // FIND BY ID
  // ============================================================================

  describe('findById', () => {
    it('should return product category with type info when found', async () => {
      repository.findByIdWithType.mockResolvedValue({
        id: 'cat-123',
        name: 'Engine Oil',
        description: null,
        product_type_id: 'type-1',
        created_at: new Date(),
        updated_at: null,
        deleted_at: null,
        id_creator: 'user-1',
        id_updater: null,
        product_type: { id: 'type-1', name: 'Tools' },
      });

      const result = await service.findById('cat-123');

      expect(result).toBeDefined();
      expect(result.product_type).toBeDefined();
    });

    it('should throw NotFoundException when not found', async () => {
      repository.findByIdWithType.mockResolvedValue(null);

      await expect(service.findById('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ============================================================================
  // UPDATE
  // ============================================================================

  describe('update', () => {
    const mockCategory = ProductCategoryModel.create({
      id: 'cat-123',
      name: 'Engine Oil',
      description: 'Various engine oils',
      product_type_id: 'type-123',
      id_creator: 'user-1',
      created_at: new Date(),
    });

    const validUpdateDto: UpdateProductCategoryDto = {
      name: 'Brake Fluid',
      business_id: 'business-123',
    };

    beforeEach(() => {
      mockTrx.first.mockResolvedValue(mockBusiness);
      repository.findUserIdByPublicId.mockResolvedValue('user-internal-id');
      repository.findById.mockResolvedValue(mockCategory);
      repository.nameExists.mockResolvedValue(false);
      repository.updateProductCategory.mockResolvedValue(undefined);
      repository.findByIdWithType.mockResolvedValue({
        id: 'cat-123',
        name: 'Brake Fluid',
        description: 'Various engine oils',
        product_type_id: 'type-123',
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
        id_creator: 'user-1',
        id_updater: mockUser.sub,
        product_type: { id: 'type-123', name: 'Tools' },
      });
    });

    it('should update a product category successfully', async () => {
      const result = await service.update(
        'cat-123',
        validUpdateDto,
        mockUser.sub,
      );

      expect(result.name).toBe('Brake Fluid');
      expect(repository.updateProductCategory).toHaveBeenCalled();
    });

    it('should throw NotFoundException if category not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update('cat-123', validUpdateDto, mockUser.sub),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate product type when changed', async () => {
      const dtoWithNewType: UpdateProductCategoryDto = {
        product_type_id: 'new-type-id',
        business_id: 'business-123',
      };

      repository.productTypeExists = jest.fn().mockResolvedValue(false);

      await expect(
        service.update('cat-123', dtoWithNewType, mockUser.sub),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if new name already exists', async () => {
      repository.nameExists.mockResolvedValue(true);

      await expect(
        service.update('cat-123', validUpdateDto, mockUser.sub),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ============================================================================
  // DELETE
  // ============================================================================

  describe('delete', () => {
    const mockCategory = ProductCategoryModel.create({
      id: 'cat-123',
      name: 'Engine Oil',
      product_type_id: 'type-123',
      id_creator: 'user-1',
      created_at: new Date(),
    });

    const validDeleteDto: DeleteProductCategoryDto = {
      business_id: 'business-123',
    };

    beforeEach(() => {
      mockTrx.first.mockResolvedValue(mockBusiness);
      repository.findUserIdByPublicId.mockResolvedValue('user-internal-id');
      repository.findById.mockResolvedValue(mockCategory);
      repository.hasActiveProducts.mockResolvedValue(false);
      repository.deleteProductCategory.mockResolvedValue(undefined);
    });

    it('should delete a product category successfully', async () => {
      await service.delete('cat-123', validDeleteDto, mockUser.sub);

      expect(repository.deleteProductCategory).toHaveBeenCalledWith('cat-123');
    });

    it('should throw NotFoundException if category not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.delete('cat-123', validDeleteDto, mockUser.sub),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if category has active products', async () => {
      repository.hasActiveProducts.mockResolvedValue(true);

      await expect(
        service.delete('cat-123', validDeleteDto, mockUser.sub),
      ).rejects.toThrow(BadRequestException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'productCategories.errors.hasProducts',
        expect.any(Object),
      );
    });

    it('should validate business access before deletion', async () => {
      mockTrx.first.mockResolvedValue(null);

      await expect(
        service.delete('cat-123', validDeleteDto, mockUser.sub),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user does not own the business', async () => {
      mockTrx.first.mockResolvedValue({
        ...mockBusiness,
        owner_id: 'different-user-id',
      });

      await expect(
        service.delete('cat-123', validDeleteDto, mockUser.sub),
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
  });
});
