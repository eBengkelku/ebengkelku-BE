# Products Domain - Unit Tests

This directory contains comprehensive unit tests for the Products domain, including service layer, controller layer, integration tests, and test utilities.

## 📁 Test Files Structure

```text
src/domains/products/
├── __tests__/                        # Unit tests directory
│   ├── product.service.spec.ts       # Unit tests for ProductService
│   ├── product.controller.spec.ts    # Unit tests for ProductController
│   └── utils/                        # Test utilities and helpers
│       ├── index.ts                  # Export barrel for test utilities
│       ├── product-test-utils.ts     # Test utilities and mock factories
│       ├── test-module-config.ts     # Test module configuration helpers
│       └── test-utils-examples.spec.ts # Examples showing how to use test utilities
├── __mocks__/                        # Mock implementations
│   ├── database.service.ts           # Database service mocks
│   ├── file-utils.ts                 # File utility mocks
│   └── product.service.ts            # Product service mocks
└── TESTING.md                        # This documentation

test/
├── integration/
│   └── products.integration.spec.ts  # Integration tests for Products domain
└── e2e/                              # End-to-end tests (if any)
```

## 🧪 Test Coverage

### ProductService Tests (`__tests__/product.service.spec.ts`)

**Core CRUD Operations:**

- ✅ `create()` - Product creation with validation
- ✅ `update()` - Product updates with business rules
- ✅ `findByIdWithFile()` - Find product with file information
- ✅ `findAllWithFiles()` - Paginated listing with file information

**Business Logic Methods:**

- ✅ `findByCategory()` - Category-based filtering with price/stock filters
- ✅ `getLowStockProducts()` - Low stock threshold filtering
- ✅ `bulkUpdateStock()` - Bulk stock quantity updates with transactions
- ✅ `getProductStats()` - Product statistics and analytics
- ✅ `advancedSearch()` - Complex search with multiple filters

**File Handling Methods:**

- ✅ `createWithFile()` - Product creation with required image upload
- ✅ `updateWithFile()` - Product updates with optional image replacement

**Error Scenarios:**

- ✅ Negative price validation
- ✅ Negative stock quantity validation
- ✅ Database transaction rollbacks
- ✅ File upload errors
- ✅ Not found scenarios

### ProductController Tests (`__tests__/product.controller.spec.ts`)

**HTTP Endpoints:**

- ✅ `POST /v1/products` - Create product with required image
- ✅ `GET /v1/products` - List products with pagination and filters
- ✅ `GET /v1/products/:id` - Get single product by ID
- ✅ `PUT /v1/products/:id` - Update product with optional image

**Request Validation:**

- ✅ Required field validation (name, price, stock_quantity, image)
- ✅ Data type validation (price as number, etc.)
- ✅ UUID format validation for product IDs
- ✅ File upload validation

**Response Formatting:**

- ✅ Success response structure
- ✅ Error response structure
- ✅ Pagination metadata
- ✅ Internationalization (i18n) support

**Edge Cases:**

- ✅ Missing image file (BadRequestException)
- ✅ Product not found (NotFoundException)
- ✅ Large file uploads
- ✅ Different image formats (JPEG, PNG, GIF)
- ✅ Extreme pagination values

### Integration Tests (`../../test/integration/products.integration.spec.ts`)

**Full Request-Response Cycle:**

- ✅ End-to-end product creation with file upload
- ✅ End-to-end product retrieval with file information
- ✅ End-to-end product updates with file replacement
- ✅ Complete validation pipeline

**HTTP Layer Testing:**

- ✅ Multipart form-data handling
- ✅ Query parameter parsing
- ✅ Request body validation
- ✅ HTTP status codes
- ✅ Response headers

**Performance & Load:**

- ✅ Concurrent request handling
- ✅ Sequential request processing
- ✅ Large file upload handling
- ✅ Request timeout scenarios

**Error Integration:**

- ✅ Database connection errors
- ✅ Validation pipeline errors
- ✅ File system errors
- ✅ Service layer error propagation

## 🛠️ Test Utilities

### Mock Directory (`__mocks__/`)

The `__mocks__` directory contains Jest mock implementations for external dependencies:

```typescript
// __mocks__/database.service.ts - Mock database operations
export const mockDatabaseService = {
  getKnex: jest.fn(),
  // ... other database methods
};

// __mocks__/file-utils.ts - Mock file operations
export const mockFileUtils = {
  saveFile: jest.fn(),
  deleteFile: jest.fn(),
  // ... other file methods
};

// __mocks__/product.service.ts - Mock service for controller tests
export const mockProductService = {
  createWithFile: jest.fn(),
  findAllWithFiles: jest.fn(),
  // ... other service methods
};
```

### ProductTestUtils Class

**Mock Data Creation:**

```typescript
// Import from the new structure
import { ProductTestUtils } from './__tests__/utils/product-test-utils';
import { MockFactory } from './__tests__/utils';

// Create single mock product
const product = ProductTestUtils.createMockProduct({ name: 'Custom Product' });

// Create multiple products
const products = ProductTestUtils.createMockProducts(5);

// Create valid DTOs
const createDto = ProductTestUtils.createValidCreateDto();
const updateDto = ProductTestUtils.createValidUpdateDto();

// Create invalid data for validation testing
const invalidDto = ProductTestUtils.createInvalidCreateDto('negativePrice');
```

**Mock Files and Responses:**

```typescript
// Create mock file uploads
const file = ProductTestUtils.createMockFile();
const files = ProductTestUtils.createMockFiles(); // jpeg, png, gif, large, small

// Create service responses
const successResponse = ProductTestUtils.createMockServiceResponse('success');
const errorResponse = ProductTestUtils.createMockServiceResponse('error');

// Create paginated responses
const paginatedResponse = ProductTestUtils.createMockPaginatedResponse(
  products,
  2,
  10,
);
```

