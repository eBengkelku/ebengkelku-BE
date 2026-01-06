# Request-Response Flow Documentation

## Overview

This document provides a comprehensive understanding of how requests are processed and responses are generated in this NestJS application, including exception handling, response transformation, i18n support, and the custom bad request utility.

---

## Table of Contents

1. [Architecture Components](#architecture-components)
2. [Complete Request-Response Flow](#complete-request-response-flow)
3. [Exception Handling System](#exception-handling-system)
4. [Response Transformation](#response-transformation)
5. [I18n Integration](#i18n-integration)
6. [Custom Bad Request Utility](#custom-bad-request-utility)
7. [Flow Diagrams](#flow-diagrams)

---

## Architecture Components

### 1. Exceptions (`src/common/exceptions/`)

Custom exception classes that extend NestJS HttpException with additional features:

```
src/common/exceptions/
├── base.exception.ts           # Base class for all custom exceptions
├── validation.exception.ts     # Validation errors with field-level details
├── not-found.exception.ts      # Resource not found (404)
├── conflict.exception.ts       # Resource conflicts (409)
└── index.ts                    # Barrel export

src/common/domain/exceptions/
├── domain.exception.ts         # Domain-layer exceptions with i18n
├── domain-error-codes.ts       # Error code constants
└── constants/
    └── domain-error-codes.default.ts
```

**Key Features:**
- Support for error codes (e.g., `ERR_1004`, `PRODUCT_NOT_FOUND`)
- I18n translation keys and parameters
- Context information for debugging
- Multiple error details support

### 2. Filters (`src/common/filters/`)

Exception filters that catch errors and transform them into standardized responses:

```
src/common/filters/
├── validation-exception.filter.ts  # Handles validation errors
├── http-exception.filter.ts        # Handles HTTP exceptions
├── domain-exception.filter.ts      # Handles domain exceptions
├── global-exception.filter.ts      # Catch-all for unhandled errors
└── index.ts                        # Barrel export
```

**Execution Order (High to Low Priority):**
1. ValidationExceptionFilter
2. HttpExceptionFilter
3. DomainExceptionFilter
4. GlobalExceptionFilter

### 3. Interceptors (`src/common/interceptors/`)

```
src/common/interceptors/
├── response-transform.interceptor.ts      # Transforms successful responses
├── validation-translation.interceptor.ts  # Translates validation errors
└── form-data.interceptor.ts              # Handles multipart/form-data
```

**ResponseTransformInterceptor Features:**
- Wraps responses in `StandardResponse` format
- Handles paginated responses
- Translates success messages
- Can be bypassed with `@SkipTransform()` decorator

### 4. Custom Utilities (`src/utils/`)

```
src/utils/
└── custom-bad-request.util.ts    # Custom bad request with flexible status codes
```

**Purpose:**
- Allows controllers to return custom status codes (e.g., 4001, 4002)
- Supports i18n translation
- Maintains StandardResponse format

### 5. I18n Configuration

```
src/i18n/
├── en/
│   ├── common.json
│   ├── validation.json
│   └── products.json
└── id/
    ├── common.json
    ├── validation.json
    └── products.json
```

**Language Detection Priority:**
1. `x-lang` header
2. `accept-language` header
3. Fallback: `en`

---

## Complete Request-Response Flow

### Success Flow (Tree Diagram)

```
Incoming HTTP Request
│
├─→ [1] Middleware Layer
│   ├─→ RequestTimingMiddleware
│   │   └─→ Stores request.startTime
│   │
│   └─→ AuthMiddleware
│       └─→ Validates JWT token
│
├─→ [2] Validation Layer
│   └─→ I18nValidationPipe
│       ├─→ Transforms request data to DTO
│       ├─→ Validates using class-validator
│       └─→ [SUCCESS] → Proceed to controller
│
├─→ [3] Controller Execution
│   ├─→ Route handler method executes
│   ├─→ Business logic processes
│   └─→ [SUCCESS] → Return data
│
├─→ [4] Response Transformation (Interceptor)
│   └─→ ResponseTransformInterceptor
│       ├─→ Checks for @SkipTransform() decorator
│       ├─→ Detects language from headers (x-lang or accept-language)
│       ├─→ Translates success message if needed
│       ├─→ Wraps response in StandardResponse format:
│       │   {
│       │     success: true,
│       │     statusCode: 200,
│       │     message: "Request successful" (translated),
│       │     data: { ... },
│       │     errors: null,
│       │     timestamp: "2025-10-14T...",
│       │     path: "/api/products",
│       │     requestTime: 45  // milliseconds
│       │   }
│       └─→ Handles pagination if present
│
└─→ [5] HTTP Response
    └─→ Sends JSON response to client
```

### Error Flow (Tree Diagram)

```
Exception Thrown
│
├─→ [1] Exception Filter Chain (Priority Order)
│   │
│   ├─→ [HIGHEST] ValidationExceptionFilter
│   │   ├─→ Catches: ValidationException, I18nValidationException, BadRequestException
│   │   ├─→ Special handling for Custom Bad Request (isCustomBadRequest check)
│   │   │   └─→ If custom bad request detected:
│   │   │       {
│   │   │         success: false,
│   │   │         statusCode: <custom_code>, // e.g., 4001
│   │   │         message: <translated_message>,
│   │   │         data: null,
│   │   │         errors: {
│   │   │           code: "PRODUCT_NOT_FOUND",
│   │   │           message: <translated_error_message>
│   │   │         },
│   │   │         timestamp: "...",
│   │   │         path: "/api/products/123",
│   │   │         requestTime: 12
│   │   │       }
│   │   │
│   │   └─→ For standard validation errors:
│   │       ├─→ Extracts language from request headers
│   │       ├─→ Transforms validation errors to object format
│   │       ├─→ Translates error messages
│   │       └─→ Returns StandardResponse:
│   │           {
│   │             success: false,
│   │             statusCode: 400,
│   │             message: "Validation failed" (translated),
│   │             data: null,
│   │             errors: {
│   │               "name": {
│   │                 value: "",
│   │                 code: "VALIDATION_REQUIRED",
│   │                 message: "name should not be empty",
│   │                 context_message: "Name is required" (translated)
│   │               },
│   │               "price": {
│   │                 value: -10,
│   │                 code: "VALIDATION_MIN_VALUE",
│   │                 message: "price must not be less than 0",
│   │                 context_message: "Price must be at least 0" (translated),
│   │                 context: { min: 0, actualValue: -10 }
│   │               }
│   │             },
│   │             timestamp: "...",
│   │             path: "/api/products",
│   │             requestTime: 15
│   │           }
│   │
│   ├─→ [HIGH] HttpExceptionFilter
│   │   ├─→ Catches: HttpException, BaseHttpException
│   │   ├─→ Detects language from request headers
│   │   ├─→ Checks if it's a custom bad request (isCustomBadRequest)
│   │   └─→ Returns StandardResponse:
│   │       {
│   │         success: false,
│   │         statusCode: 404,
│   │         message: "Product not found" (translated),
│   │         data: null,
│   │         errors: [{
│   │           code: "ERR_1004",
│   │           message: "Product not found" (translated),
│   │           context: { entityName: "Product", id: "123" }
│   │         }],
│   │         timestamp: "...",
│   │         path: "/api/products/123",
│   │         requestTime: 8
│   │       }
│   │
│   ├─→ [MEDIUM] DomainExceptionFilter
│   │   ├─→ Catches: DomainException and its subclasses
│   │   ├─→ Extracts language from request headers
│   │   ├─→ Translates domain error messages
│   │   └─→ Returns StandardResponse:
│   │       {
│   │         success: false,
│   │         statusCode: 400,
│   │         message: "Price must be positive" (translated),
│   │         data: null,
│   │         errors: [{
│   │           code: "DOMAIN_VALIDATION_ERROR",
│   │           message: "Price must be positive" (translated),
│   │           context: { price: -10 }
│   │         }],
│   │         timestamp: "...",
│   │         path: "/api/products",
│   │         requestTime: 10
│   │       }
│   │
│   └─→ [LOWEST] GlobalExceptionFilter (Catch-All)
│       ├─→ Catches: All unhandled exceptions
│       ├─→ Logs exception with appropriate level (error/warn/log)
│       ├─→ Detects language from request headers
│       └─→ Returns StandardResponse:
│           {
│             success: false,
│             statusCode: 500,
│             message: "Internal server error" (translated),
│             data: null,
│             errors: [{
│               code: "ERR_1500",
│               message: "An unexpected error occurred"
│             }],
│             timestamp: "...",
│             path: "/api/products",
│             requestTime: 5,
│             stack: "..." // Only in development mode
│           }
│
└─→ [2] HTTP Error Response
    └─→ Sends JSON error response to client with appropriate status code
```

---

## Exception Handling System

### Exception Hierarchy

```
Error (JavaScript built-in)
│
└─→ HttpException (NestJS)
    │
    ├─→ BaseHttpException (Custom)
    │   ├─→ ValidationException
    │   ├─→ NotFoundException
    │   └─→ ConflictException
    │
    ├─→ BadRequestException (NestJS)
    │   └─→ I18nValidationException (nestjs-i18n)
    │
    └─→ DomainException (Custom)
        ├─→ DomainValidationException
        ├─→ DomainNotFoundException
        └─→ DomainConflictException
```

### Exception Types and Usage

#### 1. ValidationException

**Purpose:** Field-level validation errors with detailed information

**Example Usage:**
```typescript
// Single field validation
throw ValidationException.forField('email', 'Invalid email format', 'invalid@');

// Multiple fields
throw new ValidationException('Validation failed', [
  {
    property: 'name',
    value: '',
    code: 'VALIDATION_REQUIRED',
    message: 'Name is required'
  },
  {
    property: 'price',
    value: -10,
    code: 'VALIDATION_MIN_VALUE',
    message: 'Price must be positive',
    context: { min: 0 }
  }
]);
```

**Response Format:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "data": null,
  "errors": {
    "name": {
      "value": "",
      "code": "VALIDATION_REQUIRED",
      "message": "Name is required"
    },
    "price": {
      "value": -10,
      "code": "VALIDATION_MIN_VALUE",
      "message": "Price must be positive",
      "context": { "min": 0, "actualValue": -10 }
    }
  },
  "timestamp": "2025-10-14T10:30:00.000Z",
  "path": "/api/products",
  "requestTime": 15
}
```

#### 2. NotFoundException

**Purpose:** Resource not found errors (404)

**Example Usage:**
```typescript
// Generic
throw new NotFoundException('Product not found');

// Entity by ID
throw NotFoundException.forId('Product', '123');

// Entity by criteria
throw NotFoundException.forCriteria('Product', { sku: 'ABC123' });
```

**Response Format:**
```json
{
  "success": false,
  "statusCode": 404,
  "message": "Product with id 123 not found",
  "data": null,
  "errors": [{
    "code": "ERR_1004",
    "message": "Product with id 123 not found",
    "context": {
      "entityName": "Product",
      "id": "123"
    }
  }],
  "timestamp": "2025-10-14T10:30:00.000Z",
  "path": "/api/products/123",
  "requestTime": 8
}
```

#### 3. ConflictException

**Purpose:** Resource conflicts, duplicates, state violations (409)

**Example Usage:**
```typescript
// Duplicate entity
throw ConflictException.duplicate('Product', { sku: 'ABC123' });

// Unique constraint violation
throw ConflictException.uniqueConstraint('User', 'email', 'test@example.com');

// State conflict
throw ConflictException.stateConflict('Order', 'Cannot cancel completed order', { status: 'completed' });
```

#### 4. DomainException

**Purpose:** Domain layer errors with i18n support (keeps domain models pure)

**Example Usage:**
```typescript
// In domain model
if (price < 0) {
  throw new DomainValidationException(
    'domain.products.price_negative',
    { price }
  );
}

// In repository
if (!product) {
  throw new DomainNotFoundException(
    'domain.products.not_found',
    { id }
  );
}
```

**Response Format:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Price must be non-negative",
  "data": null,
  "errors": [{
    "code": "DOMAIN_VALIDATION_ERROR",
    "message": "Price must be non-negative",
    "context": { "price": -10 }
  }],
  "timestamp": "2025-10-14T10:30:00.000Z",
  "path": "/api/products",
  "requestTime": 10
}
```

### Exception Filter Registration

Filters are registered in `common.module.ts` with proper ordering:

```typescript
@Module({
  providers: [
    // Catch-all (registered first = executed last)
    { provide: APP_FILTER, useFactory: (i18n) => new GlobalExceptionFilter(i18n), inject: [I18nService] },

    // HTTP exceptions (registered second = executed second)
    { provide: APP_FILTER, useFactory: (i18n) => new HttpExceptionFilter(i18n), inject: [I18nService] },

    // Validation exceptions (registered last = executed first/highest priority)
    { provide: APP_FILTER, useFactory: (i18n) => new ValidationExceptionFilter(i18n), inject: [I18nService] },
  ]
})
```

**Note:** NestJS filters use reverse registration order - the last registered filter has the highest priority.

---

## Response Transformation

### ResponseTransformInterceptor

The interceptor transforms all successful responses into a standardized format.

#### Standard Response Format

```typescript
interface StandardResponse<T> {
  success: boolean;          // Always true for successful responses
  statusCode: number;        // HTTP status code (200, 201, etc.)
  message: string;           // Success message (translated)
  data: T | null;            // Response payload
  errors: any | null;        // Always null for success
  timestamp: string;         // ISO 8601 timestamp
  path?: string;             // Request path
  requestTime?: number;      // Request processing time in ms
}
```

#### Paginated Response Format

```typescript
interface PaginatedResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  errors: null;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: any;              // Alternative to pagination
  timestamp: string;
  path?: string;
  requestTime?: number;
}
```

#### Custom Success Messages

Use the `@ResponseMessage()` decorator to customize success messages:

```typescript
import { ResponseMessage } from '@/common/decorators';

@Controller('products')
export class ProductsController {

  @ResponseMessage('products.success.created')  // Translation key
  @Post()
  async create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @ResponseMessage('Product updated successfully')  // Plain text
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }
}
```

#### Bypassing Transformation

Use `@SkipTransform()` decorator when you need raw response:

```typescript
import { SkipTransform } from '@/common/decorators';

@Controller('files')
export class FilesController {

  @SkipTransform()
  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const file = await this.filesService.getFile(id);
    res.setHeader('Content-Type', file.mimeType);
    return res.send(file.buffer);
  }
}
```

#### Transformation Examples

**1. Simple Data:**
```typescript
// Controller returns
return { id: 1, name: 'Product A' };

// Client receives
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": {
    "id": 1,
    "name": "Product A"
  },
  "errors": null,
  "timestamp": "2025-10-14T10:30:00.000Z",
  "path": "/api/products/1",
  "requestTime": 25
}
```

**2. Array Data:**
```typescript
// Controller returns
return [
  { id: 1, name: 'Product A' },
  { id: 2, name: 'Product B' }
];

// Client receives
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": [
    { "id": 1, "name": "Product A" },
    { "id": 2, "name": "Product B" }
  ],
  "errors": null,
  "timestamp": "2025-10-14T10:30:00.000Z",
  "path": "/api/products",
  "requestTime": 30
}
```

**3. Paginated Data:**
```typescript
// Controller returns
return {
  data: [
    { id: 1, name: 'Product A' },
    { id: 2, name: 'Product B' }
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1
  }
};

// Client receives
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": [
    { "id": 1, "name": "Product A" },
    { "id": 2, "name": "Product B" }
  ],
  "errors": null,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1
  },
  "timestamp": "2025-10-14T10:30:00.000Z",
  "path": "/api/products",
  "requestTime": 35
}
```

---

## I18n Integration

### Configuration

I18n is configured in `app.module.ts`:

```typescript
I18nModule.forRoot({
  fallbackLanguage: 'en',
  loaderOptions: {
    path: path.join(__dirname, '../i18n/'),
    watch: true,  // Hot reload in development
  },
  resolvers: [
    { use: HeaderResolver, options: ['x-lang'] },  // Priority 1
    new AcceptLanguageResolver(),                   // Priority 2
  ],
})
```

### Translation File Structure

```
src/i18n/
├── en/
│   ├── common.json          # Common messages
│   ├── validation.json      # Validation messages
│   └── products.json        # Product-specific messages
└── id/
    ├── common.json
    ├── validation.json
    └── products.json
```

### Translation Keys Format

**common.json:**
```json
{
  "success": {
    "request_successful": "Request successful",
    "resource_created": "Resource created successfully"
  },
  "validation": {
    "failed": "Validation failed"
  },
  "not_found": "Resource not found",
  "conflict": "Resource conflict"
}
```

**validation.json:**
```json
{
  "required": "{{property}} is required",
  "min": "{{property}} must be at least {{min}}",
  "max": "{{property}} must not exceed {{max}}",
  "email": "{{property}} must be a valid email",
  "minLength": "{{property}} must be at least {{min}} characters",
  "maxLength": "{{property}} must not exceed {{max}} characters"
}
```

**products.json:**
```json
{
  "success": {
    "created": "Product created successfully",
    "updated": "Product updated successfully",
    "deleted": "Product deleted successfully"
  },
  "errors": {
    "not_found": "Product not found",
    "not_found_detail": "Product with ID {{id}} does not exist",
    "price_negative": "Product price must be positive",
    "insufficient_stock": "Insufficient stock. Available: {{available}}, Requested: {{requested}}"
  }
}
```

### Using I18n in Controllers

**1. With Translation Keys:**
```typescript
@Controller('products')
export class ProductsController {

  @ResponseMessage('products.success.created')  // Will be translated
  @Post()
  async create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }
}
```

**2. With Custom Bad Request Utility:**
```typescript
import { throwCustomBadRequest } from '@/utils/custom-bad-request.util';

@Controller('products')
export class ProductsController {

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productService.findOne(id);

    if (!product) {
      throwCustomBadRequest({
        statusCode: 4001,
        message: 'products.errors.not_found',        // Translation key
        errorCode: 'PRODUCT_NOT_FOUND',
        errorMessage: 'products.errors.not_found_detail',  // Translation key
        translationParams: { id }                    // Parameters for interpolation
      });
    }

    return product;
  }
}
```

**3. With Domain Exceptions:**
```typescript
// In domain model or service
class ProductModel {
  updatePrice(newPrice: number) {
    if (newPrice < 0) {
      throw new DomainValidationException(
        'domain.products.price_negative',  // Translation key
        { price: newPrice }                // Parameters
      );
    }
    this.price = newPrice;
  }
}
```

### Language Detection Flow

```
Request Headers
│
├─→ Check 'x-lang' header
│   ├─→ Found? → Use it (e.g., 'en', 'id')
│   └─→ Not found? → Continue
│
├─→ Check 'accept-language' header
│   ├─→ Found? → Parse and use first language (e.g., 'en-US' → 'en')
│   └─→ Not found? → Continue
│
└─→ Use fallback language: 'en'
```

### Request Example with Language

```http
POST /api/products HTTP/1.1
Host: localhost:3004
Content-Type: application/json
x-lang: id

{
  "name": "",
  "price": -10
}
```

**Response (Indonesian):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validasi gagal",
  "data": null,
  "errors": {
    "name": {
      "value": "",
      "code": "VALIDATION_REQUIRED",
      "message": "name should not be empty",
      "context_message": "Nama harus diisi"
    },
    "price": {
      "value": -10,
      "code": "VALIDATION_MIN_VALUE",
      "message": "price must not be less than 0",
      "context_message": "Harga minimal 0",
      "context": { "min": 0, "actualValue": -10 }
    }
  },
  "timestamp": "2025-10-14T10:30:00.000Z",
  "path": "/api/products",
  "requestTime": 15
}
```

---

## Custom Bad Request Utility

### Purpose

The `throwCustomBadRequest` utility allows controllers to return custom status codes (not just HTTP standard codes) while maintaining the StandardResponse format and i18n support.

### When to Use

Use this utility when:
- You need custom error codes agreed upon with frontend (e.g., 4001, 4002, 5001)
- You want to maintain consistent error format
- You need i18n support for error messages
- You're implementing custom business logic errors

### Import

```typescript
import { throwCustomBadRequest } from '@/utils/custom-bad-request.util';
```

### Usage Examples

#### 1. Basic Usage (Plain Text)

```typescript
@Controller('products')
export class ProductsController {

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productService.findOne(id);

    if (!product) {
      throwCustomBadRequest({
        statusCode: 4001,
        message: 'Product not found',
        errorCode: 'PRODUCT_NOT_FOUND'
      });
    }

    return product;
  }
}
```

**Response:**
```json
{
  "success": false,
  "statusCode": 4001,
  "message": "Product not found",
  "data": null,
  "errors": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found"
  },
  "timestamp": "2025-10-14T10:30:00.000Z",
  "path": "/api/products/123",
  "requestTime": 12
}
```

#### 2. With I18n Translation Keys

```typescript
@Controller('products')
export class ProductsController {

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productService.findOne(id);

    if (!product) {
      throwCustomBadRequest({
        statusCode: 4001,
        message: 'products.errors.not_found',         // Translation key
        errorCode: 'PRODUCT_NOT_FOUND',
        errorMessage: 'products.errors.not_found_detail',  // Translation key
        translationParams: { id }                     // For interpolation
      });
    }

    return product;
  }
}
```

**Request with x-lang: en:**
```json
{
  "success": false,
  "statusCode": 4001,
  "message": "Product not found",
  "data": null,
  "errors": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product with ID 123 does not exist"
  },
  "timestamp": "2025-10-14T10:30:00.000Z",
  "path": "/api/products/123",
  "requestTime": 12
}
```

**Request with x-lang: id:**
```json
{
  "success": false,
  "statusCode": 4001,
  "message": "Produk tidak ditemukan",
  "data": null,
  "errors": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Produk dengan ID 123 tidak ada"
  },
  "timestamp": "2025-10-14T10:30:00.000Z",
  "path": "/api/products/123",
  "requestTime": 12
}
```

#### 3. With Translation Parameters

```typescript
@Put(':id/stock')
async updateStock(
  @Param('id') id: string,
  @Body() dto: UpdateStockDto
) {
  const product = await this.productService.findOne(id);

  if (product.stockQuantity < dto.quantity) {
    throwCustomBadRequest({
      statusCode: 4002,
      message: 'products.errors.insufficient_stock',
      errorCode: 'INSUFFICIENT_STOCK',
      errorMessage: 'products.errors.insufficient_stock',
      translationParams: {
        available: product.stockQuantity,
        requested: dto.quantity
      }
    });
  }

  return this.productService.updateStock(id, dto);
}
```

**Response:**
```json
{
  "success": false,
  "statusCode": 4002,
  "message": "Insufficient stock. Available: 5, Requested: 10",
  "data": null,
  "errors": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Insufficient stock. Available: 5, Requested: 10"
  },
  "timestamp": "2025-10-14T10:30:00.000Z",
  "path": "/api/products/123/stock",
  "requestTime": 18
}
```

### Interface

```typescript
interface CustomBadRequestOptions {
  statusCode: number;              // Custom status code (e.g., 4001, 4002)
  message: string;                 // Main message (can be translation key)
  errorCode: string;               // Error code for identification
  errorMessage?: string;           // Detailed error message (optional, defaults to message)
  translationParams?: Record<string, any>;  // Parameters for i18n interpolation
}
```

### How It Works Internally

1. **Utility Creates Special BadRequestException:**
   ```typescript
   const customResponse = {
     __isCustomBadRequest: true,  // Flag for detection
     statusCode: 4001,
     message: 'products.errors.not_found',
     errors: {
       code: 'PRODUCT_NOT_FOUND',
       message: 'products.errors.not_found_detail'
     },
     translationParams: { id: '123' }
   };

   throw new BadRequestException(customResponse);
   ```

2. **ValidationExceptionFilter Detects Custom Format:**
   ```typescript
   if (isCustomBadRequest(exceptionResponse)) {
     // Translate messages
     const translatedMessage = this.translateIfKey(
       exceptionResponse.message,
       lang,
       exceptionResponse.translationParams
     );

     const translatedErrorMessage = this.translateIfKey(
       exceptionResponse.errors.message,
       lang,
       exceptionResponse.translationParams
     );

     // Return custom format with HTTP 400 status
     return {
       success: false,
       statusCode: exceptionResponse.statusCode,  // Custom code (4001)
       message: translatedMessage,
       data: null,
       errors: {
         code: exceptionResponse.errors.code,
         message: translatedErrorMessage
       },
       timestamp: new Date().toISOString(),
       path: request.url,
       requestTime: getRequestTime(request)
     };
   }
   ```

3. **HTTP Response:**
   - HTTP Status Code: Always `400 Bad Request`
   - Response Body Status Code: Custom (e.g., `4001`, `4002`)
   - Messages: Translated based on `x-lang` or `accept-language` header

### Benefits

1. **Custom Status Codes:** Use business-specific codes (4001, 4002, etc.)
2. **Consistent Format:** Maintains StandardResponse structure
3. **I18n Support:** Automatic translation of messages
4. **Type Safety:** TypeScript interface for compile-time checking
5. **Flexible:** Can use translation keys or plain text
6. **Parameter Interpolation:** Dynamic values in translated messages

---

## Flow Diagrams

### 1. Application Bootstrap Flow

```
main.ts
│
├─→ NestFactory.create(AppModule)
│   │
│   └─→ AppModule imports
│       ├─→ ConfigModule (global)
│       ├─→ I18nModule
│       │   ├─→ Loads translation files from src/i18n/{lang}/
│       │   └─→ Configures resolvers (HeaderResolver, AcceptLanguageResolver)
│       ├─→ DatabaseModule
│       ├─→ CommonModule (global)
│       │   └─→ Registers global providers:
│       │       ├─→ APP_INTERCEPTOR: ResponseTransformInterceptor
│       │       └─→ APP_FILTER (in reverse priority order):
│       │           ├─→ GlobalExceptionFilter (catch-all)
│       │           ├─→ HttpExceptionFilter
│       │           ├─→ DomainExceptionFilter
│       │           └─→ ValidationExceptionFilter (highest priority)
│       ├─→ AuthModule
│       └─→ Feature modules (ProductsModule, etc.)
│
├─→ app.useGlobalPipes(I18nValidationPipe)
│
├─→ AppModule.configure(MiddlewareConsumer)
│   ├─→ RequestTimingMiddleware (forRoutes '*')
│   └─→ AuthMiddleware (forRoutes '*')
│
└─→ app.listen(3004)
```

### 2. Successful Request Processing

```
HTTP Request
│
├─→ [PHASE 1: Middleware]
│   ├─→ RequestTimingMiddleware
│   │   └─→ Stores request.startTime = Date.now()
│   │
│   └─→ AuthMiddleware
│       └─→ Validates JWT, sets request.user
│
├─→ [PHASE 2: Guards] (if defined)
│   └─→ JwtAuthGuard
│       └─→ Validates authentication
│
├─→ [PHASE 3: Interceptors - Before] (if defined)
│   └─→ Custom interceptors execute
│
├─→ [PHASE 4: Pipes]
│   └─→ I18nValidationPipe
│       ├─→ Transforms request body to DTO instance
│       ├─→ Validates using class-validator decorators
│       ├─→ [SUCCESS] → Continue
│       └─→ [FAILURE] → Throws I18nValidationException → Go to Error Flow
│
├─→ [PHASE 5: Controller Handler]
│   ├─→ Route handler method executes
│   ├─→ Business logic runs
│   ├─→ Service methods called
│   └─→ Returns data
│
├─→ [PHASE 6: Interceptors - After]
│   └─→ ResponseTransformInterceptor
│       ├─→ Checks @SkipTransform() decorator
│       │   └─→ If present: return raw data
│       │
│       ├─→ Extracts language from request
│       │   ├─→ request.headers['x-lang']
│       │   ├─→ request.headers['accept-language']
│       │   └─→ Fallback: 'en'
│       │
│       ├─→ Gets custom message from @ResponseMessage() decorator
│       │
│       ├─→ Translates message (if translation key)
│       │   └─→ i18n.translate(message, { lang, args })
│       │
│       ├─→ Checks response format:
│       │   ├─→ Already StandardResponse? → Return as-is
│       │   ├─→ Paginated? → Transform to PaginatedResponse
│       │   └─→ Regular data? → Transform to StandardResponse
│       │
│       └─→ Wraps response:
│           {
│             success: true,
│             statusCode: response.statusCode || 200,
│             message: translatedMessage,
│             data: responseData,
│             errors: null,
│             timestamp: new Date().toISOString(),
│             path: request.url,
│             requestTime: Date.now() - request.startTime
│           }
│
└─→ [PHASE 7: HTTP Response]
    └─→ Sends JSON response to client
