# Auto-CRUD Pattern Implementation Guide

This guide explains how to implement and extend the Laravel-inspired Auto-CRUD system in this NestJS application.

> **📁 Example Implementations:** See complete working examples in the `examples/products/` directory:
>
> - `examples/products/products-laravel.service.ts` - Complete service implementation
> - `examples/products/products-laravel.controller.ts` - Complete controller implementation
> - `examples/products/products-enhanced.service.ts` - Advanced search features
>
> These examples demonstrate the patterns described in this guide. The main implementation is in `src/domains/products/`.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [Creating DTOs](#creating-dtos)
5. [Custom Services](#custom-services)
6. [Custom Controllers](#custom-controllers)
7. [Content Type Support](#content-type-support)
8. [Internationalization](#internationalization)
9. [Advanced Features](#advanced-features)
10. [Best Practices](#best-practices)

## Overview

The Auto-CRUD pattern automatically generates RESTful API endpoints for any domain while allowing you to add custom business logic on top. This approach combines the speed of code generation with the flexibility of manual customization.

### What You Get Automatically

For each domain added to the system, you automatically get:

- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Advanced pagination and filtering
- ✅ Search capabilities
- ✅ Validation with internationalization
- ✅ Soft delete support
- ✅ Utility endpoints (combo lists, rules, etc.)
- ✅ Multiple content type support (JSON, form-data, URL-encoded)

### What You Can Customize

- 🎯 Custom business methods
- 🎯 Domain-specific validation rules
- 🎯 Additional endpoints
- 🎯 Custom data transformations
- 🎯 Business logic workflows

## Quick Start

### 1. Add Your Domain to Auto-CRUD

Edit `src/common/modules/auto-crud.module.ts`:

```typescript
export const AUTO_CRUD_MODELS: AutoCrudOptions[] = [
  {
    entityName: 'Product', // Your domain name
    tableName: 'products', // Database table
    dtoClass: CreateProductDto,
    serviceClass: ProductService, // Optional: Custom service
    controllerClass: ProductController, // Optional: Custom controller
    descColumns: ['name', 'description'],
    fillable: ['name', 'description', 'price', 'category', 'stock_quantity'],
    softDeletes: true,
    rules: {
      name: 'required|string|max:255',
      price: 'required|numeric|min:1',
      description: 'nullable|string',
      category: 'nullable|string|max:100',
      stock_quantity: 'required|integer|min:0',
    },
  },
  // Add your new domain here:
  {
    entityName: 'Category',
    tableName: 'categories',
    dtoClass: CreateCategoryDto,
    descColumns: ['name'],
    fillable: ['name', 'description', 'parent_id'],
    softDeletes: true,
    rules: {
      name: 'required|string|max:255',
      description: 'nullable|string',
      parent_id: 'nullable|integer',
    },
  },
];
```

### 2. Create Your DTO

Create `src/domains/categories/dto/create-category.dto.ts`:

```typescript
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'categories.validation.name.required' })
  @IsString({ message: 'categories.validation.name.string' })
  @Length(1, 255, { message: 'categories.validation.name.length' })
  name: string;

  @IsOptional()
  @IsString({ message: 'categories.validation.description.string' })
  @Length(0, 1000, { message: 'categories.validation.description.maxLength' })
  description?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : parseInt(value)))
  @IsNumber({}, { message: 'categories.validation.parent_id.number' })
  parent_id?: number;
}
```

### 3. Add Translation Files

Create `src/i18n/en/categories.json`:

```json
{
  "title": "Categories",
  "validation": {
    "name": {
      "required": "Category name is required",
      "string": "Category name must be a text value",
      "length": "Category name must be between 1 and 255 characters"
    },
    "description": {
      "string": "Description must be a text value",
      "maxLength": "Description cannot exceed 1000 characters"
    },
    "parent_id": {
      "number": "Parent ID must be a valid number"
    }
  },
  "created": "Category created successfully",
  "updated": "Category updated successfully",
  "deleted": "Category deleted successfully"
}
```

### 4. Create Database Migration

Create `src/database/migrations/003_create_categories_table.js`:

```javascript
exports.up = function (knex) {
  return knex.schema.createTable('categories', function (table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.integer('parent_id').unsigned().nullable();
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();

    table
      .foreign('parent_id')
      .references('id')
      .inTable('categories')
      .onDelete('SET NULL');
    table.index(['name']);
    table.index(['parent_id']);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('categories');
};
```

### 5. Run Migration

```bash
npx knex migrate:latest
```

### 6. Test Your New API

```bash
# Test the auto-generated endpoints
curl -X GET http://localhost:3004/v1/categories
curl -X POST http://localhost:3004/v1/categories \
  -H "Content-Type: application/json" \
  -d '{"name": "Electronics", "description": "Electronic products"}'
```

## Configuration

### AutoCrudOptions Interface

```typescript
interface AutoCrudOptions {
  entityName: string; // Domain name (PascalCase)
  tableName: string; // Database table name
  dtoClass: any; // Validation DTO class
  serviceClass?: any; // Custom service (optional)
  controllerClass?: any; // Custom controller (optional)
  routePrefix?: string; // API route prefix (default: v1/{tableName})
  primaryKey?: string; // Primary key column (default: 'id')
  descColumns?: string[]; // Columns for descriptions/combo lists
  fillable?: string[]; // Fillable columns for mass assignment
  softDeletes?: boolean; // Enable soft deletes (default: false)
  timestampColumns?: {
    // Timestamp configuration
    created?: string; // Created at column (default: 'created_at')
    updated?: string; // Updated at column (default: 'updated_at')
    deleted?: string; // Deleted at column (default: 'deleted_at')
  };
  rules?: Record<string, string>; // Validation rules
}
```

### Advanced Configuration Example

```typescript
{
  entityName: 'Order',
  tableName: 'orders',
  dtoClass: CreateOrderDto,
  serviceClass: OrderService,
  controllerClass: OrderController,
  routePrefix: 'v1/sales/orders',  // Custom route
  primaryKey: 'order_id',          // Custom primary key
  descColumns: ['order_number', 'customer_name'],
  fillable: ['customer_id', 'total_amount', 'status', 'notes'],
  softDeletes: true,
  timestampColumns: {
    created: 'order_date',
    updated: 'last_modified',
    deleted: 'cancelled_at'
  },
  rules: {
    customer_id: 'required|integer|exists:customers,id',
    total_amount: 'required|numeric|min:0',
    status: 'required|string|in:pending,confirmed,shipped,delivered,cancelled',
    notes: 'nullable|string|max:500'
  }
}
```

## Creating DTOs

### Basic DTO Structure with Swagger Documentation

```typescript
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Length,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Customer ID for the order',
    example: 123,
    type: 'integer',
  })
  @IsNotEmpty({ message: 'orders.validation.customer_id.required' })
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: 'orders.validation.customer_id.number' })
  customer_id: number;

  @ApiProperty({
    description: 'Total amount for the order',
    example: 299.99,
    minimum: 0,
    type: 'number',
    format: 'float',
  })
  @IsNotEmpty({ message: 'orders.validation.total_amount.required' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'orders.validation.total_amount.number' },
  )
  @Min(0, { message: 'orders.validation.total_amount.min' })
  total_amount: number;

  @ApiProperty({
    description: 'Order status',
    example: 'pending',
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
  })
  @IsNotEmpty({ message: 'orders.validation.status.required' })
  @IsEnum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], {
    message: 'orders.validation.status.enum',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Additional order notes',
    example: 'Please deliver after 5 PM',
    maxLength: 500,
  })
  @IsNumber({}, { message: 'orders.validation.customer_id.number' })
  customer_id: number;

  @IsNotEmpty({ message: 'orders.validation.total_amount.required' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'orders.validation.total_amount.number' },
  )
  @Min(0, { message: 'orders.validation.total_amount.min' })
  total_amount: number;

  @IsNotEmpty({ message: 'orders.validation.status.required' })
  @IsEnum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], {
    message: 'orders.validation.status.enum',
  })
  status: string;

  @IsOptional()
  @IsString({ message: 'orders.validation.notes.string' })
  @Length(0, 500, { message: 'orders.validation.notes.length' })
  notes?: string;
}
```

### Swagger API Documentation for DTOs

#### Required vs Optional Properties

Use `@ApiProperty` for required fields and `@ApiPropertyOptional` for optional fields:

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  // Required property
  @ApiProperty({
    description: 'Product name',
    example: 'iPhone 15 Pro',
    minLength: 1,
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  // Optional property
  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Latest iPhone with advanced camera system',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
```

#### Common API Property Configurations

```typescript
// String with length constraints
@ApiProperty({
  description: 'Product name',
  example: 'iPhone 15 Pro',
  minLength: 1,
  maxLength: 255,
})

// Number with min/max values
@ApiProperty({
  description: 'Product price',
  example: 1199.99,
  minimum: 1,
  type: 'number',
  format: 'float',
})

// Integer field
@ApiProperty({
  description: 'Stock quantity',
  example: 50,
  minimum: 0,
  type: 'integer',
})

// Enum field
@ApiProperty({
  description: 'Product status',
  example: 'active',
  enum: ['active', 'inactive', 'discontinued'],
})

// Array field
@ApiProperty({
  description: 'Product tags',
  example: ['electronics', 'mobile', 'apple'],
  type: [String],
})

// Date field
@ApiProperty({
  description: 'Launch date',
  example: '2024-01-15T10:00:00Z',
  type: 'string',
  format: 'date-time',
})
```

#### Controller API Body Documentation

Add comprehensive examples to your controller methods:

```typescript
@ApiBody({
  type: CreateProductDto,
  description: 'Product data to create',
  examples: {
    'Complete Product': {
      value: {
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with advanced camera system',
        price: 1199.99,
        stock_quantity: 50,
        category: 'Electronics'
      }
    },
    'Minimal Product': {
      value: {
        name: 'Basic Product',
        price: 99.99,
        stock_quantity: 10
      }
    }
  }
})
```

### Form-Data Support

The system automatically handles form-data through the `FormDataInterceptor`. When using form-data:

- Numeric fields are automatically parsed
- Empty strings are converted to `undefined`
- File uploads are supported
- All validation rules still apply

### Complex Validation Examples

```typescript
export class CreateProductDto {
  // Array validation
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray({ message: 'products.validation.tags.array' })
  @IsString({ each: true, message: 'products.validation.tags.string' })
  tags?: string[];

  // Date validation
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate({ message: 'products.validation.launch_date.date' })
  launch_date?: Date;

  // Custom validation
  @IsOptional()
  @IsString({ message: 'products.validation.sku.string' })
  @Matches(/^[A-Z0-9-]+$/, { message: 'products.validation.sku.format' })
  sku?: string;

  // Conditional validation
  @ValidateIf((o) => o.type === 'digital')
  @IsNotEmpty({ message: 'products.validation.download_url.required' })
  @IsUrl({}, { message: 'products.validation.download_url.url' })
  download_url?: string;
}
```

## Custom Services

### Extending BaseKnexService

```typescript
import { Injectable } from '@nestjs/common';
import { BaseKnexService } from '../../common/services/base-knex.service';

@Injectable()
export class ProductService extends BaseKnexService {
  // Override base methods if needed
  async create(data: any): Promise<any> {
    // Add business logic before creation
    if (data.sku) {
      const existingSku = await this.queryBuilder()
        .where('sku', data.sku)
        .first();

      if (existingSku) {
        throw new Error('SKU already exists');
      }
    }

    // Call parent method
    const result = await super.create(data);

    // Add business logic after creation
    await this.updateCategoryStats(data.category_id);

    return result;
  }

  // Custom business methods
  async findByCategory(category: string, filters: any = {}) {
    const qb = this.queryBuilder().where('category', 'LIKE', `%${category}%`);

    // Apply filters
    if (filters.minPrice) qb.where('price', '>=', filters.minPrice);
    if (filters.maxPrice) qb.where('price', '<=', filters.maxPrice);
    if (filters.inStock) qb.where('stock_quantity', '>', 0);
    if (filters.featured) qb.where('is_featured', true);

    // Handle sorting
    if (filters.sortBy) {
      const sortOrder = filters.sortOrder || 'ASC';
      qb.orderBy(filters.sortBy, sortOrder);
    }

    return qb.select('*');
  }

  async getLowStockProducts(threshold: number = 10) {
    return this.queryBuilder()
      .where('stock_quantity', '<=', threshold)
      .where('stock_quantity', '>', 0)
      .select('*')
      .orderBy('stock_quantity', 'ASC');
  }

  async bulkUpdateStock(updates: Array<{ id: number; quantity: number }>) {
    const trx = await this.knex.transaction();

    try {
      const results = [];

      for (const update of updates) {
        const result = await trx(this.tableName)
          .where('id', update.id)
          .update({
            stock_quantity: update.quantity,
            updated_at: trx.fn.now(),
          })
          .returning('*');

        results.push(result[0]);
      }

      await trx.commit();
      return { success: true, updated: results };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async getProductStats() {
    const stats = await this.queryBuilder()
      .select([
        this.knex.raw('COUNT(*) as total_products'),
        this.knex.raw('SUM(stock_quantity) as total_stock'),
        this.knex.raw('AVG(price) as average_price'),
        this.knex.raw(
          'COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock',
        ),
        this.knex.raw(
          'COUNT(CASE WHEN stock_quantity <= 10 THEN 1 END) as low_stock',
        ),
      ])
      .first();

    return {
      ...stats,
      average_price: parseFloat(stats.average_price || 0),
      stock_status: {
        in_stock: stats.total_products - stats.out_of_stock,
        out_of_stock: parseInt(stats.out_of_stock),
        low_stock: parseInt(stats.low_stock),
      },
    };
  }

  async advancedSearch(criteria: any) {
    const qb = this.queryBuilder();

    // Text search
    if (criteria.search) {
      qb.where(function () {
        this.where('name', 'LIKE', `%${criteria.search}%`)
          .orWhere('description', 'LIKE', `%${criteria.search}%`)
          .orWhere('sku', 'LIKE', `%${criteria.search}%`);
      });
    }

    // Price range
    if (criteria.priceMin) qb.where('price', '>=', criteria.priceMin);
    if (criteria.priceMax) qb.where('price', '<=', criteria.priceMax);

    // Stock range
    if (criteria.stockMin !== undefined)
      qb.where('stock_quantity', '>=', criteria.stockMin);
    if (criteria.stockMax !== undefined)
      qb.where('stock_quantity', '<=', criteria.stockMax);

    // Category filter
    if (criteria.category) {
      qb.where('category', 'LIKE', `%${criteria.category}%`);
    }

    // Date range
    if (criteria.createdAfter) {
      qb.where('created_at', '>=', criteria.createdAfter);
    }
    if (criteria.createdBefore) {
      qb.where('created_at', '<=', criteria.createdBefore);
    }

    // Sorting
    const sortBy = criteria.sortBy || 'created_at';
    const sortOrder = criteria.sortOrder || 'DESC';
    qb.orderBy(sortBy, sortOrder);

    return qb.select('*');
  }

  // Private helper methods
  private async updateCategoryStats(categoryId: number) {
    if (!categoryId) return;

    const stats = await this.queryBuilder()
      .where('category_id', categoryId)
      .select([
        this.knex.raw('COUNT(*) as product_count'),
        this.knex.raw('SUM(stock_quantity) as total_stock'),
      ])
      .first();

    // Update category table with stats
    await this.knex('categories').where('id', categoryId).update({
      product_count: stats.product_count,
      total_stock: stats.total_stock,
      updated_at: this.knex.fn.now(),
    });
  }
}
```

## Custom Controllers

### Extending BaseKnexController

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Headers,
  UseInterceptors,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { BaseKnexController } from '../../common/controllers/base-knex.controller';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductService } from './product.service';
import { FormDataInterceptor } from '../../common/interceptors/form-data.interceptor';

@Controller('v1/products')
@ApiTags('products')
export class ProductController extends BaseKnexController {
  entityName = 'Product'; // Required by base controller

  constructor(private readonly productService: ProductService) {
    super(productService);
  }

  // Override base methods if needed
  @Post()
  @UseInterceptors(FormDataInterceptor)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  @ApiOperation({ summary: 'Create new product' })
  async create(
    @Body() createDto: CreateProductDto,
    @Headers('x-lang') lang?: string,
  ) {
    return this.productService.create(createDto);
  }

  // Custom endpoints beyond basic CRUD

  @Get('category/:category')
  @ApiOperation({ summary: 'Get products by category with filters' })
  @ApiParam({ name: 'category', description: 'Product category' })
  @ApiQuery({ name: 'minPrice', required: false, description: 'Minimum price' })
  @ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum price' })
  @ApiQuery({
    name: 'inStock',
    required: false,
    description: 'Filter in-stock products',
  })
  async getByCategory(
    @Param('category') category: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('inStock') inStock?: boolean,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const filters = { minPrice, maxPrice, inStock, sortBy, sortOrder };
    return this.productService.findByCategory(category, filters);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get products with low stock' })
  @ApiQuery({
    name: 'threshold',
    required: false,
    description: 'Stock threshold (default: 10)',
  })
  async getLowStock(@Query('threshold') threshold?: number) {
    return this.productService.getLowStockProducts(threshold);
  }

  @Post('bulk-stock-update')
  @ApiOperation({ summary: 'Update stock quantities for multiple products' })
  @ApiBody({
    description: 'Array of stock updates',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          quantity: { type: 'number' },
        },
      },
    },
  })
  async bulkUpdateStock(
    @Body() updates: Array<{ id: number; quantity: number }>,
  ) {
    return this.productService.bulkUpdateStock(updates);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get product statistics and analytics' })
  async getStats() {
    return this.productService.getProductStats();
  }

  @Post('advanced-search')
  @ApiOperation({ summary: 'Advanced search with multiple filters' })
  @ApiBody({
    description: 'Search criteria',
    schema: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description: 'Text search in name, description, SKU',
        },
        priceMin: { type: 'number', description: 'Minimum price' },
        priceMax: { type: 'number', description: 'Maximum price' },
        stockMin: { type: 'number', description: 'Minimum stock quantity' },
        stockMax: { type: 'number', description: 'Maximum stock quantity' },
        category: { type: 'string', description: 'Category filter' },
        createdAfter: {
          type: 'string',
          format: 'date',
          description: 'Created after date',
        },
        createdBefore: {
          type: 'string',
          format: 'date',
          description: 'Created before date',
        },
        sortBy: { type: 'string', description: 'Sort field' },
        sortOrder: {
          type: 'string',
          enum: ['ASC', 'DESC'],
          description: 'Sort direction',
        },
      },
    },
  })
  async advancedSearch(@Body() criteria: any) {
    return this.productService.advancedSearch(criteria);
  }

  // File upload example
  @Post('upload/:id')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  @ApiOperation({ summary: 'Upload product image' })
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-lang') lang?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const updatedProduct = await this.productService.update(
      id,
      { image_path: file.path },
      undefined,
      lang,
    );

    return {
      message: 'Product image uploaded successfully',
      product: updatedProduct,
      file: {
        filename: file.filename,
        originalname: file.originalname,
        path: file.path,
        size: file.size,
      },
    };
  }
}
```

## Content Type Support

The system automatically supports multiple content types:

### 1. JSON (Default)

```javascript
const response = await fetch('/v1/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept-Language': 'en',
    Authorization: 'Bearer YOUR_TOKEN',
  },
  body: JSON.stringify({
    name: 'MacBook Pro',
    price: 2999,
    stock_quantity: 10,
    category: 'Electronics',
  }),
});
```

### 2. Form-Data (File Uploads)

```javascript
const formData = new FormData();
formData.append('name', 'MacBook Pro');
formData.append('price', '2999');
formData.append('stock_quantity', '10');
formData.append('category', 'Electronics');
formData.append('image', fileInput.files[0]);

const response = await fetch('/v1/products', {
  method: 'POST',
  headers: {
    'Accept-Language': 'en',
    Authorization: 'Bearer YOUR_TOKEN',
  },
  body: formData,
});
```

### 3. URL-Encoded (Traditional Forms)

```javascript
const params = new URLSearchParams();
params.append('name', 'MacBook Pro');
params.append('price', '2999');
params.append('stock_quantity', '10');
params.append('category', 'Electronics');

const response = await fetch('/v1/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Accept-Language': 'en',
    Authorization: 'Bearer YOUR_TOKEN',
  },
  body: params,
});
```

## Internationalization

### Setting Up Translation Files

Create translation files for each domain:

#### English (`src/i18n/en/products.json`)

```json
{
  "title": "Products",
  "validation": {
    "name": {
      "required": "Product name is required",
      "string": "Product name must be a text value",
      "length": "Product name must be between 1 and 255 characters"
    },
    "price": {
      "required": "Price is required",
      "number": "Price must be a valid number",
      "min": "Price must be greater than or equal to {min}"
    },
    "category": {
      "string": "Category must be a text value",
      "maxLength": "Category cannot exceed {max} characters"
    }
  },
  "messages": {
    "created": "Product created successfully",
    "updated": "Product updated successfully",
    "deleted": "Product deleted successfully",
    "not_found": "Product not found"
  },
  "errors": {
    "sku_exists": "SKU already exists",
    "out_of_stock": "Product is out of stock",
    "insufficient_stock": "Insufficient stock quantity"
  }
}
```

#### Indonesian (`src/i18n/id/products.json`)

```json
{
  "title": "Produk",
  "validation": {
    "name": {
      "required": "Nama produk wajib diisi",
      "string": "Nama produk harus berupa teks",
      "length": "Nama produk harus antara 1 hingga 255 karakter"
    },
    "price": {
      "required": "Harga wajib diisi",
      "number": "Harga harus berupa angka yang valid",
      "min": "Harga harus lebih besar atau sama dengan {min}"
    },
    "category": {
      "string": "Kategori harus berupa teks",
      "maxLength": "Kategori tidak boleh lebih dari {max} karakter"
    }
  },
  "messages": {
    "created": "Produk berhasil dibuat",
    "updated": "Produk berhasil diperbarui",
    "deleted": "Produk berhasil dihapus",
    "not_found": "Produk tidak ditemukan"
  },
  "errors": {
    "sku_exists": "SKU sudah ada",
    "out_of_stock": "Produk habis",
    "insufficient_stock": "Stok tidak mencukupi"
  }
}
```

### Using Translations in Services

```typescript
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ProductService extends BaseKnexService {
  constructor(
    databaseService: DatabaseService,
    private readonly i18n: I18nService,
  ) {
    super(databaseService);
  }

  async create(data: any, lang?: string): Promise<any> {
    // Business logic...

    const result = await super.create(data);

    return {
      success: true,
      message: this.i18n.t('products.messages.created', { lang }),
      data: result,
    };
  }

  async checkStock(productId: number, requiredQuantity: number, lang?: string) {
    const product = await this.findOne(productId);

    if (!product) {
      throw new NotFoundException(
        this.i18n.t('products.messages.not_found', { lang }),
      );
    }

    if (product.stock_quantity === 0) {
      throw new BadRequestException(
        this.i18n.t('products.errors.out_of_stock', { lang }),
      );
    }

    if (product.stock_quantity < requiredQuantity) {
      throw new BadRequestException(
        this.i18n.t('products.errors.insufficient_stock', {
          lang,
          args: {
            available: product.stock_quantity,
            required: requiredQuantity,
          },
        }),
      );
    }

    return true;
  }
}
```

## Advanced Features

### Soft Deletes

Enable soft deletes in your configuration:

```typescript
{
  entityName: 'Product',
  tableName: 'products',
  softDeletes: true, // Enable soft deletes
  timestampColumns: {
    deleted: 'deleted_at' // Custom deleted column name
  }
}
```

The system will automatically:

- Filter out deleted records in queries
- Add `deleted_at` timestamp on delete
- Provide restore functionality

### Custom Validation Rules

Create custom validators:

```typescript
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: true })
export class IsUniqueSkuConstraint implements ValidatorConstraintInterface {
  async validate(sku: string) {
    // Check if SKU exists in database
    const existing = await knex('products').where('sku', sku).first();
    return !existing;
  }

  defaultMessage() {
    return 'products.validation.sku.unique';
  }
}

export function IsUniqueSku(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniqueSkuConstraint,
    });
  };
}

// Usage in DTO
export class CreateProductDto {
  @IsOptional()
  @IsString({ message: 'products.validation.sku.string' })
  @IsUniqueSku({ message: 'products.validation.sku.unique' })
  sku?: string;
}
```

### Database Transactions

Handle complex operations with transactions:

```typescript
async bulkCreateProducts(products: CreateProductDto[]): Promise<any> {
  const trx = await this.knex.transaction();

  try {
    const results = [];

    for (const productData of products) {
      // Validate each product
      await this.validateProduct(productData, trx);

      // Create product
      const [productId] = await trx(this.tableName)
        .insert({
          ...productData,
          created_at: trx.fn.now(),
          updated_at: trx.fn.now()
        });

      // Update category stats
      await this.updateCategoryStats(productData.category_id, trx);

      results.push(productId);
    }

    await trx.commit();
    return { success: true, created: results };
  } catch (error) {
    await trx.rollback();
    throw error;
  }
}

private async validateProduct(data: any, trx: any) {
  if (data.sku) {
    const existing = await trx('products').where('sku', data.sku).first();
    if (existing) {
      throw new BadRequestException('SKU already exists');
    }
  }
}
```

### Event-Driven Architecture

Implement events for complex workflows:

```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProductService extends BaseKnexService {
  constructor(
    databaseService: DatabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(databaseService);
  }

  async create(data: any): Promise<any> {
    const result = await super.create(data);

    // Emit events for other services to handle
    this.eventEmitter.emit('product.created', {
      productId: result.id,
      categoryId: data.category_id,
      stockQuantity: data.stock_quantity,
    });

    return result;
  }

  async update(id: number, data: any): Promise<any> {
    const oldProduct = await this.findOne(id);
    const result = await super.update(id, data);

    // Check for stock changes
    if (oldProduct.stock_quantity !== data.stock_quantity) {
      this.eventEmitter.emit('product.stock.changed', {
        productId: id,
        oldQuantity: oldProduct.stock_quantity,
        newQuantity: data.stock_quantity,
      });
    }

    return result;
  }
}

// Event listeners in other services
@Injectable()
export class InventoryService {
  @OnEvent('product.created')
  async handleProductCreated(payload: any) {
    // Update inventory tracking
    await this.createInventoryRecord(payload);
  }

  @OnEvent('product.stock.changed')
  async handleStockChange(payload: any) {
    // Log stock movement
    await this.logStockMovement(payload);

    // Check for low stock alerts
    if (payload.newQuantity <= 10) {
      await this.sendLowStockAlert(payload.productId);
    }
  }
}
```

## Best Practices

### 1. Domain Organization

```
src/domains/
├── products/
│   ├── dto/
│   │   ├── create-product.dto.ts
│   │   ├── update-product.dto.ts
│   │   └── product-filter.dto.ts
│   ├── product.controller.ts
│   ├── product.service.ts
│   └── product.module.ts (if needed)
├── categories/
├── orders/
└── ...
```

### 2. DTO Best Practices

```typescript
// Use inheritance for related DTOs
export class BaseProductDto {
  @IsNotEmpty({ message: 'products.validation.name.required' })
  @IsString({ message: 'products.validation.name.string' })
  name: string;

  @IsOptional()
  @IsString({ message: 'products.validation.description.string' })
  description?: string;
}

export class CreateProductDto extends BaseProductDto {
  @IsNotEmpty({ message: 'products.validation.price.required' })
  @IsNumber({}, { message: 'products.validation.price.number' })
  price: number;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  // All fields are optional for updates
}
```

### 3. Service Patterns

```typescript
// Keep services focused and single-responsibility
@Injectable()
export class ProductService extends BaseKnexService {
  // Core CRUD operations (inherited)

  // Business logic methods
  async findByCategory(category: string) {
    /* ... */
  }
  async getLowStock(threshold: number) {
    /* ... */
  }

  // Complex operations
  async bulkUpdate(updates: any[]) {
    /* ... */
  }

  // Validation helpers
  private async validateSku(sku: string) {
    /* ... */
  }
  private async checkCategoryExists(id: number) {
    /* ... */
  }
}

// Separate complex business logic into dedicated services
@Injectable()
export class ProductInventoryService {
  async adjustStock(productId: number, quantity: number) {
    /* ... */
  }
  async getStockMovements(productId: number) {
    /* ... */
  }
}

@Injectable()
export class ProductPricingService {
  async calculateDiscount(productId: number, rules: any) {
    /* ... */
  }
  async updatePricingTier(productId: number, tier: string) {
    /* ... */
  }
}
```

### 4. Error Handling

```typescript
// Create domain-specific exceptions
export class ProductNotFoundException extends NotFoundException {
  constructor(id: number, lang?: string) {
    super(i18n.t('products.errors.not_found', { lang, args: { id } }));
  }
}

export class InsufficientStockException extends BadRequestException {
  constructor(available: number, required: number, lang?: string) {
    super(i18n.t('products.errors.insufficient_stock', {
      lang,
      args: { available, required }
    }));
  }
}

// Use in services
async checkStock(productId: number, quantity: number, lang?: string) {
  const product = await this.findOne(productId);

  if (!product) {
    throw new ProductNotFoundException(productId, lang);
  }

  if (product.stock_quantity < quantity) {
    throw new InsufficientStockException(
      product.stock_quantity,
      quantity,
      lang
    );
  }
}
```

### 5. Testing

```typescript
// Unit tests for services
describe('ProductService', () => {
  let service: ProductService;
  let mockDatabase: jest.Mocked<DatabaseService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: DatabaseService,
          useValue: createMockDatabase(),
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    mockDatabase = module.get(DatabaseService);
  });

  describe('findByCategory', () => {
    it('should return products in category', async () => {
      const mockProducts = [{ id: 1, name: 'Test', category: 'Electronics' }];
      mockDatabase.getKnex.mockReturnValue({
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockProducts),
      });

      const result = await service.findByCategory('Electronics');
      expect(result).toEqual(mockProducts);
    });
  });
});

// Integration tests for controllers
describe('ProductController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/v1/products (POST)', () => {
    return request(app.getHttpServer())
      .post('/v1/products')
      .send({
        name: 'Test Product',
        price: 99.99,
        stock_quantity: 10,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toBeDefined();
      });
  });
});
```

### 6. Performance Optimization

```typescript
// Use database indexes
exports.up = function(knex) {
  return knex.schema.createTable('products', function(table) {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('sku', 100).unique();
    table.decimal('price', 10, 2).notNullable();
    table.integer('category_id').unsigned();
    table.timestamps(true, true);

    // Add indexes for common queries
    table.index(['name']);
    table.index(['category_id']);
    table.index(['price']);
    table.index(['created_at']);
    table.index(['sku']);
  });
};

// Implement query optimization
async findProductsOptimized(filters: any) {
  const qb = this.queryBuilder();

  // Use select to limit returned columns
  qb.select(['id', 'name', 'price', 'category_id', 'stock_quantity']);

  // Add efficient filters
  if (filters.category_id) {
    qb.where('category_id', filters.category_id);
  }

  if (filters.price_range) {
    qb.whereBetween('price', [filters.price_range.min, filters.price_range.max]);
  }

  // Use limit for pagination
  if (filters.limit) {
    qb.limit(filters.limit);
  }

  if (filters.offset) {
    qb.offset(filters.offset);
  }

  return qb;
}

// Cache frequently accessed data
import { Cache } from 'cache-manager';

@Injectable()
export class ProductService extends BaseKnexService {
  constructor(
    databaseService: DatabaseService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super(databaseService);
  }

  async findCategoryCounts(): Promise<any> {
    const cacheKey = 'product_category_counts';
    let counts = await this.cacheManager.get(cacheKey);

    if (!counts) {
      counts = await this.queryBuilder()
        .select('category_id')
        .count('* as count')
        .groupBy('category_id');

      // Cache for 5 minutes
      await this.cacheManager.set(cacheKey, counts, 300);
    }

    return counts;
  }
}
```

This comprehensive guide should help you implement and extend the Auto-CRUD pattern effectively. The pattern provides a solid foundation while maintaining the flexibility to add complex business logic as your application grows.
