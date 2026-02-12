import { Test, TestingModule } from '@nestjs/testing';
import { BusinessProductService } from '../business-product.service';
import { BusinessProductRepository } from '../repository/business-product.repository';
import { DatabaseService } from '../../../database/database.service';
import { I18nService } from 'nestjs-i18n';
import { CreateBusinessProductDto, UpdateBusinessProductDto } from '../dto';
import { BusinessProductModel } from '../models/business-product.model';
import {
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

describe('BusinessProductService', () => {
  let service: BusinessProductService;
  let repository: jest.Mocked<BusinessProductRepository>;
  let i18nService: jest.Mocked<I18nService>;

  const mockUser = { sub: 'user-public-id-123' };

  const mockBusiness = {
    id: 'business-123',
    name: 'Bengkel Jaya',
    owner_id: 'user-internal-id',
    status: 'active',
    deleted_at: null,
  };

  const validCreateDto: CreateBusinessProductDto = {
    name: 'Oli Mesin Toyota 10W-40',
    price: 85000,
    category_id: 'cat-123',
    description: 'Oli mesin berkualitas tinggi',
    unit: 'liter',
  };

  const mockProductWithCategory = {
    id: 'prod-123',
    name: 'Oli Mesin Toyota 10W-40',
    description: 'Oli mesin berkualitas tinggi',
    price: 85000,
    unit: 'liter',
    status: 'active',
    business_id: 'business-123',
    category_id: 'cat-123',
    created_at: new Date(),
    updated_at: null,
    deleted_at: null,
    id_creator: 'user-public-id-123',
    id_updater: null,
    category: { id: 'cat-123', name: 'Oli & Pelumas' },
  };

  // Mock transaction that behaves like knex
  let mockTrx: any;

  beforeEach(async () => {
    mockTrx = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      whereNull: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(mockBusiness),
    });
    // For direct table access (trx('table_name'))
    mockTrx.where = jest.fn().mockReturnThis();
    mockTrx.whereNull = jest.fn().mockReturnThis();
    mockTrx.select = jest.fn().mockReturnThis();
    mockTrx.first = jest.fn().mockResolvedValue(mockBusiness);

    const mockKnex: any = {
      transaction: jest.fn().mockImplementation(async (callback: any) => {
        return callback(mockTrx);
      }),
    };
    // Also support mockKnex('table') — which is essentially the same mockTrx
    const knexCallable: any = Object.assign(
      jest.fn().mockReturnValue({
        where: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockBusiness),
      }),
      mockKnex,
    );

    const mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByIdWithCategory: jest.fn(),
      findAllByBusiness: jest.fn(),
      findUserIdByPublicId: jest.fn(),
      categoryExistsAndActive: jest.fn(),
      insertProduct: jest.fn(),
      updateProduct: jest.fn(),
      softDeleteProduct: jest.fn(),
    };

    const mockDatabaseService = {
      getKnex: jest.fn().mockReturnValue(knexCallable),
    };

    const mockI18nService = {
      t: jest.fn().mockImplementation((key: string) => key),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessProductService,
        {
          provide: BusinessProductRepository,
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

    service = module.get<BusinessProductService>(BusinessProductService);
    repository = module.get(BusinessProductRepository);
    i18nService = module.get(I18nService);

    // Default mock behaviors
    repository.findUserIdByPublicId.mockResolvedValue('user-internal-id');
    repository.categoryExistsAndActive.mockResolvedValue(true);
    repository.findByIdWithCategory.mockResolvedValue(mockProductWithCategory);
    repository.insertProduct.mockResolvedValue(undefined);
  });

  // ============================================================================
  // CREATE
  // ============================================================================

  describe('create', () => {
    it('should create a product successfully', async () => {
      const result = await service.create(
        'business-123',
        validCreateDto,
        mockUser.sub,
      );

      expect(repository.insertProduct).toHaveBeenCalled();
      expect(repository.findByIdWithCategory).toHaveBeenCalled();
      expect(result).toEqual(mockProductWithCategory);
    });

    it('should use default unit pcs when not provided', async () => {
      const dtoWithoutUnit = { ...validCreateDto };
      delete (dtoWithoutUnit as any).unit;

      await service.create('business-123', dtoWithoutUnit, mockUser.sub);

      const insertCall = repository.insertProduct.mock.calls[0][0];
      expect(insertCall.unit).toBe('pcs');
    });

    it('should throw NotFoundException when business not found', async () => {
      mockTrx.first.mockResolvedValue(null);

      await expect(
        service.create('business-123', validCreateDto, mockUser.sub),
      ).rejects.toThrow(NotFoundException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'businessProducts.errors.business.notFound',
        expect.any(Object),
      );
    });

    it('should throw ForbiddenException when business is inactive', async () => {
      mockTrx.first.mockResolvedValue({
        ...mockBusiness,
        status: 'inactive',
      });

      await expect(
        service.create('business-123', validCreateDto, mockUser.sub),
      ).rejects.toThrow(ForbiddenException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'businessProducts.errors.business.inactive',
        expect.any(Object),
      );
    });

    it('should throw ForbiddenException when user is not business owner', async () => {
      repository.findUserIdByPublicId.mockResolvedValue('different-user-id');

      await expect(
        service.create('business-123', validCreateDto, mockUser.sub),
      ).rejects.toThrow(ForbiddenException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'businessProducts.errors.business.accessDenied',
        expect.any(Object),
      );
    });

    it('should throw UnauthorizedException when user public_id not found', async () => {
      repository.findUserIdByPublicId.mockResolvedValue(null);

      await expect(
        service.create('business-123', validCreateDto, mockUser.sub),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw NotFoundException when category not found', async () => {
      repository.categoryExistsAndActive.mockResolvedValue(false);

      await expect(
        service.create('business-123', validCreateDto, mockUser.sub),
      ).rejects.toThrow(NotFoundException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'businessProducts.errors.categoryNotFound',
        expect.any(Object),
      );
    });
  });

  // ============================================================================
  // FIND ALL
  // ============================================================================

  describe('findAll', () => {
    it('should return paginated products with meta', async () => {
      repository.findAllByBusiness.mockResolvedValue({
        data: [mockProductWithCategory],
        total: 1,
      });

      const result = await service.findAll(
        'business-123',
        { page: 1, limit: 10 },
        {},
        mockUser.sub,
      );

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        current_page: 1,
        per_page: 10,
        total: 1,
        last_page: 1,
      });
    });

    it('should pass filters to repository', async () => {
      repository.findAllByBusiness.mockResolvedValue({
        data: [],
        total: 0,
      });

      await service.findAll(
        'business-123',
        { page: 1, limit: 10 },
        { status: 'active', category_id: 'cat-123' },
        mockUser.sub,
      );

      expect(repository.findAllByBusiness).toHaveBeenCalledWith(
        'business-123',
        { page: 1, limit: 10 },
        { status: 'active', category_id: 'cat-123' },
      );
    });

    it('should calculate last_page correctly', async () => {
      repository.findAllByBusiness.mockResolvedValue({
        data: [],
        total: 25,
      });

      const result = await service.findAll(
        'business-123',
        { page: 1, limit: 10 },
        {},
        mockUser.sub,
      );

      expect(result.meta.last_page).toBe(3);
    });
  });

  // ============================================================================
  // FIND BY ID
  // ============================================================================

  describe('findById', () => {
    it('should return product with category info', async () => {
      const result = await service.findById(
        'business-123',
        'prod-123',
        mockUser.sub,
      );

      expect(result).toEqual(mockProductWithCategory);
      expect(repository.findByIdWithCategory).toHaveBeenCalledWith(
        'prod-123',
        'business-123',
      );
    });

    it('should throw NotFoundException when product not found', async () => {
      repository.findByIdWithCategory.mockResolvedValue(null);

      await expect(
        service.findById('business-123', 'nonexistent', mockUser.sub),
      ).rejects.toThrow(NotFoundException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'businessProducts.errors.notFound',
        expect.any(Object),
      );
    });
  });

  // ============================================================================
  // UPDATE
  // ============================================================================

  describe('update', () => {
    const validUpdateDto: UpdateBusinessProductDto = {
      name: 'Oli Mesin Honda 10W-30',
      price: 95000,
    };

    const mockProduct = BusinessProductModel.create({
      id: 'prod-123',
      name: 'Oli Mesin Toyota 10W-40',
      description: 'Oli mesin berkualitas tinggi',
      price: 85000,
      unit: 'liter',
      status: 'active',
      business_id: 'business-123',
      category_id: 'cat-123',
      id_creator: 'user-001',
      created_at: new Date(),
    });

    beforeEach(() => {
      repository.findById.mockResolvedValue(mockProduct);
      repository.updateProduct.mockResolvedValue(undefined);
      repository.findByIdWithCategory.mockResolvedValue({
        ...mockProductWithCategory,
        name: 'Oli Mesin Honda 10W-30',
        price: 95000,
      });
    });

    it('should update a product successfully', async () => {
      const result = await service.update(
        'business-123',
        'prod-123',
        validUpdateDto,
        mockUser.sub,
      );

      expect(result.name).toBe('Oli Mesin Honda 10W-30');
      expect(result.price).toBe(95000);
      expect(repository.updateProduct).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update(
          'business-123',
          'nonexistent',
          validUpdateDto,
          mockUser.sub,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when product does not belong to business', async () => {
      const otherBusinessProduct = BusinessProductModel.create({
        id: 'prod-456',
        name: 'Other Product',
        price: 50000,
        unit: 'pcs',
        status: 'active',
        business_id: 'other-business',
        category_id: 'cat-123',
        id_creator: 'user-001',
        created_at: new Date(),
      });
      repository.findById.mockResolvedValue(otherBusinessProduct);

      await expect(
        service.update(
          'business-123',
          'prod-456',
          validUpdateDto,
          mockUser.sub,
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(i18nService.t).toHaveBeenCalledWith(
        'businessProducts.errors.notBelongToBusiness',
        expect.any(Object),
      );
    });

    it('should validate new category when changed', async () => {
      repository.categoryExistsAndActive.mockResolvedValue(false);

      await expect(
        service.update(
          'business-123',
          'prod-123',
          { category_id: 'new-cat' },
          mockUser.sub,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(repository.categoryExistsAndActive).toHaveBeenCalledWith(
        'new-cat',
      );
    });

    it('should not validate category when not changed', async () => {
      await service.update(
        'business-123',
        'prod-123',
        { name: 'Updated Name' },
        mockUser.sub,
      );

      expect(repository.categoryExistsAndActive).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // DELETE
  // ============================================================================

  describe('delete', () => {
    const mockProduct = BusinessProductModel.create({
      id: 'prod-123',
      name: 'Oli Mesin',
      price: 85000,
      unit: 'pcs',
      status: 'active',
      business_id: 'business-123',
      category_id: 'cat-123',
      id_creator: 'user-001',
      created_at: new Date(),
    });

    beforeEach(() => {
      repository.findById.mockResolvedValue(mockProduct);
      repository.softDeleteProduct.mockResolvedValue(undefined);
    });

    it('should soft delete a product', async () => {
      await service.delete('business-123', 'prod-123', mockUser.sub);

      expect(repository.softDeleteProduct).toHaveBeenCalledWith('prod-123');
    });

    it('should throw NotFoundException when product not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.delete('business-123', 'nonexistent', mockUser.sub),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when product does not belong to business', async () => {
      const otherProduct = BusinessProductModel.create({
        id: 'prod-456',
        name: 'Other',
        price: 50000,
        unit: 'pcs',
        status: 'active',
        business_id: 'other-business',
        category_id: 'cat-123',
        id_creator: 'user-001',
        created_at: new Date(),
      });
      repository.findById.mockResolvedValue(otherProduct);

      await expect(
        service.delete('business-123', 'prod-456', mockUser.sub),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