```

### 3. Error Handling Flow (Detailed)

```
Exception Thrown
│
├─→ [DETECTION PHASE]
│   │
│   ├─→ NestJS Exception Filter Chain
│   │   └─→ Filters registered via APP_FILTER
│   │       (Executes in reverse registration order)
│   │
│   └─→ Matches exception type with filter's @Catch() decorator
│
├─→ [FILTER SELECTION]
│   │
│   ├─→ ValidationException / I18nValidationException / BadRequestException?
│   │   └─→ ValidationExceptionFilter (Priority 1)
│   │       │
│   │       ├─→ Extracts language:
│   │       │   ├─→ request.headers['x-lang']
│   │       │   ├─→ request.headers['accept-language']
│   │       │   └─→ Fallback: 'en'
│   │       │
│   │       ├─→ Checks if custom bad request:
│   │       │   └─→ isCustomBadRequest(exceptionResponse)
│   │       │       ├─→ YES (has __isCustomBadRequest flag):
│   │       │       │   ├─→ Translates message: translateIfKey(message, lang, params)
│   │       │       │   ├─→ Translates error message: translateIfKey(errors.message, lang, params)
│   │       │       │   └─→ Returns:
│   │       │       │       {
│   │       │       │         success: false,
│   │       │       │         statusCode: customResponse.statusCode,  // Custom code
│   │       │       │         message: translatedMessage,
│   │       │       │         data: null,
│   │       │       │         errors: {
│   │       │       │           code: errorCode,
│   │       │       │           message: translatedErrorMessage
│   │       │       │         },
│   │       │       │         timestamp: ISO string,
│   │       │       │         path: request.url,
│   │       │       │         requestTime: ms
│   │       │       │       }
│   │       │       │
│   │       │       └─→ NO (standard validation error):
│   │       │           ├─→ Transforms errors to object format
│   │       │           ├─→ For each validation error:
│   │       │           │   ├─→ Extracts constraint (isNotEmpty, min, etc.)
│   │       │           │   ├─→ Maps to error code (VALIDATION_REQUIRED, etc.)
│   │       │           │   ├─→ Translates message
│   │       │           │   ├─→ Builds context (min, max, actualValue, etc.)
│   │       │           │   └─→ Creates error detail:
│   │       │           │       {
│   │       │           │         value: invalidValue,
│   │       │           │         code: "VALIDATION_MIN_VALUE",
│   │       │           │         message: "price must not be less than 0",
│   │       │           │         context_message: "Harga minimal 0",
│   │       │           │         context: { min: 0, actualValue: -10 }
│   │       │           │       }
│   │       │           │
│   │       │           └─→ Returns object format:
│   │       │               {
│   │       │                 success: false,
│   │       │                 statusCode: 400,
│   │       │                 message: "Validation failed",
│   │       │                 data: null,
│   │       │                 errors: {
│   │       │                   "fieldName": { value, code, message, context_message, context }
│   │       │                 },
│   │       │                 timestamp, path, requestTime
│   │       │               }
│   │       │
│   │       └─→ Sends HTTP 400 response
│   │
│   ├─→ HttpException / BaseHttpException?
│   │   └─→ HttpExceptionFilter (Priority 2)
│   │       │
│   │       ├─→ Extracts language from request headers
│   │       │
│   │       ├─→ Gets status code: exception.getStatus()
│   │       │
│   │       ├─→ Checks if custom bad request:
│   │       │   └─→ isCustomBadRequest(exceptionResponse)
│   │       │       └─→ YES: Similar handling as ValidationExceptionFilter
│   │       │
│   │       ├─→ Is BaseHttpException?
│   │       │   └─→ YES:
│   │       │       ├─→ Translates message: i18n.translate(exception.translationKey, ...)
│   │       │       └─→ Uses exception.errorCode and exception.context
│   │       │
│   │       ├─→ Transforms exception to errors array
│   │       │
│   │       ├─→ Returns:
│   │       │   {
│   │       │     success: false,
│   │       │     statusCode: exception.getStatus(),
│   │       │     message: translatedMessage,
│   │       │     data: null,
│   │       │     errors: [{
│   │       │       code: errorCode,
│   │       │       message: translatedMessage,
│   │       │       context: exceptionContext
│   │       │     }],
│   │       │     timestamp, path, requestTime
│   │       │   }
│   │       │
│   │       └─→ Sends HTTP response with status code
│   │
│   ├─→ DomainException?
│   │   └─→ DomainExceptionFilter (Priority 3)
│   │       │
│   │       ├─→ Extracts language from request headers
│   │       │
│   │       ├─→ Translates message:
│   │       │   └─→ i18n.translate(exception.translationKey, { lang, args: translationParams })
│   │       │
│   │       ├─→ Determines error code based on exception type:
│   │       │   ├─→ DomainValidationException → "DOMAIN_VALIDATION_ERROR"
│   │       │   ├─→ DomainNotFoundException → "DOMAIN_NOT_FOUND"
│   │       │   ├─→ DomainConflictException → "DOMAIN_CONFLICT"
│   │       │   └─→ Default → "DOMAIN_ERROR"
│   │       │
│   │       ├─→ Logs error for debugging
│   │       │
│   │       ├─→ Returns:
│   │       │   {
│   │       │     success: false,
│   │       │     statusCode: exception.statusCode,
│   │       │     message: translatedMessage,
│   │       │     data: null,
│   │       │     errors: [{
│   │       │       code: errorCode,
│   │       │       message: translatedMessage,
│   │       │       context: exception.translationParams
│   │       │     }],
│   │       │     timestamp, path, requestTime
│   │       │   }
│   │       │
│   │       └─→ Sends HTTP response with status code
│   │
│   └─→ Any unhandled exception?
│       └─→ GlobalExceptionFilter (Priority 4 - Catch-All)
│           │
│           ├─→ Logs exception with appropriate level:
│           │   ├─→ statusCode >= 500 → logger.error()
│           │   ├─→ statusCode >= 400 → logger.warn()
│           │   └─→ else → logger.log()
│           │
│           ├─→ Determines status code:
│           │   ├─→ exception instanceof HttpException → exception.getStatus()
│           │   ├─→ exception.status → exception.status
│           │   ├─→ exception.statusCode → exception.statusCode
│           │   └─→ Default → 500
│           │
│           ├─→ Extracts language from request headers
│           │
│           ├─→ Builds error response:
│           │   {
│           │     success: false,
│           │     statusCode: determinedStatusCode,
│           │     message: getMainMessage(exception, statusCode, lang),
│           │     data: null,
│           │     errors: [{
│           │       code: exception.errorCode || "ERR_1500",
│           │       message: getErrorMessage(exception, lang),
│           │       context: exception.context
│           │     }],
│           │     timestamp, path, requestTime,
│           │     stack: exception.stack  // Only in development
│           │   }
│           │
│           └─→ Sends HTTP response with status code
│
└─→ [RESPONSE SENT]
    └─→ Client receives error response in StandardResponse format
