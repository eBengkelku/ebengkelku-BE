# Response Transformer Quickstart

## Overview

This quickstart guide shows you how to use the Response Transformer system in 5 minutes. The Response Transformer automatically wraps all API responses in a standardized format with internationalization support.

---

## TL;DR

**What you get automatically:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { /* your data */ },
  "errors": null,
  "timestamp": "2025-10-14T10:30:45.123Z",
  "path": "/v1/products",
  "requestTime": 32
}
```

**Quick actions:**
- ✅ Custom message: Use `@ResponseMessage('Custom message')` decorator
- ✅ Translation: Use `@ResponseMessage('translation.key')` decorator
- ✅ Skip transform: Use `@SkipTransform()` decorator
- ✅ Multi-language: Send `x-lang: id` or `x-lang: en` header

---

## 1. Basic Usage (Zero Configuration)

The Response Transformer works automatically for **all endpoints**. You don't need to do anything!

### Example: Simple Controller

```typescript
@Controller('products')
export class ProductController {
  @Get()
  async findAll() {
    // Just return your data
    return { name: 'Product 1', price: 99.99 };
  }
}
```

### Response Output:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": {
    "name": "Product 1",
    "price": 99.99
  },
  "errors": null,
  "timestamp": "2025-10-14T10:30:45.123Z",
  "path": "/v1/products",
  "requestTime": 32
}
```

✅ **That's it!** All responses are automatically transformed.

---

## 2. Custom Success Messages

Use `@ResponseMessage()` decorator to customize the success message:

```typescript
import { ResponseMessage } from '@/common/decorators/response-message.decorator';

@Controller('products')
export class ProductController {
  @Post()
  @ResponseMessage('Product created successfully')
  async create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Put(':id')
  @ResponseMessage('Product updated successfully')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @ResponseMessage('Product deleted successfully')
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
```

### Response:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Product created successfully",  // ✅ Custom message
  "data": { /* created product */ },
  "errors": null,
  "timestamp": "2025-10-14T10:30:45.123Z",
  "path": "/v1/products",
  "requestTime": 45
}
```

---

## 3. Multi-Language Support (i18n)

Use **translation keys** instead of plain text for automatic language switching:

### Step 1: Use Translation Keys

```typescript
@Controller('products')
export class ProductController {
  @Get()
  @ResponseMessage('products.listed')  // Translation key
  async findAll() {
    return this.productService.findAll();
  }

  @Post()
  @ResponseMessage('products.created')  // Translation key
  async create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Put(':id')
  @ResponseMessage('products.updated')  // Translation key
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }
}
```

### Step 2: Test with Language Headers

**English Request:**
```bash
curl -X GET 'http://localhost:3000/v1/products' \
  -H 'x-lang: en'
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Products retrieved successfully",  // ✅ English
  "data": [...],
  "errors": null
}
```

**Indonesian Request:**
```bash
curl -X GET 'http://localhost:3000/v1/products' \
  -H 'x-lang: id'
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Produk berhasil diambil",  // ✅ Indonesian
  "data": [...],
  "errors": null
}
```

### Available Translation Keys:

| Key | English | Indonesian |
|-----|---------|------------|
| `products.listed` | Products retrieved successfully | Produk berhasil diambil |
| `products.created` | Product created successfully | Produk berhasil dibuat |
| `products.found` | Product found successfully | Produk berhasil ditemukan |
| `products.updated` | Product updated successfully | Produk berhasil diperbarui |
| `products.deleted` | Product deleted successfully | Produk berhasil dihapus |
| `common.listed` | Data retrieved successfully | Data berhasil diambil |
| `common.updated` | Data updated successfully | Data berhasil diperbarui |

**Location:** `/src/i18n/en/products.json` and `/src/i18n/id/products.json`

---

## 4. Skip Transformation (Raw Response)

Use `@SkipTransform()` when you need to return raw data without transformation:

```typescript
import { SkipTransform } from '@/common/decorators/response-message.decorator';

