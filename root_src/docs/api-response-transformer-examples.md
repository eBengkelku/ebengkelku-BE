# Response Transformer Examples

## Overview

Practical examples of Response Transformer usage in common scenarios.

---

## TL;DR

**5 Examples:** Basic CRUD, Custom messages + i18n, Pagination, Skip transformation, Combined patterns.

**Quick:** Auto-transform everywhere. Use `@ResponseMessage('key')` for i18n. Use `@SkipTransform()` for raw responses.

---

## Example 1: Basic CRUD (Zero Config)

```typescript
@Controller('v1/users')
export class UserController {
  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get()
  async findAll() {
    return this.userService.findAll();
  }

  @Put(':id')
  async update(@Param('id') id, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }
}
```

**Response:** Standard format with `success: true`, `statusCode: 200`, `message`, `data`, `errors: null`, `timestamp`, `requestTime`.

**Key:** All responses auto-transformed.

---

## Example 2: Custom Messages & i18n

```typescript
@Controller('v1/products')
export class ProductController {
  @Get()
  @ResponseMessage('products.listed')
  async findAll() {
    return this.productService.findAll();
  }

  @Post()
  @ResponseMessage('products.created')
  async create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Put(':id')
  @ResponseMessage('products.updated')
  async update(@Param('id') id, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @ResponseMessage('products.deleted')
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
```

**Translation files:**

`/src/i18n/en/products.json`:

```json
{
  "listed": "Products retrieved successfully",
  "created": "Product created successfully"
}
```

`/src/i18n/id/products.json`:

```json
{ "listed": "Produk berhasil diambil", "created": "Produk berhasil dibuat" }
```

**Test:**

```bash
curl -H 'x-lang: en' http://localhost:3000/v1/products
curl -H 'x-lang: id' http://localhost:3000/v1/products
```

**Response (EN):** `"message": "Products retrieved successfully"`

**Response (ID):** `"message": "Produk berhasil diambil"`

**Key:** Use translation keys + `x-lang` header.

---

## Example 3: Paginated Responses

```typescript
@Controller('v1/products')
export class ProductController {
  @Get()
  @ResponseMessage('products.listed')
  async findAll(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.productService.findAllPaginated(page, limit);
  }
}
```

**Service:** Return `{ data, meta }` with pagination info.

**Response:** Includes `data` array + `meta` object with `current_page`, `per_page`, `total`, `last_page`.

**Key:** Transformer flattens `{ data, meta }` automatically.

---

## Example 4: Skip Transformation

```typescript
@Controller('v1')
export class SpecialController {
  @Get('health')
  @SkipTransform()
  async healthCheck() {
    return { status: 'ok', uptime: process.uptime() };
  }

  @Get('metrics')
  @SkipTransform()
  async metrics() {
    return { requests: 12345, memory: process.memoryUsage().heapUsed };
  }

  @Post('webhooks/stripe')
  @SkipTransform()
  async webhook(@Body() payload: any) {
    await this.paymentService.handle(payload);
    return { received: true };
  }

  @Get('files/:id/download')
  @SkipTransform()
  async download(@Param('id') id: string, @Res() res: Response) {
    const file = await this.fileService.getFile(id);
    res.set({ 'Content-Disposition': `attachment; filename="${file.name}"` });
    return new StreamableFile(file.buffer);
  }
}
```

**Response (Raw):**

```json
{ "status": "ok", "uptime": 12345.678 }
```

**When:** Health checks, metrics, downloads, webhooks, legacy APIs.

---

## Example 5: Combined Patterns

```typescript
@Controller('v1/products')
@ApiTags('products')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductController {
  @Get()
  @Public()
  @ResponseMessage('products.listed')
  async findAll(@Query('page') page = 1) {
    return this.productService.findAllPaginated(page, 10);
  }

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('products.created')
  @UseInterceptors(FileInterceptor('image'))
  async create(@Body() dto: CreateProductDto, @UploadedFile() image?) {
    return this.productService.createWithImage(dto, image);
  }

  @Put(':id')
  @Roles('admin', 'manager')
  @ResponseMessage('products.updated')
  async update(@Param('id') id, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ResponseMessage('products.deleted')
  async remove(@Param('id') id: string) {
    await this.productService.remove(id);
    return { id, deleted: true };
  }
}
```

**Combines:** Auth, roles, file upload, custom messages, status codes, i18n, pagination.

---

## Quick Reference

| Scenario       | Decorator                  | Status |
| -------------- | -------------------------- | ------ |
| Simple CRUD    | None                       | 200    |
| Custom message | `@ResponseMessage('text')` | 200    |
| i18n           | `@ResponseMessage('key')`  | 200    |
| New resource   | `@HttpCode(201)`           | 201    |
| Skip           | `@SkipTransform()`         | Any    |

---

## Best Practices

**✅ DO:**

- Use translation keys (`products.created`)
- Return `{ data, meta }` for pagination
- Use `@SkipTransform()` for downloads/webhooks
- Test with `x-lang: en` and `x-lang: id`

**❌ DON'T:**

- Manually wrap responses
- Use plain text in i18n apps
- Skip transform unnecessarily

---

## Error Responses (Automatic)

**Validation (400):** `"success": false`, errors object with validation details.

**Not Found (404):** `"success": false`, error code and context.

**Key:** All errors auto-transformed with `success: false`.

---

## Related Documentation

- 📖 **Quickstart:** [`api-response-transformer-quickstart.md`](./api-response-transformer-quickstart.md)
- 📖 **Full Docs:** [`architecture-standardized-response-format-implementation-documentation.md`](./architecture-standardized-response-format-implementation-documentation.md)
- 📖 **Errors:** [`error-handling-domain-error-codes-guide.md`](./error-handling-domain-error-codes-guide.md)
- 📖 **i18n:** [`domain-i18n-pattern-guide.md`](./domain-i18n-pattern-guide.md)

---

**Version:** 1.0.0 | **Last Updated:** 2025-10-14