```

### 4. Validation Pipeline Flow

```
Request with Body
│
├─→ [STEP 1: DTO Instantiation]
│   └─→ I18nValidationPipe receives plain object
│       └─→ Transforms to DTO class instance
│
├─→ [STEP 2: Class-Validator Execution]
│   └─→ Validates each decorated property
│       │
│       ├─→ @IsNotEmpty()
│       │   ├─→ Checks if value is not null/undefined/''
│       │   └─→ Constraint: 'isNotEmpty'
│       │
│       ├─→ @IsString()
│       │   ├─→ Checks if value is string
│       │   └─→ Constraint: 'isString'
│       │
│       ├─→ @Min(0)
│       │   ├─→ Checks if value >= 0
│       │   └─→ Constraint: 'min', Context: { min: 0 }
│       │
│       └─→ [Validation Result]
│           ├─→ All pass → Continue to controller
│           └─→ Any fail → Collect ValidationError[]
│
├─→ [STEP 3: Error Collection] (if validation fails)
│   └─→ For each ValidationError:
│       {
│         property: 'price',
│         value: -10,
│         constraints: {
│           min: 'price must not be less than 0'
│         },
│         contexts: {
│           min: { min: 0 }
│         }
│       }
│
├─→ [STEP 4: Exception Creation]
│   └─→ I18nValidationPipe creates exception:
│       └─→ Throws I18nValidationException(validationErrors)
│
├─→ [STEP 5: Filter Catches Exception]
│   └─→ ValidationExceptionFilter.catch(exception)
│       │
│       ├─→ Extracts language: x-lang or accept-language
│       │
│       ├─→ For each validation error:
│       │   ├─→ Extracts constraint key (e.g., 'min')
│       │   ├─→ Maps to error code ('VALIDATION_MIN_VALUE')
│       │   ├─→ Gets constraint value from context
│       │   ├─→ Translates message:
│       │   │   └─→ i18n.translate('validation.min', {
│       │   │         lang: 'id',
│       │   │         args: { property: 'price', min: 0 }
│       │   │       })
│       │   │       → "Harga minimal 0"
│       │   │
│       │   └─→ Builds context object:
│       │       { min: 0, actualValue: -10 }
│       │
│       └─→ Transforms to object format:
│           errors: {
│             "price": {
│               value: -10,
│               code: "VALIDATION_MIN_VALUE",
│               message: "price must not be less than 0",
│               context_message: "Harga minimal 0",
│               context: { min: 0, actualValue: -10 }
│             }
│           }
│
└─→ [STEP 6: Error Response]
    └─→ Returns StandardResponse with validation errors