**Database Mocking:**

```typescript
// Create mock Knex instance
const mockKnex = ProductTestUtils.createMockKnex(mockData);

// Create mock transaction
const transaction = ProductTestUtils.createMockTransaction();

// Create query builder
const queryBuilder = ProductTestUtils.createMockQueryBuilder(mockData);
```

### MockFactory (Shorthand Access)

```typescript
import { MockFactory } from './__tests__/utils';

const product = MockFactory.product();
const products = MockFactory.products(3);
const createDto = MockFactory.createDto();
const file = MockFactory.file();
const response = MockFactory.response('success');
```

### Test Module Configuration

```typescript
import { ProductTestModule } from './__tests__/utils/test-module-config';

// Create full testing module
const { module, mocks } = await ProductTestModule.createTestingModule({
  mockData: customProducts,
  customConfig: customConfig,
});

// Create service-only module
const { module, mocks } = await ProductTestModule.createServiceTestingModule();

// Create controller-only module
const { module, mocks } =
  await ProductTestModule.createControllerTestingModule();
```

## 🚀 Running Tests

### Run All Product Tests

```bash
npm test -- --testPathPattern=products
```

### Run Specific Test Files

```bash
# Service tests only
npm test -- __tests__/product.service.spec.ts

# Controller tests only
npm test -- __tests__/product.controller.spec.ts

# Integration tests only
npm test -- test/integration/products.integration.spec.ts

# Test utilities examples
npm test -- __tests__/utils/test-utils-examples.spec.ts
```

### Run Tests with Coverage

```bash
npm test -- --coverage --testPathPattern=products
```

### Run Tests in Watch Mode

```bash
npm test -- --watch --testPathPattern=products
```

## 📊 Coverage Goals

| Component         | Target Coverage | Current Status |
| ----------------- | --------------- | -------------- |
| ProductService    | 95%+            | ✅ Achieved    |
| ProductController | 90%+            | ✅ Achieved    |
| Integration Tests | 85%+            | ✅ Achieved    |
| Error Scenarios   | 100%            | ✅ Achieved    |

## 🧩 Test Patterns Used

### 1. Arrange-Act-Assert (AAA)

```typescript
it('should create product successfully', async () => {
  // Arrange
  const createDto = MockFactory.createDto();
  const mockFile = MockFactory.file();

  // Act
  const result = await service.createWithFile(createDto, mockFile);

  // Assert
  expect(result.success).toBe(true);
  expect(result.data.id).toBeDefined();
});
```

### 2. Mock Isolation

```typescript
beforeEach(() => {
  mockProductService = {
    createWithFile: jest.fn(),
    findAllWithFiles: jest.fn(),
    // ... other methods
  };
});
```

### 3. Data-Driven Testing

```typescript
describe.each([
  ['jpeg', 'image/jpeg'],
  ['png', 'image/png'],
  ['gif', 'image/gif'],
])('File format: %s', (format, mimetype) => {
  it(`should handle ${format} files`, async () => {
    // Test implementation
  });
});
```

### 4. Error Scenario Testing

```typescript
it('should handle database errors gracefully', async () => {
  mockService.method.mockRejectedValue(new Error('Database error'));

  await expect(controller.method()).rejects.toThrow('Database error');
});
```

## 🔧 Best Practices Implemented

1. **Comprehensive Mocking**: All external dependencies are properly mocked
2. **Test Isolation**: Each test is independent and can run in any order
3. **Realistic Data**: Test data closely resembles production data
4. **Edge Case Coverage**: Tests cover boundary conditions and error scenarios
5. **Performance Awareness**: Tests include performance and load scenarios
6. **Maintainable Code**: Test utilities reduce duplication and improve readability

## 📝 Adding New Tests

When adding new functionality to the Products domain:

1. **Add Service Tests**: Test business logic in `__tests__/product.service.spec.ts`
2. **Add Controller Tests**: Test HTTP layer in `__tests__/product.controller.spec.ts`
3. **Add Integration Tests**: Test end-to-end functionality in `../../test/integration/products.integration.spec.ts`
4. **Update Test Utilities**: Add new mock factories in `__tests__/utils/product-test-utils.ts`
5. **Update Mocks**: Add new mocks in `__mocks__/` directory if needed
6. **Update Documentation**: Update this README with new test coverage

### Example: Adding a New Method

```typescript
// 1. Add service test in __tests__/product.service.spec.ts
describe('newMethod', () => {
  it('should handle new functionality', async () => {
    // Test implementation
  });
});

// 2. Add controller test in __tests__/product.controller.spec.ts
describe('POST /v1/products/new-endpoint', () => {
  it('should call service method correctly', async () => {
    // Test implementation
  });
});

// 3. Update test utilities in __tests__/utils/product-test-utils.ts
static createNewMockData() {
  return {
    // New mock data structure
  };
}

// 4. Add integration test in ../../test/integration/products.integration.spec.ts
describe('New Feature Integration', () => {
  it('should work end-to-end', async () => {
    // Integration test implementation
  });
});
```

## 🐛 Debugging Tests

### Common Issues and Solutions

1. **Mock Not Working**: Ensure all dependencies are properly mocked
2. **Async Issues**: Use `await` for all async operations
3. **Test Isolation**: Clear mocks between tests with `beforeEach`
4. **File Upload Tests**: Use proper multipart form data mocking

### Debug Commands

```bash
# Run with debug output
npm test -- --verbose --testPathPattern=products

# Run single test with full output
npm test -- --testNamePattern="specific test name" --verbose
```

## 📚 References

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
