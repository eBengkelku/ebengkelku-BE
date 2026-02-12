import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../inventory.service';
import { InventoryRepository } from '../repository/inventory.repository';
import { DatabaseService } from '../../../database/database.service';
import { I18nService } from 'nestjs-i18n';
import {
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;
  let repository: jest.Mocked<InventoryRepository>;
  let databaseService: jest.Mocked<DatabaseService>;
  let i18n: jest.Mocked<I18nService>;

  const mockBusinessId = 'business-uuid-1';
  const mockProductId = 'product-uuid-1';
  const mockInventoryId = 'inventory-uuid-1';
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

  const mockInventoryWithProduct = {
    id: mockInventoryId,
    product_id: mockProductId,
    quantity: 100,
    min_stock: 10,
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
        InventoryService,
        {
          provide: InventoryRepository,
          useValue: {
            findById: jest.fn(),
            findByProductId: jest.fn(),
            inventoryExists: jest.fn(),
            findProductByIdAndBusiness: jest.fn(),
            findUserIdByPublicId: jest.fn(),
            insertInventory: jest.fn(),
            updateInventory: jest.fn(),
            softDeleteInventory: jest.fn(),
            findByProductIdWithProduct: jest.fn(),
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

    service = module.get<InventoryService>(InventoryService);
    repository = module.get(InventoryRepository);
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
      repository.inventoryExists.mockResolvedValue(false);
      repository.insertInventory.mockResolvedValue(undefined);
      repository.findByProductIdWithProduct.mockResolvedValue(
        mockInventoryWithProduct,
      );
    });

    it('should create an inventory successfully', async () => {
      const result = await service.create(
        mockBusinessId,
        mockProductId,
        { quantity: 100, min_stock: 10 },
        mockUserPublicId,
        'en',
      );
      expect(result).toEqual(mockInventoryWithProduct);
      expect(repository.insertInventory).toHaveBeenCalled();
    });

    it('should use default quantity=0 and min_stock=0 when not provided', async () => {
      await service.create(
        mockBusinessId,
        mockProductId,
        {},
        mockUserPublicId,
        'en',
      );
      expect(repository.insertInventory).toHaveBeenCalledWith(
        expect.objectContaining({ quantity: 0, min_stock: 0 }),
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
          { quantity: 100 },
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
          { quantity: 100 },
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
          { quantity: 100 },
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
          { quantity: 100 },
          mockUserPublicId,
          'en',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when product not found', async () => {
      repository.findProductByIdAndBusiness.mockResolvedValue(null);

      await expect(
        service.create(
          mockBusinessId,
          mockProductId,
          { quantity: 100 },
          mockUserPublicId,
          'en',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when inventory already exists', async () => {
      repository.inventoryExists.mockResolvedValue(true);

      await expect(
        service.create(
          mockBusinessId,
          mockProductId,
          { quantity: 100 },
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

    it('should return paginated inventories', async () => {
      repository.findAllByBusiness.mockResolvedValue({
        data: [mockInventoryWithProduct],
        total: 1,
      });

      const result = await service.findAll(
        mockBusinessId,
        mockUserPublicId,
        { page: 1, limit: 10 },
        {},
        'en',
      );
      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });

    it('should return empty list when no inventories', async () => {
      repository.findAllByBusiness.mockResolvedValue({
        data: [],
        total: 0,
      });

      const result = await service.findAll(
        mockBusinessId,
        mockUserPublicId,
        { page: 1, limit: 10 },
        {},
        'en',
      );
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should pass low_stock filter to repository', async () => {
      repository.findAllByBusiness.mockResolvedValue({
        data: [mockInventoryWithProduct],
        total: 1,
      });

      await service.findAll(
        mockBusinessId,
        mockUserPublicId,
        { page: 1, limit: 10 },
        { low_stock: true },
        'en',
      );
      expect(repository.findAllByBusiness).toHaveBeenCalledWith(
        mockBusinessId,
        { page: 1, limit: 10 },
        { low_stock: true },
      );
    });

    it('should calculate correct totalPages', async () => {
      repository.findAllByBusiness.mockResolvedValue({
        data: [],
        total: 25,
      });

      const result = await service.findAll(
        mockBusinessId,
        mockUserPublicId,
        { page: 1, limit: 10 },
        {},
        'en',
      );
      expect(result.meta.totalPages).toBe(3);
    });
  });

  // =========================================================================
  // FIND ONE
  // =========================================================================

  describe('findOne', () => {
    beforeEach(() => {
      repository.findUserIdByPublicId.mockResolvedValue(mockUserId);
    });

    it('should find an inventory successfully', async () => {
      repository.findByProductIdWithProduct.mockResolvedValue(
        mockInventoryWithProduct,
      );

      const result = await service.findOne(
        mockBusinessId,
        mockProductId,
        mockUserPublicId,
        'en',
      );
      expect(result).toEqual(mockInventoryWithProduct);
    });

    it('should throw NotFoundException when inventory not found', async () => {
      repository.findByProductIdWithProduct.mockResolvedValue(null);

      await expect(
        service.findOne(mockBusinessId, mockProductId, mockUserPublicId, 'en'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // UPDATE
  // =========================================================================

  describe('update', () => {
    const mockInventoryModel = {
      getId: () => mockInventoryId,
      getProductId: () => mockProductId,
      getQuantity: () => 100,
      getMinStock: () => 10,
      updateDetails: jest.fn(),
      toEntity: jest.fn().mockReturnValue({
        id: mockInventoryId,
        product_id: mockProductId,
        quantity: 50,
        min_stock: 5,
        updated_at: new Date(),
        deleted_at: null,
        id_creator: mockUserPublicId,
        id_updater: mockUserPublicId,
      }),
    };

    beforeEach(() => {
      repository.findUserIdByPublicId.mockResolvedValue(mockUserId);
      repository.findProductByIdAndBusiness.mockResolvedValue(mockProduct);
      repository.findByProductId.mockResolvedValue(mockInventoryModel as any);
      repository.updateInventory.mockResolvedValue(undefined);
      repository.findByProductIdWithProduct.mockResolvedValue({
        ...mockInventoryWithProduct,
        quantity: 50,
        min_stock: 5,
      });
    });

    it('should update an inventory successfully', async () => {
      const result = await service.update(
        mockBusinessId,
        mockProductId,
        { quantity: 50, min_stock: 5 },
        mockUserPublicId,
        'en',
      );
      expect(result.quantity).toBe(50);
      expect(result.min_stock).toBe(5);
      expect(mockInventoryModel.updateDetails).toHaveBeenCalledWith({
        quantity: 50,
        minStock: 5,
        updaterId: mockUserPublicId,
      });
    });

    it('should throw NotFoundException when inventory not found', async () => {
      repository.findByProductId.mockResolvedValue(null);

      await expect(
        service.update(
          mockBusinessId,
          mockProductId,
          { quantity: 50 },
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
    const mockInventoryModel = {
      getId: () => mockInventoryId,
      getProductId: () => mockProductId,
    };

    beforeEach(() => {
      repository.findUserIdByPublicId.mockResolvedValue(mockUserId);
      repository.findProductByIdAndBusiness.mockResolvedValue(mockProduct);
      repository.findByProductId.mockResolvedValue(mockInventoryModel as any);
      repository.softDeleteInventory.mockResolvedValue(undefined);
    });

    it('should delete an inventory successfully', async () => {
      await service.delete(
        mockBusinessId,
        mockProductId,
        mockUserPublicId,
        'en',
      );
      expect(repository.softDeleteInventory).toHaveBeenCalledWith(
        mockInventoryId,
      );
    });

    it('should throw NotFoundException when inventory not found', async () => {
      repository.findByProductId.mockResolvedValue(null);

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
