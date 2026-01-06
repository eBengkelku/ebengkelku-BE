# Quick Start: Domain-Specific Error Codes

## 🚀 Quick Setup (5 Minutes)

### 1. Create Error Codes File

```bash
# Create errors directory
mkdir -p src/domains/your-domain/errors

# Create error codes file
touch src/domains/your-domain/errors/your-domain-error-codes.ts
```

### 2. Define Your Error Codes

```typescript
// src/domains/your-domain/errors/your-domain-error-codes.ts

export const YourDomainErrorCodes = {
  // Define your business-specific error codes
  CUSTOM_BUSINESS_ERROR: 'YOUR_DOMAIN_CUSTOM_BUSINESS_ERROR',
  ANOTHER_ERROR: 'YOUR_DOMAIN_ANOTHER_ERROR',
} as const;

export type YourDomainErrorCode =
  (typeof YourDomainErrorCodes)[keyof typeof YourDomainErrorCodes];
```

### 3. Create Barrel Export

```typescript
// src/domains/your-domain/errors/index.ts

export * from './your-domain-error-codes';
```

### 4. Use in Your Code

```typescript
import { ValidationException } from '@/common/exceptions';
import { YourDomainErrorCodes } from './errors';

// Throw error with custom code
throw new ValidationException('Your error message', [
  {
    code: YourDomainErrorCodes.CUSTOM_BUSINESS_ERROR,
    message: 'Detailed error message',
    context: {
      /* additional data */
    },
  },
]);
```

## 📋 Common Patterns

### Pattern 1: Validation Error

```typescript
throw new ValidationException('Validation failed', [
  {
    property: 'fieldName',
    value: invalidValue,
    code: YourDomainErrorCodes.CUSTOM_ERROR,
    message: 'User-friendly message',
    context: {
      /* constraints */
    },
  },
]);
```

### Pattern 2: Multiple Errors

```typescript
const errors = [];

if (condition1) {
  errors.push({
    code: YourDomainErrorCodes.ERROR_1,
    message: 'Error 1',
  });
}

if (condition2) {
  errors.push({
    code: YourDomainErrorCodes.ERROR_2,
    message: 'Error 2',
  });
}

if (errors.length > 0) {
  throw new ValidationException('Validation failed', errors);
}
```

### Pattern 3: With Context

```typescript
throw new ValidationException('Error', [
  {
    code: YourDomainErrorCodes.INSUFFICIENT_RESOURCE,
    message: 'Not enough resources',
    context: {
      available: 5,
      requested: 10,
      shortfall: 5,
    },
  },
]);
```

## 🎨 Response Format

The error will automatically be formatted as:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Your error message",
  "errors": {
    "fieldName": {
      "code": "YOUR_DOMAIN_CUSTOM_ERROR",
      "message": "Detailed error message",
      "value": "...",
      "context": {}
    }
  },
  "timestamp": "2025-10-10T...",
  "path": "/your/endpoint"
}
```

## 📝 Naming Convention

✅ **Good Examples**:

```typescript
PRODUCT_OUT_OF_STOCK;
USER_EMAIL_ALREADY_EXISTS;
ORDER_PAYMENT_FAILED;
SUBSCRIPTION_EXPIRED;
QUOTA_EXCEEDED;
```

❌ **Bad Examples**:

```typescript
ERROR_1; // Not descriptive
error; // Wrong case
ProductOutOfStock; // Wrong case
out_of_stock; // Missing prefix
```

## 🔍 Quick Reference

### When to Use Domain Error Codes:

- ✅ Business rule violations
- ✅ Domain-specific validation
- ✅ Resource constraints (stock, quota, etc.)
- ✅ State transition errors
- ✅ Permission/authorization (domain-level)

### When to Use Common Error Codes:

- ✅ Generic HTTP errors (404, 500, etc.)
- ✅ Generic validation (required, format, etc.)
- ✅ System errors
- ✅ Framework errors

## 🌐 Frontend Integration

```typescript
// Frontend error handler
switch (error.code) {
  case 'YOUR_DOMAIN_CUSTOM_ERROR':
    // Show specific UI
    break;

  default:
  // Generic error UI
}
```

## 📚 Full Examples

See: [/src/domains/products/examples/using-custom-error-codes.example.ts](../src/domains/products/examples/using-custom-error-codes.example.ts)

## 📖 Detailed Guide

See: [DOMAIN_ERROR_CODES_GUIDE.md](./DOMAIN_ERROR_CODES_GUIDE.md)
