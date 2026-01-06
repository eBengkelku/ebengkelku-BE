import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '../database/database.module';
import { ProductsEnhancedService } from '../examples/products/products-laravel.service';
import { ProductsLaravelController } from '../examples/products/products-laravel.controller';
import { I18nService } from 'nestjs-i18n';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from '../config/database.config';

describe('Laravel Pattern Implementation Test', () => {
  let app: TestingModule;
  let productsService: ProductsEnhancedService;
  let productsController: ProductsLaravelController;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [databaseConfig],
          isGlobal: true,
        }),
        DatabaseModule,
      ],
      providers: [
        ProductsEnhancedService,
        {
          provide: I18nService,
          useValue: {
            t: (key: string, _options?: any) => `Translated: ${key}`,
          },
        },
      ],
      controllers: [ProductsLaravelController],
    }).compile();

    productsService = app.get<ProductsEnhancedService>(ProductsEnhancedService);
    productsController = app.get<ProductsLaravelController>(
      ProductsLaravelController,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Base Service Functionality (Laravel MyModel equivalent)', () => {
    it('should create a product (equivalent to doInsert)', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product for Laravel pattern',
        price: 99.99,
        stock_quantity: 100,
        category: 'Testing',
      };

      const created = await productsService.create(productData);

      expect(created).toBeDefined();
      expect(created.name).toBe(productData.name);
      expect(created.id).toBeDefined();
      expect(created.created_at).toBeDefined();
    });

    it('should find all products with pagination (equivalent to getList)', async () => {
      const result = await productsService.findAll({ page: 1, limit: 10 });

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should search products with filters (equivalent to searchByKeywords)', async () => {
      const searchDto = {
        filters: [['category', 'like', 'Testing']] as [string, string, any][],
      };

      const result = await productsService.search(searchDto, {
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
    });

    it('should get combo data (equivalent to combo)', async () => {
      const combo = await productsService.getCombo('Test');

      expect(combo).toBeInstanceOf(Array);
      if (combo.length > 0) {
        expect(combo[0]).toHaveProperty('id');
        expect(combo[0]).toHaveProperty('text');
      }
    });

    it('should find product by category (custom method)', async () => {
      const result = await productsService.findByCategory('Testing', {
        page: 1,
        limit: 10,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
    });

    it('should update product (equivalent to doUpdate)', async () => {
      // First create a product
      const productData = {
        name: 'Product to Update',
        price: 50.0,
        stock_quantity: 50,
      };
      const created = await productsService.create(productData);

      // Then update it
      const updateData = { name: 'Updated Product Name' };
      const updated = await productsService.update(created.id, updateData);

      expect(updated.name).toBe('Updated Product Name');
      expect(updated.updated_at).toBeDefined();
    });

    it('should soft delete product (equivalent to doDelete)', async () => {
      // First create a product
      const productData = {
        name: 'Product to Delete',
        price: 25.0,
        stock_quantity: 25,
      };
      const created = await productsService.create(productData);

      // Then delete it
      await productsService.remove(created.id);

      // Verify it's soft deleted (should throw NotFoundException)
      await expect(productsService.findOne(created.id)).rejects.toThrow();
    });
  });

  describe('Controller Endpoints (Laravel Controller equivalent)', () => {
    it('should have all Laravel-style endpoints available', () => {
      // Check that controller methods exist
      expect(productsController.findAll).toBeDefined();
      expect(productsController.findOne).toBeDefined();
      expect(productsController.create).toBeDefined();
      expect(productsController.update).toBeDefined();
      expect(productsController.remove).toBeDefined();
      expect(productsController.search).toBeDefined();
      expect(productsController.getCombo).toBeDefined();
      expect(productsController.getRules).toBeDefined();
    });

    it('should return validation rules', async () => {
      const rules = await productsController.getRules();

      expect(rules).toBeDefined();
      expect(typeof rules).toBe('object');
    });
  });

  describe('Laravel Pattern Features', () => {
    it('should support soft deletes', async () => {
      const service = productsService as any;
      expect(service.config.timestampColumns.deleted).toBe('deleted_at');
    });

    it('should have proper table configuration', async () => {
      const service = productsService as any;
      expect(service.config.tableName).toBe('products');
      expect(service.config.primaryKey).toBe('id');
      expect(service.config.descColumns).toContain('name');
    });

    it('should have validation rules defined', async () => {
      const rules = productsService.getValidationRules();
      expect(rules).toHaveProperty('name');
      expect(rules).toHaveProperty('price');
      expect(rules).toHaveProperty('stock_quantity');
    });

    it('should support custom business logic hooks', async () => {
      // The beforeCreate, afterCreate, etc. hooks should be available
      const service = productsService as any;
      expect(typeof service.beforeCreate).toBe('function');
      expect(typeof service.afterCreate).toBe('function');
      expect(typeof service.beforeUpdate).toBe('function');
      expect(typeof service.afterUpdate).toBe('function');
    });
  });
});

/**
 * Integration Test for Laravel Pattern Workflow
 */
describe('Laravel Pattern Integration Test', () => {
  let service: ProductsEnhancedService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [databaseConfig],
          isGlobal: true,
        }),
        DatabaseModule,
      ],
      providers: [
        ProductsEnhancedService,
        {
          provide: I18nService,
          useValue: {
            t: (key: string) => `Translated: ${key}`,
          },
        },
      ],
    }).compile();

    service = module.get<ProductsEnhancedService>(ProductsEnhancedService);
  });

  it('should complete full CRUD workflow like Laravel', async () => {
    // CREATE (equivalent to Laravel doInsert)
    const createData = {
      name: 'Integration Test Product',
      description: 'Full workflow test',
      price: 199.99,
      stock_quantity: 50,
      category: 'Integration',
    };

    const created = await service.create(createData);
    expect(created.id).toBeDefined();
    expect(created.name).toBe(createData.name);

    // READ (equivalent to Laravel getById)
    const found = await service.findOne(created.id);
    expect(found.name).toBe(createData.name);

    // UPDATE (equivalent to Laravel doUpdate)
    const updatedProduct = await service.update(created.id, {
      name: 'Updated Integration Product',
      price: 299.99,
    });
    expect(updatedProduct.name).toBe('Updated Integration Product');
    expect(updatedProduct.price).toBe(299.99);

    // SEARCH (equivalent to Laravel searchByKeywords)
    const searchResult = await service.search(
      { filters: [['name', 'like', 'Integration']] },
      { page: 1, limit: 10 },
    );
    expect(searchResult.data.some((p) => p.id === created.id)).toBe(true);

    // DELETE (equivalent to Laravel doDelete with soft delete)
    await service.remove(created.id);

    // Verify soft delete
    await expect(service.findOne(created.id)).rejects.toThrow();
  });
});
