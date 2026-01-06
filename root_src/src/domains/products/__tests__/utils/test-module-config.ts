import { ProductService } from '../../product.service';
import { ProductController } from '../../product.controller';
import { DatabaseService } from '../../../../database/database.service';
import { I18nService } from 'nestjs-i18n';
import { ProductTestUtils } from './product-test-utils';

/**
 * Test module configuration for Product domain tests
 * Provides consistent setup across all product test files
 */

export interface ProductTestModuleOptions {
  mockData?: any[];
  customConfig?: any;
  customI18nResponses?: Record<string, string>;
}

export class ProductTestModule {
  /**
   * Create a configured testing module for Product tests
   */
  static async createTestingModule(options: ProductTestModuleOptions = {}) {
    const {
      mockData = ProductTestUtils.createMockProducts(),
      customConfig = ProductTestUtils.createMockConfig(),
      customI18nResponses = ProductTestUtils.createMockI18nResponses(),
    } = options;

    const mockKnex = ProductTestUtils.createMockKnex(mockData);

    const mockDatabaseService = {
      getKnex: jest.fn().mockReturnValue(mockKnex),
    };

    const mockI18nService = {
      translate: jest.fn().mockImplementation((key: string, options?: any) => {
        // const lang = options?.lang || 'en';
        const args = options?.args || {};

        // Use custom responses if provided
        if ((customI18nResponses as Record<string, string>)[key]) {
          let message = (customI18nResponses as Record<string, string>)[key];

          // Replace placeholders
          if (args) {
            Object.keys(args).forEach((argKey) => {
              message = message.replace(`{${argKey}}`, args[argKey]);
              message = message.replace(`{{${argKey}}}`, args[argKey]);
            });
          }

          return message;
        }

        // Default fallback
        return `Translated: ${key}`;
      }),
    };

    const moduleBuilder = await import('@nestjs/testing').then((testing) =>
      testing.Test.createTestingModule({
        controllers: [ProductController],
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
            useValue: customConfig,
          },
        ],
      }),
    );

    return {
      module: await moduleBuilder.compile(),
      mocks: {
        knex: mockKnex,
        databaseService: mockDatabaseService,
        i18nService: mockI18nService,
        config: customConfig,
      },
    };
  }

  /**
   * Create a minimal testing module with only the service
   */
  static async createServiceTestingModule(
    options: ProductTestModuleOptions = {},
  ) {
    const {
      mockData = ProductTestUtils.createMockProducts(),
      customConfig = ProductTestUtils.createMockConfig(),
      customI18nResponses = ProductTestUtils.createMockI18nResponses(),
    } = options;

    const mockKnex = ProductTestUtils.createMockKnex(mockData);

    const mockDatabaseService = {
      getKnex: jest.fn().mockReturnValue(mockKnex),
    };

    const mockI18nService = {
      translate: jest.fn().mockImplementation((key: string, _options?: any) => {
        if ((customI18nResponses as Record<string, string>)[key]) {
          return (customI18nResponses as Record<string, string>)[key];
        }
        return `Translated: ${key}`;
      }),
    };

    const moduleBuilder = await import('@nestjs/testing').then((testing) =>
      testing.Test.createTestingModule({
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
            useValue: customConfig,
          },
        ],
      }),
    );

    return {
      module: await moduleBuilder.compile(),
      mocks: {
        knex: mockKnex,
        databaseService: mockDatabaseService,
        i18nService: mockI18nService,
        config: customConfig,
      },
    };
  }

  /**
   * Create a testing module for controller-only tests
   */
  static async createControllerTestingModule(
    options: ProductTestModuleOptions = {},
  ) {
    const { customI18nResponses = ProductTestUtils.createMockI18nResponses() } =
      options;

    // Create a mock service with all required methods
    const mockProductService = {
      createWithFile: jest.fn(),
      findAllWithFiles: jest.fn(),
      findByIdWithFile: jest.fn(),
      updateWithFile: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findByCategory: jest.fn(),
      getLowStockProducts: jest.fn(),
      bulkUpdateStock: jest.fn(),
      getProductStats: jest.fn(),
      advancedSearch: jest.fn(),
    };

    const mockI18nService = {
      translate: jest.fn().mockImplementation((key: string, options?: any) => {
        const _lang = options?.lang || 'en';
        const args = options?.args || {};

        if ((customI18nResponses as Record<string, string>)[key]) {
          let message = (customI18nResponses as Record<string, string>)[key];

          // Replace placeholders
          if (args) {
            Object.keys(args).forEach((argKey) => {
              message = message.replace(`{${argKey}}`, args[argKey]);
              message = message.replace(`{{${argKey}}}`, args[argKey]);
            });
          }

          return message;
        }

        return `Translated: ${key}`;
      }),
    };

    const moduleBuilder = await import('@nestjs/testing').then((testing) =>
      testing.Test.createTestingModule({
        controllers: [ProductController],
        providers: [
          {
            provide: ProductService,
            useValue: mockProductService,
          },
          {
            provide: I18nService,
            useValue: mockI18nService,
          },
        ],
      }),
    );

    return {
      module: await moduleBuilder.compile(),
      mocks: {
        productService: mockProductService,
        i18nService: mockI18nService,
      },
    };
  }
}

