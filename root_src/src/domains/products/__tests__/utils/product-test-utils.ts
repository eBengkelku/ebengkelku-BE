import { CreateProductDto } from '../../dto/create-product.dto';
import { UpdateProductDto } from '../../dto/update-product.dto';

/**
 * Test utility functions and mock factories for Product domain tests
 */

export class ProductTestUtils {
  /**
   * Create a mock product data object
   */
  static createMockProduct(overrides: Partial<any> = {}) {
    return {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Product',
      description: 'Test product description',
      price: 99.99,
      stock_quantity: 50,
      category: 'Electronics',
      file_id: 'file-123',
      file_path: '/var/www/files/images/test.jpg',
      image_original_name: 'test.jpg',
      image_mime_type: 'image/jpeg',
      image_file_size: 1024000,
      created_at: new Date('2023-01-01T00:00:00Z'),
      updated_at: new Date('2023-01-01T00:00:00Z'),
      deleted_at: null,
      ...overrides,
    };
  }

  /**
   * Create multiple mock products
   */
  static createMockProducts(count: number = 3) {
    return Array.from({ length: count }, (_, index) =>
      ProductTestUtils.createMockProduct({
        id: `123e4567-e89b-12d3-a456-42661417400${index}`,
        name: `Test Product ${index + 1}`,
        price: 99.99 + index * 10,
        stock_quantity: 50 - index * 5,
      }),
    );
  }

  /**
   * Create a valid CreateProductDto for testing
   */
  static createValidCreateDto(
    overrides: Partial<CreateProductDto> = {},
  ): CreateProductDto {
    return {
      name: 'Test Product',
      description: 'Test product description',
      price: 99.99,
      stock_quantity: 50,
      category: 'Electronics',
      ...overrides,
    };
  }

  /**
   * Create multiple valid CreateProductDto objects
   */
  static createValidCreateDtos(count: number = 3): CreateProductDto[] {
    return Array.from({ length: count }, (_, index) =>
      this.createValidCreateDto({
        name: `Test Product ${index + 1}`,
        price: 99.99 + index * 10,
        stock_quantity: 50 - index * 5,
      }),
    );
  }

  /**
   * Create a valid UpdateProductDto for testing
   */
  static createValidUpdateDto(
    overrides: Partial<UpdateProductDto> = {},
  ): UpdateProductDto {
    return {
      name: 'Updated Product',
      description: 'Updated description',
      price: 149.99,
      stock_quantity: 75,
      category: 'Updated Category',
      ...overrides,
    };
  }

  /**
   * Create invalid data for testing validation
   */
  static createInvalidCreateDto(
    type: 'missingName' | 'negativePrice' | 'negativeStock' | 'longName',
  ) {
    const base = this.createValidCreateDto();

    switch (type) {
      case 'missingName':
        return { ...base, name: undefined };
      case 'negativePrice':
        return { ...base, price: -10 };
      case 'negativeStock':
        return { ...base, stock_quantity: -5 };
      case 'longName':
        return { ...base, name: 'A'.repeat(300) }; // Exceeds 255 character limit
      default:
        return base;
    }
  }

  /**
   * Create a mock Express.Multer.File for testing file uploads
   */
  static createMockFile(
    overrides: Partial<Express.Multer.File> = {},
  ): Express.Multer.File {
    return {
      fieldname: 'image',
      originalname: 'test-image.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024000,
      destination: '/tmp',
      filename: 'test-image.jpg',
      path: '/tmp/test-image.jpg',
      buffer: Buffer.from('fake-image-data'),
      ...overrides,
    } as any;
  }

  /**
   * Create mock files of different types
   */
  static createMockFiles() {
    return {
      jpeg: ProductTestUtils.createMockFile({
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      }),
      png: ProductTestUtils.createMockFile({
        originalname: 'test.png',
        mimetype: 'image/png',
      }),
      gif: ProductTestUtils.createMockFile({
        originalname: 'test.gif',
        mimetype: 'image/gif',
      }),
      large: ProductTestUtils.createMockFile({
        originalname: 'large-image.jpg',
        size: 5 * 1024 * 1024, // 5MB
      }),
      small: ProductTestUtils.createMockFile({
        originalname: 'small-image.jpg',
        size: 1024, // 1KB
      }),
    };
  }

