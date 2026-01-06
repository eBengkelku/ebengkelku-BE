# Domain-Specific Error Codes Guide

## 📋 Overview

This guide explains how to create and use **domain-specific error codes** in your NestJS application. Domain-specific error codes allow each domain (Products, Users, Orders, etc.) to define custom error codes that are specific to their business logic.

## 🎯 Why Domain-Specific Error Codes?

### Problems with Only Common Error Codes:

- ❌ Generic codes like `ERR_1000` don't convey business context
- ❌ Frontend can't provide specific UI/UX for different business scenarios
- ❌ Hard to track and analyze specific business errors
- ❌ Difficult to provide recovery suggestions

### Benefits of Domain-Specific Error Codes:

- ✅ **Business Context**: `PRODUCT_OUT_OF_STOCK` is clearer than `ERR_1009`
- ✅ **Frontend Integration**: Easy to show specific UI based on error code
- ✅ **Analytics**: Track specific business issues (e.g., how often products are out of stock)
- ✅ **Recovery**: Provide actionable suggestions based on error type
- ✅ **Documentation**: Self-documenting error conditions

## 📁 File Structure

```
src/domains/{domain}/
├── errors/
│   ├── index.ts                    # Barrel export
│   └── {domain}-error-codes.ts     # Domain error codes
├── examples/
│   └── using-custom-error-codes.example.ts  # Usage examples
└── ...other domain files
```

## 🏗️ Architecture

### Two-Tier Error Code System:

```
┌─────────────────────────────────────────────┐
│         Common Error Codes                  │
│  (Generic HTTP, Validation, System)         │
│  - src/common/errors/error-codes.ts         │
│  - ERR_1xxx, ERR_2xxx, ERR_3xxx             │
│  - VALIDATION_REQUIRED, etc.                │
└─────────────────────────────────────────────┘
                    ↓ extends
┌─────────────────────────────────────────────┐
│      Domain-Specific Error Codes            │
│  (Business Logic, Domain Rules)             │
│  - src/domains/{domain}/errors/             │
│  - PRODUCT_OUT_OF_STOCK                     │
│  - USER_EMAIL_ALREADY_EXISTS                │
│  - ORDER_PAYMENT_FAILED                     │
└─────────────────────────────────────────────┘
```

## 📝 Step-by-Step Guide

### Step 1: Create Error Codes File

Create `src/domains/{domain}/errors/{domain}-error-codes.ts`:

```typescript
/**
 * {Domain} Error Codes
 */
export const ProductErrorCodes = {
  // Stock & Inventory
  OUT_OF_STOCK: 'PRODUCT_OUT_OF_STOCK',
  INSUFFICIENT_STOCK: 'PRODUCT_INSUFFICIENT_STOCK',

  // Business Rules
  SKU_ALREADY_EXISTS: 'PRODUCT_SKU_ALREADY_EXISTS',
  CANNOT_DELETE_HAS_ORDERS: 'PRODUCT_CANNOT_DELETE_HAS_ORDERS',

  // ... more codes
} as const;

export type ProductErrorCode =
  (typeof ProductErrorCodes)[keyof typeof ProductErrorCodes];

export function isProductErrorCode(code: string): code is ProductErrorCode {
  return Object.values(ProductErrorCodes).includes(code as ProductErrorCode);
}
```

### Step 2: Create Barrel Export

Create `src/domains/{domain}/errors/index.ts`:

```typescript
export * from './{domain}-error-codes';
```

### Step 3: Use in Domain Logic

```typescript
import { ValidationException } from '@/common/exceptions';
import { ProductErrorCodes } from './errors';

export class ProductService {
  validateStock(available: number, requested: number): void {
    if (available < requested) {
      throw new ValidationException('Insufficient stock', [
        {
          code: ProductErrorCodes.INSUFFICIENT_STOCK,
          message: `Only ${available} available`,
          context: { available, requested },
        },
      ]);
    }
  }
}
```

## 🎨 Response Format

### With Custom Error Code:

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Product is out of stock",
  "errors": {
    "stock": {
      "code": "PRODUCT_OUT_OF_STOCK",
      "message": "This product is currently out of stock",
      "value": 0,
      "context": {
        "availableStock": 0,
        "requestedQuantity": 5
      }
    }
  },
  "timestamp": "2025-10-10T09:00:00.000Z",
  "path": "/v1/products/123/purchase"
}
```

## 🌐 Frontend Integration

### React Example:

```typescript
// Error handler based on domain error codes
const handleProductError = (errorResponse: ApiError) => {
  const errors = errorResponse.errors || {};

  for (const [field, error] of Object.entries(errors)) {
    switch (error.code) {
      case 'PRODUCT_OUT_OF_STOCK':
        showNotifyMeButton();
        break;

      case 'PRODUCT_INSUFFICIENT_STOCK':
        suggestReduceQuantity(error.context.availableStock);
        break;

      case 'PRODUCT_DISCONTINUED':
        redirectToSimilarProducts();
        break;

      default:
        showGenericError();
    }
  }
};
```

### Angular Example:

```typescript
// Service method
handleError(error: HttpErrorResponse) {
  const apiError = error.error;

  if (apiError.errors?.stock?.code === 'PRODUCT_OUT_OF_STOCK') {
    this.notificationService.show({
      type: 'warning',
      message: 'Product is out of stock',
      action: 'Notify me when available'
    });
  }
}
```

## 💡 Best Practices

### 1. **Naming Convention**

- ✅ Use `SCREAMING_SNAKE_CASE`
- ✅ Prefix with domain: `PRODUCT_`, `USER_`, `ORDER_`
- ✅ Be specific: `INSUFFICIENT_STOCK` not `STOCK_ERROR`
- ❌ Avoid generic names: `ERROR_1`, `FAILED`

### 2. **Organization**

- Group related codes together
- Add comments for each section
- Document each code with JSDoc

### 3. **Error Context**

- Always include relevant context data
- Make errors actionable
- Provide recovery information

### 4. **Type Safety**

```typescript
// ✅ Good - Type safe
throw new ValidationException('...', [
  {
    code: ProductErrorCodes.OUT_OF_STOCK,
    message: '...',
  },
]);

