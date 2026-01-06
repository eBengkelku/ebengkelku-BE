import {
  ProductTestUtils,
  MockFactory,
  TEST_CONSTANTS,
} from './product-test-utils';

/**
 * Example test demonstrating the usage of test utilities
 * This file shows how to use the ProductTestUtils in your test files
 */

describe('Product Test Utils Usage Examples', () => {
  describe('Using MockFactory', () => {
    it('should create mock products easily', () => {
      const product = MockFactory.product();
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product.price).toBeGreaterThan(0);
    });

    it('should create multiple products', () => {
      const products = MockFactory.products(5);
      expect(products).toHaveLength(5);
      expect(products[0].name).toBe('Test Product 1');
      expect(products[4].name).toBe('Test Product 5');
    });

    it('should create valid DTOs', () => {
      const createDto = MockFactory.createDto();
      expect(createDto.name).toBeDefined();
      expect(createDto.price).toBeGreaterThan(0);

      const updateDto = MockFactory.updateDto();
      expect(updateDto.name).toBe('Updated Product');
    });

    it('should create mock files', () => {
      const file = MockFactory.file();
      expect(file.originalname).toBe('test-image.jpg');
      expect(file.mimetype).toBe('image/jpeg');

      const files = MockFactory.files();
      expect(files.jpeg.mimetype).toBe('image/jpeg');
      expect(files.png.mimetype).toBe('image/png');
    });
  });

  describe('Using ProductTestUtils directly', () => {
    it('should create customized mock data', () => {
      const expensiveProduct = ProductTestUtils.createMockProduct({
        name: 'Luxury Item',
        price: 9999.99,
        category: 'Luxury',
      });

      expect(expensiveProduct.name).toBe('Luxury Item');
      expect(expensiveProduct.price).toBe(9999.99);
      expect(expensiveProduct.category).toBe('Luxury');
    });

    it('should create invalid data for validation testing', () => {
      const invalidDto =
        ProductTestUtils.createInvalidCreateDto('negativePrice');
      expect(invalidDto.price).toBeLessThan(0);

      const missingNameDto =
        ProductTestUtils.createInvalidCreateDto('missingName');
      expect(missingNameDto.name).toBeUndefined();
    });

    it('should create mock responses', () => {
      const successResponse =
        ProductTestUtils.createMockServiceResponse('success');
      expect(successResponse.success).toBe(true);

      const errorResponse = ProductTestUtils.createMockServiceResponse('error');
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(400);
    });

    it('should create paginated responses', () => {
      const products = ProductTestUtils.createMockProducts(25);
      const paginatedResponse = ProductTestUtils.createMockPaginatedResponse(
        products,
        2,
        10,
      );

      expect(paginatedResponse.meta.current_page).toBe(2);
      expect(paginatedResponse.meta.per_page).toBe(10);
      expect(paginatedResponse.meta.total).toBe(25);
      expect(paginatedResponse.meta.last_page).toBe(3);
    });
  });

  describe('Using Test Constants', () => {
    it('should provide consistent test values', () => {
      expect(TEST_CONSTANTS.VALID_UUID).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
      expect(TEST_CONSTANTS.DEFAULT_PAGINATION.page).toBe(1);
      expect(TEST_CONSTANTS.SUPPORTED_IMAGE_TYPES).toContain('image/jpeg');
    });
  });

  describe('Mock Knex and Database', () => {
    it('should create mock knex with query builder', () => {
      const mockData = ProductTestUtils.createMockProducts(3);
      const mockKnex = ProductTestUtils.createMockKnex(mockData);

      expect(typeof mockKnex).toBe('function');
      expect((mockKnex as any).transaction).toBeDefined();
      expect((mockKnex as any).fn.now).toBeDefined();
    });

    it('should create mock transaction', () => {
      const transaction = ProductTestUtils.createMockTransaction();

      expect(transaction.commit).toBeDefined();
      expect(transaction.rollback).toBeDefined();
      expect(transaction.insert).toBeDefined();
    });
  });

  describe('Cleanup Helper', () => {
    it('should track and cleanup test data', async () => {
      const cleanup = ProductTestUtils.createCleanupHelper();

      cleanup.addId('test-id-1');
      cleanup.addId('test-id-2');

      expect(cleanup.getIds()).toEqual(['test-id-1', 'test-id-2']);

      cleanup.clear();
      expect(cleanup.getIds()).toEqual([]);
    });
  });

  describe('Test Filters and Pagination', () => {
    it('should provide various filter combinations', () => {
      const filters = ProductTestUtils.createTestFilters();

      expect(filters.basic).toEqual({
        category: 'Electronics',
        name: 'iPhone',
      });

      expect(filters.withPrice).toHaveProperty('minPrice');
      expect(filters.withPrice).toHaveProperty('maxPrice');

      expect(filters.complex).toHaveProperty('category');
      expect(filters.complex).toHaveProperty('minPrice');
      expect(filters.complex).toHaveProperty('inStock');
    });

    it('should provide pagination test cases', () => {
      const pagination = ProductTestUtils.createTestPagination();

      expect(pagination.default).toEqual({ page: 1, limit: 10 });
      expect(pagination.large.limit).toBe(100);
      expect(pagination.edge.page).toBe(999);
    });
  });
});