```

### 5. Custom Bad Request Flow

```
Controller Method
│
├─→ Business logic checks condition
│   └─→ Condition fails (e.g., product not found)
│
├─→ throwCustomBadRequest() called
│   │
│   ├─→ Creates special BadRequestException:
│   │   {
│   │     __isCustomBadRequest: true,  // Detection flag
│   │     statusCode: 4001,
│   │     message: 'products.errors.not_found',
│   │     errors: {
│   │       code: 'PRODUCT_NOT_FOUND',
│   │       message: 'products.errors.not_found_detail'
│   │     },
│   │     translationParams: { id: '123' }
│   │   }
│   │
│   └─→ throw new BadRequestException(customResponse)
│
├─→ ValidationExceptionFilter catches it
│   │
│   ├─→ Checks exception type: BadRequestException ✓
│   │
│   ├─→ Gets response: exception.getResponse()
│   │
│   ├─→ Detects custom format:
│   │   └─→ isCustomBadRequest(exceptionResponse)
│   │       └─→ Checks for __isCustomBadRequest flag ✓
│   │
│   ├─→ Extracts language from request:
│   │   └─→ request.headers['x-lang'] → 'id'
│   │
│   ├─→ Translates main message:
│   │   └─→ translateIfKey('products.errors.not_found', 'id', { id: '123' })
│   │       ├─→ Message contains '.' → Likely translation key
│   │       ├─→ i18n.translate('products.errors.not_found', { lang: 'id', args: { id: '123' } })
│   │       └─→ Returns: "Produk tidak ditemukan"
│   │
│   ├─→ Translates error message:
│   │   └─→ translateIfKey('products.errors.not_found_detail', 'id', { id: '123' })
│   │       └─→ Returns: "Produk dengan ID 123 tidak ada"
│   │
│   ├─→ Calculates request time:
│   │   └─→ Date.now() - request.startTime → 12ms
│   │
│   └─→ Builds custom response:
│       {
│         success: false,
│         statusCode: 4001,  // Custom code from utility
│         message: "Produk tidak ditemukan",  // Translated
│         data: null,
│         errors: {
│           code: "PRODUCT_NOT_FOUND",
│           message: "Produk dengan ID 123 tidak ada"  // Translated
│         },
│         timestamp: "2025-10-14T10:30:00.000Z",
│         path: "/api/products/123",
│         requestTime: 12
│       }
│
└─→ Sends HTTP 400 response with custom body
    └─→ Note: HTTP status is 400, but body statusCode is 4001
