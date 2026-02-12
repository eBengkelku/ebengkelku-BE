import { Test, TestingModule } from '@nestjs/testing';
import { SparePartProductService } from '../spare-part-product.service';
import { SparePartProductRepository } from '../repository/spare-part-product.repository';
import { DatabaseService } from '../../../database/database.service';
import { I18nService } from 'nestjs-i18n';
import {
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';

describe('SparePartProductService', () => {
  let service: SparePartProductService;
  let repository: jest.Mocked<SparePartProductRepository>;
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
    name: 'Test Spare Part',
  };

  const mockSparePartProductWithBase = {
    product_id: mockProductId,
    brand: 'Denso',
    grade: 'genuine',
    updated_at: null,
    deleted_at: null,
    id_creator: mockUserPublicId,
    id_updater: null,
    product: {
      id: mockProductId,
      name: 'Test Spare Part',
      description: 'A test spare part',
      price: 50000,
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
        SparePartProductService,
        {
          provide: SparePartProductRepository,
          useValue: {
            findById: jest.fn(),
            sparePartProductExists: jest.fn(),
            findProductByIdAndBusiness: jest.fn(),
            findUserIdByPublicId: jest.fn(),
            insertSparePartProduct: jest.fn(),
            updateSparePartProduct: jest.fn(),
            softDeleteSparePartProduct: jest.fn(),
            findByProductIdWithBaseProduct: jest.fn(),
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

    service = module.get<SparePartProductService>(SparePartProductService);
    repository = module.get(SparePartProductRepository);
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
      repository.sparePartProductExists.mockResolvedValue(false);
      repository.insertSparePartProduct.mockResolvedValue(undefined);
      repository.findByProductIdWithBaseProduct.mockResolvedValue(
        mockSparePartProductWithBase,
      );
    });

    it('should create a spare part product successfully', async () => {
      const result = await service.create(
        mockBusinessId,
        mockProductId,
        { brand: 'Denso', grade: 'genuine' },
        mockUserPublicId,
        'en',
      );
      expect(result).toEqual(mockSparePartProductWithBase);
      expect(repository.insertSparePartProduct).toHaveBeenCalled();
    });

    it('should create with null brand and grade when not provided', async () => {
      await service.create(
        mockBusinessId,
        mockProductId,
        {},
        mockUserPublicId,
        'en',
      );
      expect(repository.insertSparePartProduct).toHaveBeenCalledWith(
        expect.objectContaining({ brand: null, grade: null }),
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
          { brand: 'Denso' },
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
          { brand: 'Denso' },
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
          { brand: 'Denso' },
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
          { brand: 'Denso' },
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
          { brand: 'Denso' },
          mockUserPublicId,
          'en',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when spare part product already exists', async () => {
      repository.sparePartProductExists.mockResolvedValue(true);

      await expect(
        service.create(
          mockBusinessId,
          mockProductId,
          { brand: 'Denso' },
          mockUserPublicId,
          'en',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  // =========================================================================
  // FIND ONE
  // =========================================================================

  describe('findOne', () => {
    beforeEach(() => {
      repository.findUserIdByPublicId.mockResolvedValue(mockUserId);
    });

    it('should find a spare part product successfully', async () => {
      repository.findByProductIdWithBaseProduct.mockResolvedValue(
        mockSparePartProductWithBase,
      );

      const result = await service.findOne(
        mockBusinessId,
        mockProductId,
        mockUserPublicId,
        'en',
      );
      expect(result).toEqual(mockSparePartProductWithBase);
    });

    it('should throw NotFoundException when spare part product not found', async () => {
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
    const mockSparePartModel = {
      getProductId: () => mockProductId,
      getBrand: () => 'Denso',
      getGrade: () => 'genuine',
      updateDetails: jest.fn(),
      toEntity: jest.fn().mockReturnValue({
        product_id: mockProductId,
        brand: 'Bosch',
        grade: 'aftermarket',
        updated_at: new Date(),
        deleted_at: null,
        id_creator: mockUserPublicId,
        id_updater: mockUserPublicId,
      }),
    };

    beforeEach(() => {
      repository.findUserIdByPublicId.mockResolvedValue(mockUserId);
      repository.findProductByIdAndBusiness.mockResolvedValue(mockProduct);
      repository.findById.mockResolvedValue(mockSparePartModel as any);
      repository.updateSparePartProduct.mockResolvedValue(undefined);
      repository.findByProductIdWithBaseProduct.mockResolvedValue({
        ...mockSparePartProductWithBase,
        brand: 'Bosch',
        grade: 'aftermarket',
      });
    });

    it('should update a spare part product successfully', async () => {
      const result = await service.update(
        mockBusinessId,
        mockProductId,
        { brand: 'Bosch', grade: 'aftermarket' },
        mockUserPublicId,
        'en',
      );
      expect(result.brand).toBe('Bosch');
      expect(result.grade).toBe('aftermarket');
      expect(mockSparePartModel.updateDetails).toHaveBeenCalledWith({
        brand: 'Bosch',
        grade: 'aftermarket',
        updaterId: mockUserPublicId,
      });
    });

    it('should throw NotFoundException when spare part product not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(
        service.update(
          mockBusinessId,
          mockProductId,
          { brand: 'Bosch' },
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
    const mockSparePartModel = {
      getProductId: () => mockProductId,
    };

    beforeEach(() => {
      repository.findUserIdByPublicId.mockResolvedValue(mockUserId);
      repository.findProductByIdAndBusiness.mockResolvedValue(mockProduct);
      repository.findById.mockResolvedValue(mockSparePartModel as any);
      repository.softDeleteSparePartProduct.mockResolvedValue(undefined);
    });

    it('should delete a spare part product successfully', async () => {
      await service.delete(
        mockBusinessId,
        mockProductId,
        mockUserPublicId,
        'en',
      );
      expect(repository.softDeleteSparePartProduct).toHaveBeenCalledWith(
        mockProductId,
      );
    });

    it('should throw NotFoundException when spare part product not found', async () => {
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