  /**
   * Create mock service responses
   */
  static createMockServiceResponse(
    type: 'success' | 'error' | 'notFound',
    data?: any,
  ): any {
    switch (type) {
      case 'success':
        return {
          success: true,
          message: 'Operation completed successfully',
          data: data || ProductTestUtils.createMockProduct(),
        };
      case 'error':
        return {
          success: false,
          message: 'Operation failed',
          statusCode: 400,
          data: null,
        };
      case 'notFound':
        return {
          success: false,
          message: 'Resource not found',
          statusCode: 404,
          data: null,
        };
      default:
        return ProductTestUtils.createMockServiceResponse('success', data);
    }
  }

  /**
   * Create mock paginated response
   */
  static createMockPaginatedResponse(
    products?: any[],
    page: number = 1,
    limit: number = 10,
  ) {
    const data = products || ProductTestUtils.createMockProducts(3);
    const total = data.length;

    return {
      success: true,
      message: 'Resources listed successfully',
      data,
      meta: {
        current_page: page,
        per_page: limit,
        total,
        last_page: Math.ceil(total / limit),
        from: (page - 1) * limit + 1,
        to: Math.min(page * limit, total),
      },
    };
  }

  /**
   * Create mock statistics response
   */
  static createMockStatsResponse() {
    return {
      success: true,
      message: 'Product statistics retrieved',
      data: {
        overall: {
          total_products: 100,
          average_price: 299.99,
          min_price: 10.0,
          max_price: 999.99,
          total_stock: 5000,
          total_categories: 10,
        },
        by_category: [
          {
            category: 'Electronics',
            count: 50,
            avg_price: 350.0,
            total_stock: 2500,
          },
          {
            category: 'Books',
            count: 30,
            avg_price: 25.99,
            total_stock: 1500,
          },
          {
            category: 'Clothing',
            count: 20,
            avg_price: 45.5,
            total_stock: 1000,
          },
        ],
      },
    };
  }