@Controller('health')
export class HealthController {
  @Get()
  @SkipTransform()  // ✅ Skip transformation
  async check() {
    return { status: 'ok', uptime: process.uptime() };
  }
}
```

### Response (Raw):

```json
{
  "status": "ok",
  "uptime": 12345
}
```

**Use cases:**
- Health check endpoints
- File downloads
- Third-party integrations
- Webhooks
- Custom format requirements

---

## 5. Paginated Responses

The transformer automatically handles pagination:

```typescript
@Controller('products')
export class ProductController {
  @Get()
  @ResponseMessage('products.listed')
  async findAll(@Query() query: PaginationDto) {
    // Return data with meta/pagination object
    return {
      data: [/* products */],
      meta: {
        current_page: 1,
        per_page: 10,
        total: 100,
        last_page: 10
      }
    };
  }
}
```

### Response:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": [/* products array */],
  "meta": {
    "current_page": 1,
    "per_page": 10,
    "total": 100,
    "last_page": 10
  },
  "errors": null,
  "timestamp": "2025-10-14T10:30:45.123Z",
  "path": "/v1/products?page=1&limit=10",
  "requestTime": 32
}
```

✅ The transformer flattens the structure automatically!

---

## 6. Error Responses (Automatic)

Error responses are **automatically transformed** by exception filters:

### Validation Error Example:

**Request:**
```bash
curl -X POST 'http://localhost:3000/v1/products' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test",
    "price": -100
  }'
```

**Response:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "data": null,
  "errors": {
    "price": {
      "value": -100,
      "code": "VALIDATION_MIN_VALUE",
      "message": "products.validation.price.min",
      "context_message": "Price must be greater than or equal to 1",
      "context": {
        "actualValue": -100
      }
    }
  },
  "timestamp": "2025-10-14T10:30:45.123Z",
  "path": "/v1/products",
  "requestTime": 15
}
```

✅ No code needed! Errors are handled automatically.

---

## 7. Request Timing

All responses include `requestTime` (in milliseconds) automatically:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Request successful",
  "data": {...},
  "errors": null,
  "timestamp": "2025-10-14T10:30:45.123Z",
  "path": "/v1/products",
  "requestTime": 32  // ✅ Automatic timing
}
```

Use this to:
- Monitor API performance
- Identify slow endpoints
- Track response time trends
- Debug performance issues

---

## 8. HTTP Status Codes

The transformer automatically uses the correct status code:

| HTTP Status | Message | When Used |
|-------------|---------|-----------|
| `200 OK` | Request successful | GET, PUT, DELETE |
| `201 Created` | Resource created successfully | POST |
| `202 Accepted` | Request accepted | Async operations |
| `204 No Content` | No content | Empty responses |

### Example: Custom Status Code

```typescript
@Post()
@HttpCode(HttpStatus.CREATED)  // 201
@ResponseMessage('products.created')
async create(@Body() dto: CreateProductDto) {
  return this.productService.create(dto);
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,  // ✅ Uses 201 Created
  "message": "Product created successfully",
  "data": {...}
}
```

---

## 9. Complete Example (Best Practices)

Here's a complete controller using all best practices:

```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ✅ List with pagination and translation
  @Get()
  @ResponseMessage('products.listed')
  async findAll(@Query() query: PaginationDto) {
    return this.productService.findAll(query);
  }

  // ✅ Create with translation
  @Post()
  @ResponseMessage('products.created')
  async create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  // ✅ Get single with translation
  @Get(':id')
  @ResponseMessage('products.found')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  // ✅ Update with translation
  @Put(':id')
  @ResponseMessage('products.updated')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto
  ) {
    return this.productService.update(id, dto);
  }

  // ✅ Delete with translation
  @Delete(':id')
  @ResponseMessage('products.deleted')
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
```

---

## 10. Testing with cURL

### Test English Response:
```bash
curl -X GET 'http://localhost:3000/v1/products' \
  -H 'x-lang: en'
```

### Test Indonesian Response:
```bash
curl -X GET 'http://localhost:3000/v1/products' \
  -H 'x-lang: id'
```

### Test Create with Translation:
```bash
curl -X POST 'http://localhost:3000/v1/products' \
  -H 'Content-Type: application/json' \
  -H 'x-lang: id' \
  -d '{
    "name": "Produk Baru",
    "description": "Deskripsi produk",
    "price": 99.99,
    "stock_quantity": 100,
    "category": "Electronics"
  }'
```

### Test Validation Error:
```bash
curl -X POST 'http://localhost:3000/v1/products' \
  -H 'Content-Type: application/json' \
  -H 'x-lang: en' \
  -d '{
    "name": "Test",
    "price": -100
  }'
```

---

## Quick Reference

### Decorators:

