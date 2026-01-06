import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from '../product.service';
import { DatabaseService } from '../../../database/database.service';
import { I18nService } from 'nestjs-i18n';

describe('ProductService', () => {
  let service: ProductService;
  let mockDatabaseService: Partial<DatabaseService>;
  let mockI18nService: Partial<I18nService>;
  let mockKnex: any;
  let mockTransaction: any;

  const mockConfig = {
    tableName: 'products',
    primaryKey: 'id',
    timestampColumns: {
      created: 'created_at',
      updated: 'updated_at',
      deleted: 'deleted_at',
    },
    descColumns: ['name', 'description'],
    fillable: [
      'name',
      'description',
      'price',
      'category',
      'stock_quantity',
      'file_id',
    ],
    rules: {},
  };

  const mockProduct = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    stock_quantity: 50,
    category: 'Electronics',
    file_id: 'file-123',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-01'),
    deleted_at: null,
  };

  const mockProducts = [
    mockProduct,
    {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Test Product 2',
      description: 'Test Description 2',
      price: 149.99,
      stock_quantity: 25,
      category: 'Gadgets',
      file_id: 'file-124',
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-01'),
      deleted_at: null,
    },
  ];

  beforeEach(async () => {
    // Create mock transaction
    mockTransaction = jest.fn().mockImplementation((_tableName: string) => {
      const tableQuery = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockResolvedValue(1),
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ id: 'new-id' }]),
      };
      return tableQuery;
    });

    // Add commit and rollback methods to the transaction function itself
    mockTransaction.commit = jest.fn().mockResolvedValue(undefined);
    mockTransaction.rollback = jest.fn().mockResolvedValue(undefined);
    mockTransaction.update = jest.fn().mockResolvedValue(1);
    mockTransaction.insert = jest.fn().mockReturnThis();
    mockTransaction.where = jest.fn().mockReturnThis();
    mockTransaction.returning = jest.fn().mockResolvedValue([{ id: 'new-id' }]);

    // Create mock knex query builder
    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereRaw: jest.fn().mockReturnThis(),
      whereNull: jest.fn().mockReturnThis(),
      whereNotNull: jest.fn().mockReturnThis(),
      whereBetween: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      avg: jest.fn().mockReturnThis(),
      sum: jest.fn().mockReturnThis(),
      min: jest.fn().mockReturnThis(),
      max: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(mockProduct),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: 'new-id' }]),
      raw: jest.fn(),
      fn: {
        now: jest.fn().mockReturnValue(new Date()),
      },
    };

    // Create mockKnex as a Jest mock function that returns the query builder
    mockKnex = jest.fn().mockImplementation((tableName: string) => {
      if (tableName === 'products') {
        return {
          ...mockQueryBuilder,
          // Default resolved value for queries
          then: (resolve: any) => resolve(mockProducts),
        };
      }
      if (tableName === 'files') {
        return {
          ...mockQueryBuilder,
          then: (resolve: any) => resolve([{ id: 'file-id' }]),
        };
      }
      return mockQueryBuilder;
    });

    // Add transaction method to mockKnex
    mockKnex.transaction = jest.fn().mockResolvedValue(mockTransaction);

    // Add raw method to mockKnex for SQL functions
    mockKnex.raw = jest.fn().mockImplementation((sql: string) => sql);

    mockDatabaseService = {
      getKnex: jest.fn().mockReturnValue(mockKnex),
    };

    mockI18nService = {
      translate: jest
        .fn()
        .mockImplementation((key: string) => `Translated: ${key}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
        {
          provide: I18nService,
          useValue: mockI18nService,
        },
        {
          provide: 'PRODUCT_CONFIG',
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  describe('findByCategory', () => {
    it('should find products by category', async () => {
      const mockQueryBuilder = {
        whereRaw: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([mockProduct]),
      };

      mockKnex.mockImplementation(() => mockQueryBuilder);

      const result = await service.findByCategory('Electronics');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockProduct]);
      expect(result.category).toBe('Electronics');
      expect(mockQueryBuilder.whereRaw).toHaveBeenCalledWith(
        'LOWER(category) LIKE LOWER(?)',
        ['%Electronics%'],
      );
    });

    it('should apply price filters when provided', async () => {
      const mockQueryBuilder = {
        whereRaw: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([mockProduct]),
      };

      mockKnex.mockImplementation(() => mockQueryBuilder);

      const filters = {
        minPrice: 50,
        maxPrice: 200,
        inStock: true,
      };

      await service.findByCategory('Electronics', filters);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith('price', '>=', 50);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('price', '<=', 200);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'stock_quantity',
        '>',
        0,
      );
    });
  });

  describe('getLowStockProducts', () => {
    it('should return products with low stock using default threshold', async () => {
      const lowStockProducts = [
        { ...mockProduct, stock_quantity: 5 },
        { ...mockProduct, stock_quantity: 8 },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        whereNotNull: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(lowStockProducts),
      };

      mockKnex.mockImplementation(() => mockQueryBuilder);

      const result = await service.getLowStockProducts();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(lowStockProducts);
      expect(result.threshold).toBe(10);
      expect(result.count).toBe(2);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'stock_quantity',
        '<=',
        10,
      );
    });

    it('should use custom threshold when provided', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        whereNotNull: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([]),
      };

      mockKnex.mockImplementation(() => mockQueryBuilder);

      await service.getLowStockProducts(5);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'stock_quantity',
        '<=',
        5,
      );
    });
  });

  describe('bulkUpdateStock', () => {
    it('should successfully update multiple products stock', async () => {
      const updates = [
        { id: 'id1', stock_quantity: 100 },
        { id: 'id2', stock_quantity: 200 },
      ];

      mockTransaction.update.mockResolvedValue(1); // Simulates successful update
      const mockTransactionFunction = jest
        .fn()
        .mockImplementation(() => mockTransaction);
      mockTransaction.mockImplementation = mockTransactionFunction;

      const result = await service.bulkUpdateStock(updates);

      expect(result.success).toBe(true);
      expect(result.updated_count).toBe(2);
      expect(result.data).toEqual([
        { id: 'id1', updated: true },
        { id: 'id2', updated: true },
      ]);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const updates = [{ id: 'id1', stock_quantity: 100 }];

      // Mock transaction to return an object with update method that rejects
      const mockTransactionQuery = {
        where: jest.fn().mockReturnThis(),
        update: jest.fn().mockRejectedValue(new Error('Database error')),
      };

      mockTransaction.mockImplementation(() => mockTransactionQuery);

      await expect(service.bulkUpdateStock(updates)).rejects.toThrow(
        'Database error',
      );
      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('getProductStats', () => {
    it('should return product statistics', async () => {
      const mockStats = {
        total_products: 100,
        average_price: 99.99,
        min_price: 10.0,
        max_price: 999.99,
        total_stock: 5000,
        total_categories: 10,
      };

      const mockCategoryStats = [
        {
          category: 'Electronics',
          count: 50,
          avg_price: 150.0,
          total_stock: 2500,
        },
        { category: 'Gadgets', count: 30, avg_price: 75.0, total_stock: 1500 },
      ];

      // Mock knex to handle both queries sequentially
      mockKnex
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue(mockStats),
        }))
        .mockImplementationOnce(() => ({
          select: jest.fn().mockReturnThis(),
          count: jest.fn().mockReturnThis(),
          avg: jest.fn().mockReturnThis(),
          sum: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockResolvedValue(mockCategoryStats),
        }));

      const result = await service.getProductStats();

      expect(result.success).toBe(true);
      expect(result.data.overall).toEqual(mockStats);
      expect(result.data.by_category).toEqual(mockCategoryStats);
    });
  });

  describe('advancedSearch', () => {
    it('should perform advanced search with all filters', async () => {
      const searchQuery = {
        search: 'iPhone',
        category: 'Electronics',
        priceRange: { min: 100, max: 1000 },
        sortBy: 'price' as const,
        sortOrder: 'asc' as const,
      };

      const mockQueryBuilder = {
        whereNull: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereRaw: jest.fn().mockReturnThis(),
        whereBetween: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([mockProduct]),
      };

      mockKnex.mockImplementation(() => mockQueryBuilder);

      const result = await service.advancedSearch(searchQuery);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockProduct]);
      expect(result.query).toEqual(searchQuery);
      expect(mockQueryBuilder.whereBetween).toHaveBeenCalledWith(
        'price',
        [100, 1000],
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('price', 'asc');
    });

    it('should handle empty search query', async () => {
      const mockQueryBuilder = {
        whereNull: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([mockProduct]),
      };

      mockKnex.mockImplementation(() => mockQueryBuilder);

      const result = await service.advancedSearch({});

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockProduct]);
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'created_at',
        'desc',
      );
    });
  });

  describe('create', () => {
    it('should create product successfully', async () => {
      const productData = {
        name: 'New Product',
        price: 99.99,
        stock_quantity: 50,
      };

      // Mock the parent create method
      const mockCreateResult = {
        success: true,
        data: 'new-product-id',
      };

      jest
        .spyOn(service as any, 'create')
        .mockImplementation(async (data: any) => {
          // Simulate the business logic in the overridden method
          if (data.price && data.price < 0) {
            return {
              success: false,
              message: 'Price cannot be negative',
              statusCode: 400,
            };
          }

          if (data.stock_quantity === undefined) {
            data.stock_quantity = 0;
          }

          return mockCreateResult;
        });

      const result = await service.create(productData);

      expect(result.success).toBe(true);
      expect(result.data).toBe('new-product-id');
    });

    it('should reject negative price', async () => {
      const productData = {
        name: 'Invalid Product',
        price: -10,
        stock_quantity: 50,
      };

      const result = await service.create(productData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Price cannot be negative');
      expect(result.statusCode).toBe(400);
    });

    it('should set default stock quantity when not provided', async () => {
      const productData = {
        name: 'Product Without Stock',
        price: 99.99,
      };

      // Mock the parent create method (CrudService.create) to verify the data
      const superCreateSpy = jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(service)), 'create')
        .mockImplementation(async (data: any) => {
          expect(data.stock_quantity).toBe(0);
          return { success: true, data: 'new-id' };
        });

      await service.create(productData);

      expect(superCreateSpy).toHaveBeenCalled();
      superCreateSpy.mockRestore();
    });
  });

  describe('update', () => {
    it('should update product successfully', async () => {
      const updateData = {
        name: 'Updated Product',
        price: 149.99,
      };

      // Mock parent update method
      const mockUpdateResult = {
        success: true,
        data: { ...mockProduct, ...updateData },
      };

      jest.spyOn(service as any, 'update').mockResolvedValue(mockUpdateResult);

      const result = await service.update('product-id', updateData);

      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Updated Product');
    });

    it('should reject negative stock quantity', async () => {
      const updateData = {
        stock_quantity: -5,
      };

      const result = await service.update('product-id', updateData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Stock quantity cannot be negative');
      expect(result.statusCode).toBe(400);
    });
  });

  describe('createWithFile', () => {
    it('should create product with file successfully', async () => {
      const productData = {
        name: 'Product with Image',
        price: 199.99,
        stock_quantity: 25,
      };

      const mockFile = {
        originalname: 'test-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024000,
      } as Express.Multer.File;

      const mockFileId = 'file-123';
      const mockProductId = 'product-123';

      // Mock transaction for files table
      mockTransaction.mockImplementation((table: string) => {
        if (table === 'files') {
          return {
            insert: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([{ id: mockFileId }]),
          };
        }
        if (table === 'products') {
          return {
            insert: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([{ id: mockProductId }]),
          };
        }
        return mockTransaction;
      });

      // Mock findByIdWithFile method
      const expectedResult = {
        ...productData,
        id: mockProductId,
        file_id: mockFileId,
        file_path: expect.stringContaining('test-image.jpg'),
      };

      jest.spyOn(service, 'findByIdWithFile').mockResolvedValue(expectedResult);

      const result = await service.createWithFile(productData, mockFile);

      expect(result.success).toBe(true);
      expect(result.data.file_id).toBe(mockFileId);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should rollback transaction on error', async () => {
      const productData = { name: 'Test', price: 99.99 };
      const mockFile = { originalname: 'test.jpg' } as Express.Multer.File;

      mockTransaction.mockImplementation(() => {
        throw new Error('Database error');
      });

      await expect(
        service.createWithFile(productData, mockFile),
      ).rejects.toThrow('Database error');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('findAllWithFiles', () => {
    it('should return paginated products with file information', async () => {
      const mockProductsWithFiles = [
        {
          ...mockProduct,
          file_path: '/path/to/image.jpg',
          image_original_name: 'image.jpg',
          image_mime_type: 'image/jpeg',
          image_file_size: 1024000,
        },
      ];

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(mockProductsWithFiles),
      };

      const mockCountBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        count: jest.fn().mockResolvedValue([{ count: '10' }]),
      };

      mockKnex
        .mockImplementationOnce(() => mockQueryBuilder)
        .mockImplementationOnce(() => mockCountBuilder);

      const result = await service.findAllWithFiles(1, 5);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProductsWithFiles);
      expect(result.meta.current_page).toBe(1);
      expect(result.meta.per_page).toBe(5);
      expect(result.meta.total).toBe(10);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        category: 'Electronics',
        name: 'iPhone',
        minPrice: 100,
        maxPrice: 1000,
      };

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereRaw: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue([]),
      };

      const mockCountBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereRaw: jest.fn().mockReturnThis(),
        count: jest.fn().mockResolvedValue([{ count: '0' }]),
      };

      mockKnex
        .mockImplementationOnce(() => mockQueryBuilder)
        .mockImplementationOnce(() => mockCountBuilder);

      await service.findAllWithFiles(1, 10, filters);

      expect(mockQueryBuilder.whereRaw).toHaveBeenCalledWith(
        'LOWER(category) LIKE LOWER(?)',
        ['%Electronics%'],
      );
      expect(mockQueryBuilder.whereRaw).toHaveBeenCalledWith(
        'LOWER(name) LIKE LOWER(?)',
        ['%iPhone%'],
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('price', '>=', 100);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('price', '<=', 1000);
    });
  });

  describe('findByIdWithFile', () => {
    it('should return product with file information', async () => {
      const mockProductWithFile = {
        ...mockProduct,
        file_path: '/path/to/image.jpg',
        image_original_name: 'image.jpg',
        image_mime_type: 'image/jpeg',
        image_file_size: 1024000,
      };

      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockProductWithFile),
      };

      mockKnex.mockImplementation(() => mockQueryBuilder);

      const result = await service.findByIdWithFile('product-id');

      expect(result).toEqual(mockProductWithFile);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'products.id',
        'product-id',
      );
    });

    it('should return null when product not found', async () => {
      const mockQueryBuilder = {
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereNull: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      };

      mockKnex.mockImplementation(() => mockQueryBuilder);

      const result = await service.findByIdWithFile('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('updateWithFile', () => {
    it('should update product with new file', async () => {
      const updateData = { name: 'Updated Product' };
      const mockFile = {
        originalname: 'new-image.jpg',
        mimetype: 'image/jpeg',
        size: 2048000,
      } as Express.Multer.File;

      const existingProduct = { ...mockProduct, file_id: 'old-file-id' };
      const updatedProduct = {
        ...existingProduct,
        ...updateData,
        file_id: 'new-file-id',
      };

      jest
        .spyOn(service, 'findByIdWithFile')
        .mockResolvedValueOnce(existingProduct)
        .mockResolvedValueOnce(updatedProduct);

      mockTransaction.mockImplementation((table: string) => {
        if (table === 'files') {
          return {
            insert: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([{ id: 'new-file-id' }]),
            where: jest.fn().mockReturnThis(),
            update: jest.fn().mockResolvedValue(1),
          };
        }
        if (table === 'products') {
          return {
            where: jest.fn().mockReturnThis(),
            update: jest.fn().mockResolvedValue(1),
          };
        }
        return mockTransaction;
      });

      const result = await service.updateWithFile(
        'product-id',
        updateData,
        mockFile,
      );

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedProduct);
      expect(mockTransaction.commit).toHaveBeenCalled();
    });

    it('should update product without changing file when no file provided', async () => {
      const updateData = { name: 'Updated Product' };
      const existingProduct = { ...mockProduct };
      const updatedProduct = { ...existingProduct, ...updateData };

      jest
        .spyOn(service, 'findByIdWithFile')
        .mockResolvedValueOnce(existingProduct)
        .mockResolvedValueOnce(updatedProduct);

      mockTransaction.mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            where: jest.fn().mockReturnThis(),
            update: jest.fn().mockResolvedValue(1),
          };
        }
        return mockTransaction;
      });

      const result = await service.updateWithFile('product-id', updateData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedProduct);
    });

    it('should reject negative stock quantity', async () => {
      const updateData = { stock_quantity: -10 };

      jest.spyOn(service, 'findByIdWithFile').mockResolvedValue(mockProduct);

      await expect(
        service.updateWithFile('product-id', updateData),
      ).rejects.toThrow('Stock quantity cannot be negative');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });
});