/**
 * Common test setup helper
 */
export class TestSetupHelper {
  /**
   * Setup common spies and mocks
   */
  static setupCommonSpies(_mocks: any) {
    // Setup console.log spy to avoid test output noise
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    return {
      consoleSpy: console.log,
      errorSpy: console.error,
      warnSpy: console.warn,
    };
  }

  /**
   * Cleanup spies after tests
   */
  static cleanupSpies() {
    jest.restoreAllMocks();
  }

  /**
   * Setup database transaction mocks
   */
  static setupTransactionMocks(mockKnex: any) {
    const transaction = ProductTestUtils.createMockTransaction();

    mockKnex.transaction.mockResolvedValue(transaction);

    // Setup transaction methods for different tables
    (transaction as any).mockImplementation = jest
      .fn()
      .mockImplementation((tableName) => {
        if (tableName === 'products') {
          return {
            ...transaction,
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([{ id: 'product-id' }]),
          };
        }
        if (tableName === 'files') {
          return {
            ...transaction,
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([{ id: 'file-id' }]),
          };
        }
        return transaction;
      });

    return transaction;
  }

  /**
   * Setup file system mocks for file upload tests
   */
  static setupFileSystemMocks() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
    jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
    jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {});

    return {
      existsSyncSpy: fs.existsSync,
      writeFileSyncSpy: fs.writeFileSync,
      unlinkSyncSpy: fs.unlinkSync,
      mkdirSyncSpy: fs.mkdirSync,
    };
  }
}

/**
 * Test data factory with pre-configured scenarios
 */
export class TestDataFactory {
  /**
   * Create test data for CRUD operations
   */
  static createCrudTestData() {
    return {
      createData: ProductTestUtils.createValidCreateDto({
        name: 'CRUD Test Product',
        price: 199.99,
        stock_quantity: 100,
      }),
      updateData: ProductTestUtils.createValidUpdateDto({
        name: 'Updated CRUD Product',
        price: 249.99,
      }),
      productId: '123e4567-e89b-12d3-a456-426614174000',
      file: ProductTestUtils.createMockFile(),
    };
  }

  /**
   * Create test data for validation scenarios
   */
  static createValidationTestData() {
    return {
      validData: ProductTestUtils.createValidCreateDto(),
      missingName: ProductTestUtils.createInvalidCreateDto('missingName'),
      negativePrice: ProductTestUtils.createInvalidCreateDto('negativePrice'),
      negativeStock: ProductTestUtils.createInvalidCreateDto('negativeStock'),
      longName: ProductTestUtils.createInvalidCreateDto('longName'),
    };
  }

  /**
   * Create test data for search and filtering
   */
  static createSearchTestData() {
    const products = [
      ProductTestUtils.createMockProduct({
        name: 'iPhone 15 Pro',
        category: 'Electronics',
        price: 999.99,
        stock_quantity: 50,
      }),
      ProductTestUtils.createMockProduct({
        name: 'Samsung Galaxy S24',
        category: 'Electronics',
        price: 899.99,
        stock_quantity: 30,
      }),
      ProductTestUtils.createMockProduct({
        name: 'MacBook Pro',
        category: 'Computers',
        price: 2499.99,
        stock_quantity: 10,
      }),
    ];

    return {
      products,
      filters: ProductTestUtils.createTestFilters(),
      pagination: ProductTestUtils.createTestPagination(),
    };
  }

  /**
   * Create test data for error scenarios
   */
  static createErrorTestData() {
    return {
      errors: ProductTestUtils.createTestErrors(),
      invalidIds: ['invalid-uuid', '', null, undefined],
      validId: '123e4567-e89b-12d3-a456-426614174000',
    };
  }
}