```typescript
// Custom message (plain text)
@ResponseMessage('Custom success message')

// Custom message (translation key)
@ResponseMessage('products.created')

// Skip transformation
@SkipTransform()

// Custom HTTP status
@HttpCode(HttpStatus.CREATED)
```

### Request Headers:

```typescript
// Set language to English
'x-lang': 'en'

// Set language to Indonesian
'x-lang': 'id'

// Alternative (fallback)
'Accept-Language': 'en-US,en;q=0.9'
```

### Response Structure:

```typescript
interface StandardResponse<T> {
  success: boolean;      // true for success, false for error
  statusCode: number;    // HTTP status code
  message: string;       // Success/error message
  data: T | null;        // Response data (null on error)
  errors: any | null;    // Error details (null on success)
  timestamp: string;     // ISO timestamp
  path?: string;         // Request path
  requestTime?: number;  // Processing time in ms
}
```

---

## Common Scenarios

### Scenario 1: Simple CRUD Operations

```typescript
@Get()
@ResponseMessage('items.listed')
async findAll() { return items; }

@Post()
@ResponseMessage('items.created')
async create(@Body() dto) { return item; }

@Put(':id')
@ResponseMessage('items.updated')
async update(@Param('id') id, @Body() dto) { return item; }

@Delete(':id')
@ResponseMessage('items.deleted')
async remove(@Param('id') id) { return null; }
```

### Scenario 2: Health Check (Skip Transform)

```typescript
@Get('health')
@SkipTransform()
async health() {
  return { status: 'ok' };
}
```

### Scenario 3: Download File (Skip Transform)

```typescript
@Get('download/:id')
@SkipTransform()
async download(@Param('id') id: string, @Res() res: Response) {
  const file = await this.fileService.getFile(id);
  return res.download(file.path);
}
```

### Scenario 4: Custom Status Code

```typescript
@Post()
@HttpCode(HttpStatus.ACCEPTED)  // 202
@ResponseMessage('items.processing')
async process(@Body() dto) {
  // Start async processing
  return { jobId: '123' };
}
```

---

## Next Steps

1. ✅ **Use translation keys** for all messages (not plain text)
2. ✅ **Test with both languages** (EN and ID)
3. ✅ **Monitor `requestTime`** for performance
4. ✅ **Add `@SkipTransform()`** only when needed
5. ✅ **Follow naming conventions** for translation keys

### Learn More:

- 📖 **Full Documentation:** [`architecture-standardized-response-format-implementation-documentation.md`](./architecture-standardized-response-format-implementation-documentation.md)
- 📖 **Error Handling:** [`error-handling-domain-error-codes-quickstart.md`](./error-handling-domain-error-codes-quickstart.md)
- 📖 **Validation Errors:** [`validation-error-format-examples.md`](./validation-error-format-examples.md)
- 📖 **i18n Guide:** [`domain-i18n-pattern-guide.md`](./domain-i18n-pattern-guide.md)

---

## Troubleshooting

### Issue: Message not translating

**Solution:**
1. Check translation key exists in `/src/i18n/en/products.json`
2. Verify `x-lang` header is sent correctly
3. Ensure key uses dot notation (e.g., `products.created`)

### Issue: Response not transforming

**Solution:**
1. Check if `@SkipTransform()` is used
2. Verify interceptor is registered in `common.module.ts`
3. Check if endpoint returns standard data format

### Issue: Request time is `undefined`

**Solution:**
1. Verify `RequestTimingMiddleware` is registered in `app.module.ts`
2. Check middleware order (should be first)
3. Ensure middleware is applied to all routes

---

## Summary

✅ **Automatic:** All responses are transformed automatically
✅ **Custom Messages:** Use `@ResponseMessage()` decorator
✅ **Multi-Language:** Use translation keys + `x-lang` header
✅ **Skip Transform:** Use `@SkipTransform()` when needed
✅ **Performance:** Track with `requestTime` field
✅ **Consistent:** Same format for all endpoints

**You're ready to use the Response Transformer!** 🎉

---

**Version:** 1.0.0  
**Last Updated:** 2025-10-14  
**Related Files:**
- `src/common/interceptors/response-transform.interceptor.ts`
- `src/common/decorators/response-message.decorator.ts`
- `src/common/middlewares/request-timing.middleware.ts`

For questions or issues, please refer to the full documentation or contact the development team.