  /**
   * Create mock database query builder
   */
  static createMockQueryBuilder(mockData?: any[]) {
    const data = mockData || ProductTestUtils.createMockProducts();

    return {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereRaw: jest.fn().mockReturnThis(),
      whereNull: jest.fn().mockReturnThis(),
      whereNotNull: jest.fn().mockReturnThis(),
      whereBetween: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      rightJoin: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      sum: jest.fn().mockReturnThis(),
      avg: jest.fn().mockReturnThis(),
      min: jest.fn().mockReturnThis(),
      max: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: 'new-id' }]),
      first: jest.fn().mockResolvedValue(data[0] || null),
      then: jest.fn().mockImplementation((resolve) => resolve(data)),
    };
  }

  /**
   * Create mock Knex transaction
   */
  static createMockTransaction() {
    return {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: 'new-id' }]),
    };
  }

  /**
   * Create mock Knex instance
   */
  static createMockKnex(mockData?: any[]) {
    const queryBuilder = ProductTestUtils.createMockQueryBuilder(mockData);
    const transaction = ProductTestUtils.createMockTransaction();

    const mockKnex = jest.fn().mockImplementation((tableName) => {
      // Return different query builders based on table name
      if (tableName === 'products') {
        return queryBuilder;
      }
      if (tableName === 'files') {
        return ProductTestUtils.createMockQueryBuilder([
          { id: 'file-1', file_path: '/path/to/file1.jpg' },
          { id: 'file-2', file_path: '/path/to/file2.jpg' },
        ]);
      }
      return queryBuilder;
    });

    // Add transaction support
    (mockKnex as any).transaction = jest.fn().mockResolvedValue(transaction);

    // Add other Knex methods
    (mockKnex as any).fn = {
      now: jest.fn().mockReturnValue(new Date()),
    };
    (mockKnex as any).raw = jest.fn();

    // Copy query builder methods to the function itself
    Object.assign(mockKnex, queryBuilder);

    return mockKnex;
  }

  /**
   * Create test filters for searching/filtering
   */
  static createTestFilters() {
    return {
      basic: {
        category: 'Electronics',
        name: 'iPhone',
      },
      withPrice: {
        category: 'Electronics',
        minPrice: 100,
        maxPrice: 1000,
      },
      withStock: {
        inStock: true,
      },
      complex: {
        category: 'Electronics',
        name: 'iPhone',
        minPrice: 500,
        maxPrice: 1500,
        inStock: true,
      },
      empty: {},
    };
  }

  /**
   * Create test pagination parameters
   */
  static createTestPagination() {
    return {
      default: { page: 1, limit: 10 },
      custom: { page: 2, limit: 20 },
      large: { page: 1, limit: 100 },
      edge: { page: 999, limit: 1 },
    };
  }

  /**
   * Generate test UUIDs
   */
  static generateTestUUIDs(count: number = 5) {
    const uuids = [];
    for (let i = 0; i < count; i++) {
      uuids.push(`123e4567-e89b-12d3-a456-42661417400${i}`);
    }
    return uuids;
  }

  /**
   * Create test error scenarios
   */
  static createTestErrors() {
    return {
      validation: new Error('Validation failed'),
      database: new Error('Database connection failed'),
      notFound: new Error('Resource not found'),
      unauthorized: new Error('Unauthorized access'),
      fileUpload: new Error('File upload failed'),
      transaction: new Error('Transaction failed'),
    };
  }

  /**
   * Create mock I18n service responses
   */
  static createMockI18nResponses() {
    return {
      'common.created': 'Resource created successfully',
      'common.updated': 'Resource updated successfully',
      'common.deleted': 'Resource deleted successfully',
      'common.listed': 'Resources listed successfully',
      'products.found': 'Product found successfully',
      'products.errors.notFound': 'Product with ID {id} not found',
      'products.validation.name.required': 'Product name is required',
      'products.validation.price.positive': 'Price must be positive',
      'products.validation.stock.positive': 'Stock quantity must be positive',
    };
  }

  /**
   * Create mock configuration for tests
   */
  static createMockConfig(overrides: Partial<any> = {}) {
    return {
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
      rules: {
        name: { required: true, type: 'string', maxLength: 255 },
        price: { required: true, type: 'number', min: 0 },
        stock_quantity: { required: true, type: 'number', min: 0 },
      },
      ...overrides,
    };
  }

  /**
   * Utility to wait for async operations in tests
   */
  static async waitFor(ms: number = 100) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Clean up test data (useful for integration tests)
   */
  static createCleanupHelper() {
    const createdIds: string[] = [];

    return {
      addId: (id: string) => createdIds.push(id),
      getIds: () => [...createdIds],
      clear: () => (createdIds.length = 0),
      cleanup: async (service: any) => {
        for (const id of createdIds) {
          try {
            await service.remove(id);
          } catch {
            // Ignore cleanup errors
          }
        }
        createdIds.length = 0;
      },
    };
  }
}

/**
 * Mock factory for commonly used test objects
 */
export class MockFactory {
  static product = ProductTestUtils.createMockProduct;
  static products = ProductTestUtils.createMockProducts;
  static createDto = ProductTestUtils.createValidCreateDto;
  static updateDto = ProductTestUtils.createValidUpdateDto;
  static file = ProductTestUtils.createMockFile;
  static files = ProductTestUtils.createMockFiles;
  static response = ProductTestUtils.createMockServiceResponse;
  static pagination = ProductTestUtils.createMockPaginatedResponse;
  static stats = ProductTestUtils.createMockStatsResponse;
  static queryBuilder = ProductTestUtils.createMockQueryBuilder;
  static transaction = ProductTestUtils.createMockTransaction;
  static knex = ProductTestUtils.createMockKnex;
  static filters = ProductTestUtils.createTestFilters;
  static config = ProductTestUtils.createMockConfig;
}

/**
 * Test constants
 */
export const TEST_CONSTANTS = {
  VALID_UUID: '123e4567-e89b-12d3-a456-426614174000',
  INVALID_UUID: 'invalid-uuid',
  DEFAULT_PAGINATION: { page: 1, limit: 10 },
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  DEFAULT_LANGUAGE: 'en',
  ALTERNATIVE_LANGUAGE: 'es',
};