// ❌ Bad - String literals
throw new ValidationException('...', [
  {
    code: 'PRODUCT_OUT_OF_STOCK', // No autocomplete, prone to typos
    message: '...',
  },
]);
```

### 5. **Avoid Duplication**

- Use common codes for generic errors
- Use domain codes for business-specific errors

```typescript
// ❌ Don't create domain-specific versions of common errors
PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND'; // Use ErrorCodes.NOT_FOUND instead

// ✅ Create domain-specific business errors
PRODUCT_OUT_OF_STOCK: 'PRODUCT_OUT_OF_STOCK'; // Business logic
```

## 📊 Error Code Categories

### Common Error Codes (src/common/errors/)

- **1xxx**: HTTP/General (`ERR_1000` - `ERR_1999`)
- **2xxx**: Validation (`VALIDATION_REQUIRED`, etc.)
- **3xxx**: Business Logic (generic)

### Domain Error Codes (src/domains/{domain}/errors/)

- **Descriptive Names**: `PRODUCT_OUT_OF_STOCK`
- **Business Context**: `USER_EMAIL_ALREADY_EXISTS`
- **Domain-Specific**: `ORDER_PAYMENT_FAILED`

## 🔍 Examples by Use Case

### 1. Stock Management

```typescript
ProductErrorCodes.OUT_OF_STOCK;
ProductErrorCodes.INSUFFICIENT_STOCK;
ProductErrorCodes.RESERVED;
```

### 2. Unique Constraints

```typescript
ProductErrorCodes.SKU_ALREADY_EXISTS;
ProductErrorCodes.BARCODE_ALREADY_EXISTS;
UserErrorCodes.EMAIL_ALREADY_EXISTS;
```

### 3. Business Rules

```typescript
ProductErrorCodes.CANNOT_DELETE_HAS_ORDERS;
ProductErrorCodes.REQUIRES_APPROVAL;
OrderErrorCodes.PAYMENT_FAILED;
```

### 4. Permissions

```typescript
ProductErrorCodes.CATEGORY_MIGRATION_FORBIDDEN;
UserErrorCodes.INSUFFICIENT_PERMISSIONS;
```

## 🧪 Testing

### Test Error Codes

```typescript
describe('ProductService', () => {
  it('should throw OUT_OF_STOCK error when stock is zero', async () => {
    const product = { stock: 0 };

    try {
      await service.purchase(product, 1);
      fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationException);
      expect(error.errors[0].code).toBe(ProductErrorCodes.OUT_OF_STOCK);
    }
  });
});
```

## 📚 Migration Guide

### From Generic Codes:

```typescript
// ❌ Before
throw new ValidationException('Out of stock', [
  {
    code: 'ERR_1009', // Generic conflict
    message: 'Product unavailable',
  },
]);

// ✅ After
throw new ValidationException('Out of stock', [
  {
    code: ProductErrorCodes.OUT_OF_STOCK, // Domain-specific
    message: 'Product is currently out of stock',
    context: { availableStock: 0 },
  },
]);
```

## 🔗 Related Documentation

- [Standardized Response Format](../STANDARDIZED_RESPONSE_FORMAT_SOLUTION.md)
- [Error Handling Guide](./ERROR_HANDLING_GUIDE.md)
- [Common Error Codes](../src/common/errors/error-codes.ts)
- [Usage Examples](../src/domains/products/examples/using-custom-error-codes.example.ts)

## 🎓 Summary

✅ **DO**:

- Create domain-specific error codes in `src/domains/{domain}/errors/`
- Use descriptive, business-focused names
- Provide rich context with errors
- Document each error code
- Use TypeScript for type safety

❌ **DON'T**:

- Duplicate common error codes in domain
- Use string literals instead of constants
- Create too granular codes (one per field)
- Mix HTTP codes with business codes
- Forget to export from barrel file

---

**Next Steps**:

1. Review existing error codes in your domain
2. Identify business-specific error scenarios
3. Create domain error code files
4. Update services to use new codes
5. Update frontend error handling
6. Add tests for new error codes
