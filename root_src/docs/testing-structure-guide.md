# 🧪 Test Organization Guide

## 📁 **Hybrid Test Structure (Best Practice)**

This project follows the **hybrid approach** for test organization, providing clear separation while maintaining proximity to source code.

### **Directory Structure**

```typescript
src/domains/products/
├── __mocks__/                           ← Manual mocks for Jest
│   ├── product.service.ts               ← Mock ProductService
│   ├── database.service.ts              ← Mock DatabaseService
│   └── file-utils.ts                    ← Mock file operations
├── __tests__/                           ← Unit tests
│   ├── product.service.spec.ts          ← Service unit tests
│   ├── product.controller.spec.ts       ← Controller unit tests
│   └── utils/                           ← Test utilities
│       ├── product-test-utils.ts        ← Mock factories
│       ├── test-module-config.ts        ← Module setup
│       ├── test-utils-examples.spec.ts  ← Usage examples
│       └── index.ts                     ← Barrel exports
├── dto/                                 ← Data Transfer Objects
├── constants/                           ← Domain constants
├── product.controller.ts                ← HTTP controller
├── product.service.ts                   ← Business logic
└── products.module.ts                   ← NestJS module

test/
├── integration/                         ← Integration tests
│   └── products.integration.spec.ts     ← HTTP endpoint tests
└── e2e/                                ← End-to-end tests
    └── (future E2E tests)               ← Full workflow tests
```

## 🎯 **Test Types & Purposes**

### **1. Unit Tests (`__tests__/`)**

- **Purpose**: Test individual components in isolation
- **Speed**: Fast (milliseconds)
- **Dependencies**: All mocked
- **Run with**: `npm run test:unit`

```typescript
// Example: src/domains/products/__tests__/product.service.spec.ts
describe('ProductService', () => {
  it('should create product successfully', async () => {
    // Test individual method with mocked dependencies
  });
});
```

});

### **2. Integration Tests (`test/integration/`)**

- **Purpose**: Test HTTP endpoints with real NestJS app
- **Speed**: Medium (seconds)
- **Dependencies**: Some real, some mocked
- **Run with**: `npm run test:integration`

```typescript
// Example: test/integration/products.integration.spec.ts
describe('Products Integration', () => {
  it('should create product via POST /v1/products', async () => {
    // Test full HTTP request/response cycle
  });
});
```

### **3. E2E Tests (`test/e2e/`)**

- **Purpose**: Test complete user workflows
- **Speed**: Slow (minutes)
- **Dependencies**: Real database, real services
- **Run with**: `npm run test:e2e`

### **4. Mock Implementations (`__mocks__/`)**

- **Purpose**: Reusable mocks for consistent testing
- **Usage**: Automatically loaded by Jest with `jest.mock()`

## 🚀 **Available Scripts**

```bash
# Run all tests
npm test

# Run only unit tests (fast)
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only E2E tests
npm run test:e2e

# Run unit tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:cov

# Run specific product tests
npm run test:products
```

## 📋 **Test Results Summary**

### **✅ Current Test Status**

- **Unit Tests**: 66/66 passing (100%)
  - ProductService: 23 tests
  - ProductController: 29 tests
  - Test Utils Examples: 14 tests

- **Integration Tests**: 26/26 passing (100%)
  - HTTP endpoints, file uploads, error handling

- **🏆 Total**: 92/92 tests passing (100%)

## 🔧 **Key Features**

### **✅ Benefits of This Structure**

1. **Clear Separation**: Unit vs Integration vs E2E
2. **Domain Proximity**: Tests close to source code
3. **Reusable Mocks**: Centralized mock implementations
4. **Selective Execution**: Run only the tests you need
5. **Fast Feedback**: Unit tests run quickly
6. **Comprehensive Coverage**: All test types included

### **🎯 Mock Strategy**

- **`__mocks__/`**: Reusable mocks for external dependencies
- **`__tests__/utils/`**: Test utilities and factories
- **Automatic Loading**: Jest loads mocks with `jest.mock()`

### **📊 Coverage Configuration**

- **Includes**: All source code in `src/`
- **Excludes**: Test files, mocks, type definitions
- **Output**: HTML and terminal coverage reports

## 🏗️ **Best Practices Applied**

1. **Test Organization**: Hybrid approach for maintainability
2. **Mock Management**: Centralized, reusable mocks
3. **Type Safety**: Full TypeScript support in tests
4. **Performance**: Fast unit tests, comprehensive integration tests
5. **Documentation**: Examples and usage guides included

This structure scales well as your application grows and provides excellent developer experience with fast feedback loops and comprehensive test coverage.
