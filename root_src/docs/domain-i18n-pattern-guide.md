# Domain Model i18n Pattern - Implementation Guide

**Version**: 1.1  
**Date**: 2025-10-03  
**Updated**: 2025-10-03 - Added Injectable Error Codes Pattern

---

## 📋 Overview

This guide explains how to use the **Domain Exception with i18n pattern** in the nest-starter domain model architecture.

### Key Features

✅ **i18n Support**: Error messages in multiple languages  
✅ **Type-Safe**: Error codes with autocomplete  
✅ **Modular**: Works with all domain models  
✅ **Flexible**: Easy to add new languages  
✅ **Reliable**: Consistent error handling  
✅ **Maintainable**: Centralized error management  
✅ **Pure Domain Layer**: No I18nService dependency in models  
✅ **Injectable Pattern**: Each domain extends default error codes  
✅ **Scalable**: Domain-specific constants for better separation

---

## 🎯 Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│  Domain Model (Pure - No i18n dependency)               │
│                                                         │
│  if (price < 0) {                                       │
│    throw new DomainValidationException(                 │
│      DomainErrorCodes.PRODUCT_VALIDATION_PRICE_NEGATIVE,│
│      { price: -10 }                                     │
│    );                                                   │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
                        │
                        │ throws DomainException
                        ▼
┌─────────────────────────────────────────────────────────┐
│  DomainExceptionFilter (HTTP Layer)                     │
│                                                         │
│  - Catches exception                                    │
│  - Gets user's language (x-lang header)                 │
│  - Translates using I18nService                         │
│  - Returns translated error response                    │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│  HTTP Response (Translated)                             │
│                                                         │
│  EN: { message: "Price must be non-negative" }          │
│  ID: { message: "Harga harus tidak negatif" }           │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. Create Domain-Specific Error Codes (Injectable Pattern)

**NEW in v1.1**: Each domain now creates its own error codes by extending the default codes.

**`src/domains/products/constants/product-error-codes.ts`**

```typescript
import { DomainErrorCodesDefault } from '@/common/domain';

export const ProductErrorCodes = {
  // Inherit all common error codes
  ...DomainErrorCodesDefault,

  // Add product-specific error codes
  PRODUCT_VALIDATION_PRICE_NEGATIVE:
    'domain.products.validation.price_negative',
  PRODUCT_INSUFFICIENT_STOCK: 'domain.products.insufficient_stock',
  PRODUCT_NOT_FOUND: 'domain.products.not_found',
} as const;
```

**`src/domains/products/constants/index.ts`** (Barrel export)

```typescript
export {
  ProductErrorCodes,
  ProductErrorCode,
  isProductErrorCode,
  getProductSpecificErrorCodes,
} from './product-error-codes';
```

### 2. Import Domain Infrastructure

```typescript
import {
  DomainValidationException,
  DomainNotFoundException,
} from '@/common/domain';
import { ProductErrorCodes } from '../constants'; // Domain-specific
```

### 3. Use in Domain Models

```typescript
export class ProductModel extends BaseDomainModel<IProduct> {
  static create(data: CreateProductData): ProductModel {
    // Validate business rules with i18n-ready exceptions
    if (data.price < 0) {
      throw new DomainValidationException(
        ProductErrorCodes.PRODUCT_VALIDATION_PRICE_NEGATIVE,
        { price: data.price }
      );
    }

    return new ProductModel(...);
  }
}
```

### 4. Add Translation Keys

**`src/i18n/en/domain.json`**

```json
{
  "products": {
    "validation": {
      "price_negative": "Price must be non-negative"
    }
  }
}
```

**`src/i18n/id/domain.json`**

```json
{
  "products": {
    "validation": {
      "price_negative": "Harga harus tidak negatif"
    }
  }
}
```

### 4. Test with Different Languages

```bash
# English
curl -H "x-lang: en" http://localhost:3004/products \
  -d '{"name":"Test","price":-100}'

# Response: { "message": "Price must be non-negative" }

# Indonesian
curl -H "x-lang: id" http://localhost:3004/products \
  -d '{"name":"Test","price":-100}'

# Response: { "message": "Harga harus tidak negatif" }
```

---

## 📚 Exception Types

### 1. DomainValidationException

Use for **business rule violations** and **validation errors**.

**HTTP Status**: 400 Bad Request

### 2. DomainNotFoundException

Use for **entity not found** scenarios.

**HTTP Status**: 404 Not Found

### 3. DomainConflictException

Use for **conflict scenarios** (duplicates, constraints).

**HTTP Status**: 409 Conflict

### 4. DomainException (Base)

Use for **custom scenarios** not covered by above types.

---

## 🔑 Using Error Codes

### Type-Safe Error Codes (Injectable Pattern)

```typescript
import { ProductErrorCodes } from '../constants';

// ✅ Good: Type-safe with autocomplete from domain-specific codes
throw new DomainValidationException(
  ProductErrorCodes.PRODUCT_VALIDATION_PRICE_NEGATIVE,
  { price: -10 },
);

// ✅ Also Good: Using inherited common error codes
throw new DomainValidationException(
  ProductErrorCodes.COMMON_VALIDATION_REQUIRED, // From DomainErrorCodesDefault
  { field: 'name' },
);

// ❌ Bad: Raw string (no autocomplete, typo-prone)
throw new DomainValidationException(
  'domain.products.validation.price_negative',
  { price: -10 },
);
```

---

## 🆕 Adding New Error Codes (Injectable Pattern)

### For Existing Domains (e.g., Products)

**Step 1: Add to Domain Error Codes**

**`src/domains/products/constants/product-error-codes.ts`**

```typescript
import { DomainErrorCodesDefault } from '@/common/domain';

export const ProductErrorCodes = {
  ...DomainErrorCodesDefault,

  // Existing codes
  PRODUCT_VALIDATION_PRICE_NEGATIVE:
    'domain.products.validation.price_negative',

  // ✅ Add new product-specific error
  PRODUCT_OUT_OF_STOCK: 'domain.products.out_of_stock',
} as const;
```

**Step 2: Add Translations**

**`src/i18n/en/domain.json`**

```json
{
  "products": {
    "validation": {
      "price_negative": "Price must be non-negative"
    },
    "out_of_stock": "Product {{name}} is out of stock"
  }
}
```

**`src/i18n/id/domain.json`**

```json
{
  "products": {
    "validation": {
      "price_negative": "Harga harus tidak negatif"
    },
    "out_of_stock": "Produk {{name}} habis"
  }
}
```

---

### For New Domains (e.g., Users)

**Step 1: Create Domain Constants Directory**

```bash
mkdir -p src/domains/users/constants
```

**Step 2: Create Domain Error Codes**

**`src/domains/users/constants/user-error-codes.ts`**

```typescript
import { DomainErrorCodesDefault } from '@/common/domain';

export const UserErrorCodes = {
  // Inherit all common error codes
  ...DomainErrorCodesDefault,

  // Add user-specific error codes
  USER_VALIDATION_EMAIL_INVALID: 'domain.users.validation.email_invalid',
  USER_ALREADY_EXISTS: 'domain.users.already_exists',
  USER_NOT_FOUND: 'domain.users.not_found',
} as const;

export type UserErrorCode =
  (typeof UserErrorCodes)[keyof typeof UserErrorCodes];

export function isUserErrorCode(code: string): code is UserErrorCode {
  return Object.values(UserErrorCodes).includes(code as UserErrorCode);
}
```

**Step 3: Create Barrel Export**

**`src/domains/users/constants/index.ts`**

```typescript
export {
  UserErrorCodes,
  UserErrorCode,
  isUserErrorCode,
} from './user-error-codes';
```

**Step 4: Add Translations**

**`src/i18n/en/domain.json`**

```json
{
  "products": {
    "validation": {
      "price_negative": "Price must be non-negative"
    }
  },
  "users": {
    "validation": {
      "email_invalid": "Email address {{email}} is invalid"
    },
    "already_exists": "User with email {{email}} already exists"
  }
}
```

**Step 5: Use in Domain Model**

```typescript
import { DomainValidationException } from '@/common/domain';
import { UserErrorCodes } from '../constants';

export class UserModel extends BaseDomainModel<IUser> {
  static create(data: CreateUserData): UserModel {
    if (!isValidEmail(data.email)) {
      throw new DomainValidationException(
        UserErrorCodes.USER_VALIDATION_EMAIL_INVALID,
        { email: data.email },
      );
    }
    // ... rest of logic
  }
}
```

---

## 🎯 Injectable Pattern Advantages

### 1. **Modularity**

Each domain owns its error codes. No centralized file that grows endlessly.

```typescript
// ✅ Product domain has ProductErrorCodes
// ✅ User domain has UserErrorCodes
// ✅ Order domain has OrderErrorCodes
```

### 2. **Flexibility**

Domains can:

- Use common errors from `DomainErrorCodesDefault`
- Add domain-specific errors
- Override if needed (though not recommended)

### 3. **Scalability**

Adding a new domain doesn't require modifying core infrastructure.

```typescript
// Just create constants directory and extend!
export const BookingErrorCodes = {
  ...DomainErrorCodesDefault,
  BOOKING_OVERLAP: 'domain.bookings.overlap',
} as const;
```

### 4. **Maintainability**

- **Clear ownership**: Each domain maintains its own error codes
- **No merge conflicts**: Teams work on separate domain constant files
- **Easy to locate**: Error codes live with the domain they belong to

### 5. **Type Safety**

Each domain gets its own type-safe error code type.

```typescript
// ProductErrorCode type includes both common + product-specific
type ProductErrorCode =
  | 'domain.common.not_found' // From default
  | 'domain.products.insufficient_stock'; // Domain-specific
```

### 6. **Backward Compatibility**

Old unified `DomainErrorCodes` still works (deprecated) for gradual migration.

```typescript
// Still works, but deprecated
import { DomainErrorCodes } from '@/common/domain';

// Recommended: Use domain-specific codes
import { ProductErrorCodes } from '@/domains/products';
```

---

## 🌍 Adding New Languages

### Step 1: Create Translation File

Create `src/i18n/<lang-code>/domain.json`

Example for Spanish (`es`):

**`src/i18n/es/domain.json`**

```json
{
  "common": {
    "validation": {
      "required": "{{field}} es requerido",
      "negative_number": "{{field}} debe ser no negativo"
    }
  },
  "products": {
    "validation": {
      "price_negative": "El precio debe ser no negativo"
    }
  }
}
```

### Step 2: Test

```bash
curl -H "x-lang: es" http://localhost:3004/products \
  -d '{"name":"Test","price":-100}'

# Response: { "message": "El precio debe ser no negativo" }
```

---

## 📖 Complete Example: Product Model

See `/var/www/backend-upa-tik/nest-starter/root_src/src/domains/products/models/product.model.ts` for a complete, production-ready example.

---

## 🔍 Troubleshooting

### Issue 1: Translation Key Not Found

**Problem**: Error message shows raw translation key instead of translated text.

**Solution**:

1. Check translation file exists: `src/i18n/<lang>/domain.json`
2. Verify key path matches exactly: `domain.products.validation.price_negative`
3. Restart dev server to reload i18n files

### Issue 2: Wrong Language Returned

**Problem**: Always returns English regardless of `x-lang` header.

**Solution**:

1. Check DomainExceptionFilter is registered globally
2. Verify `x-lang` header is sent correctly
3. Check I18nModule configuration in `app.module.ts`

### Issue 3: Parameters Not Interpolated

**Problem**: Translation shows `{{price}}` instead of actual value.

**Solution**:

1. Ensure translation params match translation file placeholders
2. Use same naming: `{ price: -10 }` matches `{{price}}`
3. Check i18n configuration uses correct syntax

---

## 📊 Best Practices

### ✅ DO

- Use `DomainErrorCodes` constants (type-safe)
- Keep translation keys descriptive
- Include relevant parameters for context
- Test with multiple languages
- Document custom error codes
- Use specific exception types (Validation, NotFound, Conflict)

### ❌ DON'T

- Use raw translation key strings
- Hardcode error messages in domain models
- Inject I18nService into domain models
- Skip adding translations for new error codes
- Use generic error messages without context
- Mix domain exceptions with HTTP exceptions in models

---

## 🎯 Summary

### Key Benefits

1. **i18n Support**: Multi-language error messages
2. **Clean Architecture**: Domain models stay pure
3. **Type Safety**: Error codes with autocomplete
4. **Consistency**: Standardized error handling
5. **Maintainability**: Centralized error management
6. **Extendability**: Easy to add new errors/languages

---

**Happy Coding! 🚀**

For questions or improvements, refer to the Domain Model Pattern Blueprint or contact the architecture team.
