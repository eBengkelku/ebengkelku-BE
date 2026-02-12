import { Test, TestingModule } from '@nestjs/testing';
import { ToolProductService } from '../tool-product.service';
import { ToolProductRepository } from '../repository/tool-product.repository';
import { DatabaseService } from '../../../database/database.service';
import { I18nService } from 'nestjs-i18n';
import {
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';

describe('ToolProductService', () => {
  let service: ToolProductService;
  let repository: jest.Mocked<ToolProductRepository>;
  let databaseService: jest.Mocked<DatabaseService>;
  let i18n: jest.Mocked<I18nService>;

  const mockBusinessId = 'business-uuid-1';
  const mockProductId = 'product-uuid-1';
  const mockUserPublicId = 'user-public-id-1';
  const mockUserId = 'user-internal-id-1';

  const mockBusiness = {
    id: mockBusinessId,
    owner_id: mockUserId,
    status: 'active',
  };

  const mockProduct = {
    id: mockProductId,
    business_id: mockBusinessId,
    name: 'Test Product',
  };

  const mockToolProductWithBase = {
    product_id: mockProductId,
    warranty_months: 12,
    updated_at: null,
    deleted_at: null,
    id_creator: mockUserPublicId,
    id_updater: null,
    product: {
      id: mockProductId,
      name: 'Test Product',
      description: 'A test product',
      price: 100000,
      unit: 'pcs',
      status: 'active',
      business_id: mockBusinessId,
      category_id: 'cat-uuid-1',
    },
  };

  // Knex transaction mock
  const mockTrx = Object.assign(
    jest.fn().mockImplementation((tableName: string) => {
      const queryBuilder: any = {
        where: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
        insert: jest.fn().mockResolvedValue(undefined),
      };
      if (tableName === 'business.businesses') {
        queryBuilder.first.mockResolvedValue(mockBusiness);
      }
      return queryBuilder;
    }),
    {
      transaction: jest.fn().mockImplementation(async (cb: any) => cb(mockTrx)),
    },
  );

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolProductService,
        {
          provide: ToolProductRepository,
          useValue: {
            findById: jest.fn(),
            toolProductExists: jest.fn(),
            findProductByIdAndBusiness: jest.fn(),
            findUserIdByPublicId: jest.fn(),
            insertToolProduct: jest.fn(),
            updateToolProduct: jest.fn(),
            softDeleteToolProduct: jest.fn(),
            findByProductIdWithBaseProduct: jest.fn(),
            findAllByBusiness: jest.fn(),
          },
        },
        {
          provide: DatabaseService,
          useValue: {
            getKnex: jest.fn().mockReturnValue(mockTrx),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key: string) => key),
          },
        },
      ],
    }).compile();

    service = module.get<ToolProductService>(ToolProductService);
    repository = module.get(ToolProductRepository);
    databaseService = module.get(DatabaseService);
    i18n = module.get(I18nService);
  });

  afterEach(() => jest.clearAllMocks());

  // =========================================================================
  // CREATE
  // =========================================================================

  describe('create', () => {
    beforeEach(() => {
      repository.findUserIdByPublicId.mockResolvedValue(mockUserId);
      repository.findProductByIdAndBusiness.mockResolvedValue(mockProduct);
      repository.toolProductExists.mockResolvedValue(false);
      repository.insertToolProduct.mockResolvedValue(undefined);
      repository.findByProductIdWithBaseProduct.mockResolvedValue(
        mockToolProductWithBase,
      );
    });

    it('should create a tool product successfully', async () => {
      const result = await service.create(
        mockBusinessId,
        mockProductId,
        { warranty_months: 12 },
        mockUserPublicId,
        'en',
      );
      expect(result).toEqual(mockToolProductWithBase);
      expect(repository.insertToolProduct).toHaveBeenCalled();
    });

    it('should use default warranty_months = 0 when not provided', async () => {
      await service.create(
        mockBusinessId,
        mockProductId,
        {},
        mockUserPublicId,
        'en',
      );
      expect(repository.insertToolProduct).toHaveBeenCalledWith(
        expect.objectContaining({ warranty_months: 0 }),
        expect.anything(),
      );
    });

    it('should throw NotFoundException when business not found', async () => {
      mockTrx.mockImplementationOnce((tableName: string) => {
        const qb: any = {
          where: jest.fn().mockReturnThis(),
          whereNull: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(null),
        };
        return qb;
      });

      await expect(
        service.create(
          mockBusinessId,
          mockProductId,
          { warranty_months: 12 },
          mockUserPublicId,
          'en',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when business is inactive', async () => {
      mockTrx.mockImplementationOnce((tableName: string) => {
        const qb: any = {
          where: jest.fn().mockReturnThis(),
          whereNull: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          first: jest
            .fn()
            .mockResolvedValue({ ...mockBusiness, status: 'inactive' }),
        };
        return qb;
      });

      await expect(
        service.create(
          mockBusinessId,
          mockProductId,
          { warranty_months: 12 },
          mockUserPublicId,
          'en',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      repository.findUserIdByPublicId.mockResolvedValue(null);

      await expect(
        service.create(
          mockBusinessId,
          mockProductId,
          { warranty_months: 12 },
          mockUserPublicId,
          'en',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException when user is not business owner', async () => {
      repository.findUserIdByPublicId.mockResolvedValue('different-user-id');

      await expect(
        service.create(
          mockBusinessId,
          mockProductId,
          { warranty_months: 12 },
          mockUserPublicId,
          'en',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when product not found or not belongs to business', async () => {
      repository.findProductByIdAndBusiness.mockResolvedValue(null);

      await expect(
        service.create(
          mockBusinessId,
          mockProductId,
          { warranty_months: 12 },
          mockUserPublicId,
          'en',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when tool product already exists', async () => {
      repository.toolProductExists.mockResolvedValue(true);

      await expect(
        service.create(
          mockBusinessId,
          mockProductId,
          { warranty_months: 12 },
          mockUserPublicId,
          'en',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  // =========================================================================
  // FIND ALL
  // =========================================================================

  describe('findAll', () => {
    beforeEach(() => {
      repository.findUserIdByPublicId.mockResolvedValue(mockUserId);
    });

    it('should return paginated tool products with meta', async () => {
      repository.findAllByBusiness.mockResolvedValue({
        data: [mockToolProductWithBase],
        total: 1,
      });

      const result = await service.findAll(
        mockBusinessId,
        { page: 1, limit: 10 },
        mockUserPublicId,
        'en',
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockToolProductWithBase);
      expect(result.meta).toEqual({
        current_page: 1,
        per_page: 10,
        total: 1,
        last_page: 1,
      });
    });

    it('should return empty array when no tool products exist', async () => {
      repository.findAllByBusiness.mockResolvedValue({
        data: [],
        total: 0,
      });

      const result = await service.findAll(
        mockBusinessId,
        { page: 1, limit: 10 },
        mockUserPublicId,
        'en',
      );
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.last_page).toBe(0);
    });

    it('should throw NotFoundException when business not found', async () => {
      mockTrx.mockImplementationOnce((tableName: string) => {
        const qb: any = {
          where: jest.fn().mockReturnThis(),
          whereNull: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(null),
        };
        return qb;
      });

      await expect(
        service.findAll(
          mockBusinessId,
          { page: 1, limit: 10 },
          mockUserPublicId,
          'en',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // FIND ONE
  // =========================================================================

  describe('findOne', () => {
    beforeEach(() => {
      repository.findUserIdByPublicId.mockResolvedValue(mockUserId);
    });

    it('should find a tool product successfully', async () => {
      repository.findByProductIdWithBaseProduct.mockResolvedValue(
        mockToolProductWithBase,
      );

      const result = await service.findOne(
        mockBusinessId,
        mockProductId,
        mockUserPublicId,
        'en',
      );
      expect(result).toEqual(mockToolProductWithBase);
    });

    it('should throw NotFoundException when tool product not found', async () => {
      repository.findByProductIdWithBaseProduct.mockResolvedValue(null);

      await expect(
        service.findOne(mockBusinessId, mockProductId, mockUserPublicId, 'en'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // UPDATE
  // =========================================================================

  describe('update', () => {
    const mockToolProductModel = {
      getProductId: () => mockProductId,
      getWarrantyMonths: () => 12,
      updateDetails: jest.fn(),
      toEntity: jest.fn().mockReturnValue({
        product_id: mockProductId,
        warranty_months: 24,
        updated_at: new Date(),
        deleted_at: null,
        id_creator: mockUserPublicId,
        id_updater: mockUserPublicId,
      }),
    };

    beforeEach(() => {
      repository.findUserIdByPublicId.mockResolvedValue(mockUserId);
      repository.findProductByIdAndBusiness.mockResolvedValue(mockProduct);
      repository.findById.mockResolvedValue(mockToolProductModel as any);
      repository.updateToolProduct.mockResolvedValue(undefined);
      repository.findByProductIdWithBaseProduct.mockResolvedValue({
        ...mockToolProductWithBase,
        warranty_months: 24,
      });
    });

    it('should update a tool product successfully', async () => {
      const result = await service.update(
        mockBusinessId,
        mockProductId,
        { warranty_months: 24 },
        mockUserPublicId,
        'en',
      );
      expect(result.warranty_months).toBe(24);
      expect(mockToolProductModel.updateDetails).toHaveBeenCalledWith({
        warrantyMonths: 24,
        updaterId: mockUserPublicId,
      });
    });

    it('should throw NotFoundException when tool product not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update(
          mockBusinessId,
          mockProductId,
          { warranty_months: 24 },
          mockUserPublicId,
          'en',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // DELETE
  // =========================================================================

  describe('delete', () => {
    const mockToolProductModel = {
      getProductId: () => mockProductId,
    };

    beforeEach(() => {
      repository.findUserIdByPublicId.mockResolvedValue(mockUserId);
      repository.findProductByIdAndBusiness.mockResolvedValue(mockProduct);
      repository.findById.mockResolvedValue(mockToolProductModel as any);
      repository.softDeleteToolProduct.mockResolvedValue(undefined);
    });

    it('should delete a tool product successfully', async () => {
      await service.delete(
        mockBusinessId,
        mockProductId,
        mockUserPublicId,
        'en',
      );
      expect(repository.softDeleteToolProduct).toHaveBeenCalledWith(
        mockProductId,
      );
    });

    it('should throw NotFoundException when tool product not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.delete(mockBusinessId, mockProductId, mockUserPublicId, 'en'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when product not belongs to business', async () => {
      repository.findProductByIdAndBusiness.mockResolvedValue(null);

      await expect(
        service.delete(mockBusinessId, mockProductId, mockUserPublicId, 'en'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