```

---

## Quick Reference

### Exception Types Quick Guide

| Exception Type | Status Code | Use Case | Filter Priority |
|---------------|-------------|----------|----------------|
| `ValidationException` | 400 | Field validation errors | 1 (Highest) |
| `I18nValidationException` | 400 | Auto validation from pipe | 1 (Highest) |
| `CustomBadRequest` | 400 (HTTP) / Custom (Body) | Custom business errors | 1 (Highest) |
| `NotFoundException` | 404 | Resource not found | 2 |
| `ConflictException` | 409 | Duplicates, conflicts | 2 |
| `BaseHttpException` | Varies | Generic HTTP errors | 2 |
| `DomainException` | Varies | Domain logic errors | 3 |
| `Any unhandled` | 500 | System errors | 4 (Lowest) |

### Response Format Quick Reference

**Success Response:**
```typescript
{
  success: true,
  statusCode: 200,
  message: "Request successful",
  data: { ... },
  errors: null,
  timestamp: "ISO-8601",
  path: "/api/...",
  requestTime: 25
}
```

**Error Response:**
```typescript
{
  success: false,
  statusCode: 400,
  message: "Error description",
  data: null,
  errors: { ... },  // Object or array depending on error type
  timestamp: "ISO-8601",
  path: "/api/...",
  requestTime: 15
}
```

### Language Header Examples

```http
# Priority 1: x-lang header
x-lang: en
x-lang: id

# Priority 2: accept-language header
accept-language: en-US,en;q=0.9,id;q=0.8

# Result: First match is used
# Falls back to 'en' if neither is present
```

---

## Summary

This NestJS application implements a robust, standardized request-response handling system with:

1. **Consistent Error Handling**: All errors follow the same `StandardResponse` format
2. **Comprehensive Validation**: Field-level validation with detailed error information
3. **I18n Support**: Full internationalization for messages, errors, and validation
4. **Flexible Error Codes**: Support for both HTTP and custom status codes
5. **Request Timing**: Automatic tracking of request processing time
6. **Type Safety**: TypeScript interfaces ensure compile-time correctness
7. **Maintainability**: Centralized exception handling and response transformation
8. **Developer Experience**: Clear error messages, context, and debugging information

The flow ensures that:
- **Every successful response** is wrapped in a consistent format
- **Every error** is caught, translated, and formatted consistently
- **Language preference** is respected throughout the application
- **Request timing** is tracked for performance monitoring
- **Context information** is preserved for debugging

This architecture provides a solid foundation for building scalable, maintainable, and user-friendly APIs.

---

**Version:** 1.0.0
**Last Updated:** 2025-10-14
**Author:** System Architecture Team
