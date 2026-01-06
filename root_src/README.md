# NestJS Getting Started - Products API

A simple NestJS application with a clean architecture for managing products using MySQL and Knex.js.

## Project Structure

```
src/
├── auth/                 # Authentication module (placeholder)
├── common/              # Shared utilities and DTOs
├── config/              # Configuration files
├── database/            # Database service and migrations
│   ├── migrations/      # Database migration files
│   └── seeds/          # Database seed files
├── domains/            # Feature modules
│   └── products/       # Products management
└── i18n/               # Internationalization files
    ├── en/             # English translations
    │   ├── common.json # Common messages
    │   └── products.json # Product-related messages
    └── id/             # Indonesian translations
        ├── common.json # Common messages
        └── products.json # Product-related messages
```

## Features

### 🚀 **Auto-CRUD System**

- **Laravel-Style Auto-CRUD**: Automatic generation of CRUD endpoints with custom business logic
- **Domain-Specific Extensions**: Custom methods beyond basic CRUD (category filters, low stock alerts, bulk operations)
- **Dynamic Route Generation**: Automatic REST API endpoint creation with proper validation
- **Soft Delete Support**: Built-in soft delete functionality with `deleted_at` timestamps

### 📝 **Advanced Validation**

- **Multi-Format Support**: JSON, form-data, and URL-encoded request handling
- **Internationalized Validation**: Error messages in multiple languages (English/Indonesian)
- **Custom Business Rules**: Domain-specific validation with real-time feedback
- **FormData Filtering**: Automatic filtering of file fields from validation pipeline

### 🌐 **Content Type Flexibility**

- **Form-Data Support**: Full multipart/form-data handling for file uploads and forms
- **JSON API**: Standard REST JSON endpoints
- **URL-Encoded**: Traditional form submission support
- **Mixed Content**: Seamless handling of file uploads with form data

### 📁 **File Upload System**

- **Integrated File Management**: Complete file upload system with metadata storage
- **Files Domain**: Dedicated domain for file management with Laravel-like hooks
- **Image Upload for Products**: Required image upload for product creation with optional updates
- **File Metadata**: Automatic storage of file path, original name, MIME type, and file size
- **Database Integration**: Foreign key relationships between products and files
- **Storage Organization**: Organized file storage with date-based directory structure
- **Error Handling**: Comprehensive validation for file uploads and empty field handling

### 🔒 **Enterprise Authentication**

- **JWT Authentication**: Secure JWT token validation with JWKS support
- **Service Authentication**: Service-to-service authentication with custom headers
- **Public Routes**: Configurable routes that bypass authentication
- **Multi-Layer Security**: Authentication + Authorization with proper error handling

### 🌍 **Internationalization (i18n)**

- **Multi-Language Support**: English and Indonesian built-in
- **Validation Messages**: Localized error messages for better UX
- **Easy Extension**: Simple addition of new languages

### 📊 **Advanced Features**

- **Products Management**: Complete CRUD with stock tracking, file uploads, and business intelligence
- **Pagination & Filtering**: Advanced pagination with search, filtering, and sorting capabilities
- **File Upload Integration**: Seamless file upload functionality integrated with product management
- **Database Integration**: MySQL with Knex.js ORM and comprehensive migration system
- **Clean Architecture**: Modular structure with separation of concerns and domain-driven design
- **Error Handling**: Comprehensive error handling with proper HTTP status codes and localized messages

### 📚 **Enhanced API Documentation**

- **Interactive Swagger UI**: Live API documentation with testing capabilities at `http://localhost:3004/api-docs`
- **Complete Schema Documentation**: Full request/response schemas with validation rules and examples
- **JWT Authentication**: Built-in Bearer token support with "Authorize" button
- **Multipart Form Support**: Enhanced Swagger documentation for file upload endpoints
- **Query Parameters**: Comprehensive documentation of all available filters, pagination, and search parameters
- **Auto-Generated from Code**: Uses `@ApiProperty`, `@ApiOperation`, and `@ApiBearerAuth` decorators
- **Request Examples**: Pre-filled examples for easy API testing with real-world data
- **Validation Documentation**: Shows field requirements, types, constraints, and error responses

## Prerequisites

- Node.js (v16 or higher)
- MySQL database
- pnpm package manager

## Installation

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

3. Update the `.env` file with your database credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=nest_app
```

4. Create the database:

```sql
CREATE DATABASE nest_app;
```

5. Run database migrations and seeds:

```bash
pnpm run db:migrate
pnpm run db:seed
```

## Pagination Setup

The application includes advanced pagination functionality for the Products API. To test the pagination features:

1. **Add some test data** (if not already done):

```bash
pnpm run db:seed
```

2. **Test pagination endpoints**:

```bash
# Basic pagination
curl -H "Authorization: Bearer YOUR_TOKEN" "http://localhost:3004/products?page=1&limit=5"

# With search and filtering
curl -H "Authorization: Bearer YOUR_TOKEN" "http://localhost:3004/products?search=test&category=electronics"

# With sorting
curl -H "Authorization: Bearer YOUR_TOKEN" "http://localhost:3004/products?sortBy=price&sortOrder=ASC"
```

3. **Run pagination tests**:

```bash
npm test -- test/products-pagination.spec.ts
node test/test-pagination.js
```

4. **View documentation**:
   - Interactive API Documentation: `http://localhost:3004/api-docs` (Swagger UI)
   - API Reference: `docs/products-pagination-api.md`
   - Implementation Summary: `PAGINATION_IMPLEMENTATION_SUMMARY.md`
   - Auto-CRUD Pattern Guide: `AUTO_CRUD_PATTERN_GUIDE.md`

## Running the Application

```bash
# Development mode
pnpm run start:dev

# Production mode
pnpm run start:prod
```

The application will be available at `http://localhost:3004`

## Recent Updates & New Features

### 🆕 **File Upload System (Latest)**

A comprehensive file upload system has been implemented with the following features:

#### **Files Domain**

- **New Files Table**: Dedicated table for file metadata storage
- **File Metadata**: Stores file path, original name, MIME type, file size, and timestamps
- **Soft Delete Support**: Files support soft delete with `deleted_at` timestamps
- **Foreign Key Integration**: Products table now references files via `file_id`

#### **Enhanced Product Management**

- **Required Image Upload**: Product creation now requires an image file
- **Optional Image Updates**: Product updates can optionally replace the existing image
- **Integrated File Handling**: Seamless integration between products and file uploads
- **File Validation**: Comprehensive validation for file uploads and empty field handling

#### **API Improvements**

- **Multipart Form Support**: Enhanced handling of `multipart/form-data` requests
- **FormData Validation Fix**: Custom interceptor to handle empty file fields in forms
- **Enhanced Swagger Documentation**: Improved documentation for file upload endpoints
- **Error Handling**: Better error messages and proper HTTP status codes

#### **Database Schema Updates**

```sql
-- Files table for metadata storage
CREATE TABLE files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_path VARCHAR(500) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL,
  file_type VARCHAR(50),
  extension VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- Updated products table with file reference
ALTER TABLE products
ADD COLUMN file_id INT,
ADD FOREIGN KEY (file_id) REFERENCES files(id);
```

#### **Usage Examples**

**Create Product with Image (Required):**

```bash
curl -X POST "http://localhost:3004/v1/products" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=iPhone 15 Pro" \
  -F "description=Latest iPhone" \
  -F "price=1199.99" \
  -F "stock_quantity=50" \
  -F "category=Electronics" \
  -F "image=@/path/to/image.jpg"
```

**Update Product with Optional Image:**

```bash
curl -X PUT "http://localhost:3004/v1/products/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=iPhone 15 Pro Updated" \
  -F "price=1299.99" \
  -F "image=@/path/to/new-image.jpg"
```

**Update Product without Image:**

```bash
curl -X PUT "http://localhost:3004/v1/products/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=iPhone 15 Pro Updated" \
  -F "price=1299.99"
```

### 📚 API Documentation

Once the application is running, you can access the interactive API documentation at:

**Swagger UI**: [`http://localhost:3004/api-docs`](http://localhost:3004/api-docs)

The Swagger documentation provides:

- ✅ **Interactive API Testing** - Test all endpoints directly in the browser
- ✅ **Complete Endpoint Documentation** - All CRUD and custom business endpoints
- ✅ **Request/Response Examples** - See exactly what data to send and expect
- ✅ **Authentication Support** - JWT Bearer token integration
- ✅ **Enhanced Multipart Form Support** - Proper file upload documentation and testing
- ✅ **Comprehensive Query Parameters** - All pagination, filtering, and search options documented
- ✅ **Auto-Generated from Code** - Always up-to-date with your latest changes

#### 🆕 **Enhanced Swagger Features**

**Multipart Form Documentation:**

- File upload endpoints now properly display all form fields
- Binary file inputs are correctly documented
- Examples for both required and optional file uploads

**Query Parameter Documentation:**

- Complete pagination parameters (`page`, `limit`)
- All filter options (`category`, `name`, `minPrice`, `maxPrice`)
- Language preference header (`x-lang`)
- Schema validation with min/max values and examples

**Response Documentation:**

- Detailed response schemas with file metadata
- Pagination metadata with complete examples
- Error response documentation with status codes
- Localized message examples

#### 🔑 **Using Swagger Authentication**

1. **Access Swagger UI**: Navigate to [`http://localhost:3004/api-docs`](http://localhost:3004/api-docs)
2. **Click "Authorize"**: Find the 🔒 lock icon in the top-right corner
3. **Enter JWT Token**: Paste your JWT token (without "Bearer " prefix)
4. **Test Endpoints**: All protected endpoints will now include your authentication

#### 📋 **Request Schema Documentation**

All DTOs are fully documented with:

- **Field Types**: String, number, integer with proper validation
- **Required/Optional**: Clear indication of mandatory fields
- **Validation Rules**: Min/max length, minimum values, format requirements
- **Examples**: Pre-filled realistic examples for easy testing
- **Descriptions**: Clear field descriptions and usage notes

Example DTO documentation includes:

```typescript
@ApiProperty({
  description: 'Product name',
  example: 'iPhone 15 Pro',
  minLength: 1,
  maxLength: 255,
})
name: string;
```

## 🚀 Auto-CRUD Pattern Usage

This NestJS starter implements a powerful **Laravel-inspired Auto-CRUD system** that automatically generates REST API endpoints while allowing custom business logic extensions.

### 📋 **How It Works**

The auto-CRUD pattern automatically generates all standard CRUD operations for any domain, while allowing you to add custom business methods on top.

#### **1. Basic Configuration**

Add your domain to the `AUTO_CRUD_MODELS` array in `src/common/modules/auto-crud.module.ts`:

```typescript
export const AUTO_CRUD_MODELS: AutoCrudOptions[] = [
  {
    entityName: 'Product',
    tableName: 'products',
    dtoClass: CreateProductDto,
    serviceClass: ProductService, // Optional: Custom service with business logic
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
  // Add more domains here...
];
```

#### **2. Create Your DTO**

Define validation rules with internationalization support:

```typescript
// src/domains/products/dto/create-product.dto.ts
export class CreateProductDto {
  @IsNotEmpty({ message: 'products.validation.name.required' })
  @IsString({ message: 'products.validation.name.string' })
  @Length(1, 255, { message: 'products.validation.name.length' })
  name: string;

  @IsNotEmpty({ message: 'products.validation.price.required' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'products.validation.price.number' })
  @Min(1, { message: 'products.validation.price.min' })
  price: number;

  // ... other fields
}
```

#### **3. Add Custom Business Logic (Optional)**

Extend the base service with domain-specific methods:

```typescript
// src/domains/products/product.service.ts
@Injectable()
export class ProductService extends BaseKnexService {
  // 🎯 CUSTOM BUSINESS METHODS beyond basic CRUD

  async findByCategory(category: string, filters: any = {}) {
    const qb = this.queryBuilder().where('category', 'LIKE', `%${category}%`);

    if (filters.minPrice) qb.where('price', '>=', filters.minPrice);
    if (filters.maxPrice) qb.where('price', '<=', filters.maxPrice);
    if (filters.inStock) qb.where('stock_quantity', '>', 0);

    return qb.select('*');
  }

  async getLowStockProducts(threshold: number = 10) {
    return this.queryBuilder()
      .where('stock_quantity', '<=', threshold)
      .where('stock_quantity', '>', 0)
      .select('*');
  }

  async bulkUpdateStock(updates: Array<{ id: number; quantity: number }>) {
    const trx = await this.knex.transaction();
    try {
      for (const update of updates) {
        await trx(this.tableName)
          .where('id', update.id)
          .update({ stock_quantity: update.quantity });
      }
      await trx.commit();
      return { success: true, updated: updates.length };
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
}
```

#### **4. Custom Controller Extensions**

Add custom endpoints beyond standard CRUD:

```typescript
// src/domains/products/product.controller.ts
@Controller('v1/products')
export class ProductController extends BaseKnexController {
  constructor(service: ProductService) {
    super(service);
  }

  // ✨ Auto-generated endpoints (inherited from BaseKnexController):
  // GET    /v1/products          - List with pagination
  // GET    /v1/products/:id      - Get by ID
  // POST   /v1/products          - Create
  // PUT    /v1/products/:id      - Update
  // DELETE /v1/products/:id      - Delete

  // 🚀 CUSTOM ENDPOINTS - Your business logic

  @Get('category/:category')
  async getByCategory(@Param('category') category: string) {
    return this.service.findByCategory(category);
  }

  @Get('low-stock')
  async getLowStock(@Query('threshold') threshold?: number) {
    return (this.service as ProductService).getLowStockProducts(threshold);
  }

  @Post('bulk-stock-update')
  async bulkUpdateStock(
    @Body() updates: Array<{ id: number; quantity: number }>,
  ) {
    return (this.service as ProductService).bulkUpdateStock(updates);
  }
}
```

### 🌐 **Content Type Support**

The system automatically handles multiple content types:

#### **JSON (Standard REST)**

```bash
curl -X POST http://localhost:3004/v1/products \
  -H "Content-Type: application/json" \
  -H "Accept-Language: en" \
  -d '{
    "name": "MacBook Pro",
    "price": 2999,
    "stock_quantity": 10,
    "category": "Electronics"
  }'
```

#### **Form-Data (File Uploads)**

```bash
curl -X POST http://localhost:3004/v1/products \
  -H "Accept-Language: en" \
  -F "name=MacBook Pro" \
  -F "price=2999" \
  -F "stock_quantity=10" \
  -F "category=Electronics"
```

#### **URL-Encoded (Traditional Forms)**

```bash
curl -X POST http://localhost:3004/v1/products \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=MacBook Pro&price=2999&stock_quantity=10&category=Electronics"
```

### 🌍 **Internationalization**

Add validation messages in multiple languages:

```json
// src/i18n/en/products.json
{
  "validation": {
    "name": {
      "required": "Product name is required",
      "string": "Product name must be a text value"
    },
    "price": {
      "required": "Price is required",
      "number": "Price must be a valid number",
      "min": "Price must be greater than or equal to 1"
    }
  }
}
```

```json
// src/i18n/id/products.json
{
  "validation": {
    "name": {
      "required": "Nama produk wajib diisi",
      "string": "Nama produk harus berupa teks"
    },
    "price": {
      "required": "Harga wajib diisi",
      "number": "Harga harus berupa angka yang valid",
      "min": "Harga harus lebih besar atau sama dengan 1"
    }
  }
}
```

### 📊 **Auto-Generated Endpoints**

When you add a domain to `AUTO_CRUD_MODELS`, you automatically get:

| Method   | Endpoint              | Description                             |
| -------- | --------------------- | --------------------------------------- |
| `GET`    | `/v1/{domain}`        | List with pagination, search, filtering |
| `GET`    | `/v1/{domain}/:id`    | Get single record by ID                 |
| `POST`   | `/v1/{domain}`        | Create new record                       |
| `PUT`    | `/v1/{domain}/:id`    | Update existing record                  |
| `DELETE` | `/v1/{domain}/:id`    | Delete record (soft delete if enabled)  |
| `POST`   | `/v1/{domain}/search` | Advanced search with filters            |
| `GET`    | `/v1/{domain}/combo`  | Get dropdown/select options             |
| `GET`    | `/v1/{domain}/rules`  | Get validation rules                    |

### 🎯 **Best Practices**

1. **Start with Auto-CRUD**: Let the system generate basic endpoints
2. **Add Custom Logic**: Extend with domain-specific business methods
3. **Use DTOs**: Define proper validation with i18n messages
4. **Follow Naming**: Use consistent naming conventions
5. **Leverage Extensions**: Build on top of the base functionality rather than replacing it

This pattern gives you the speed of auto-generation with the flexibility of custom business logic!

## API Endpoints

### 🛍️ **Products - Enhanced CRUD with File Upload**

#### **Standard CRUD Operations (Updated)**

- `GET /v1/products` - List products with advanced pagination, filtering, and file information
  - **Query Parameters:**
    - `page` (optional): Page number (default: 1, min: 1)
    - `limit` (optional): Items per page (default: 10, min: 1, max: 100)
    - `category` (optional): Filter by exact category match
    - `name` (optional): Search by product name (partial match, case-insensitive)
    - `minPrice` (optional): Minimum price filter (inclusive)
    - `maxPrice` (optional): Maximum price filter (inclusive)
  - **Headers:**
    - `x-lang` (optional): Language preference ('en' or 'id', default: 'en')
  - **Example:** `/v1/products?page=1&limit=5&category=Electronics&name=iPhone&minPrice=100&maxPrice=2000`
- `GET /v1/products/:id` - Get product by ID with complete file information
  - **Headers:**
    - `x-lang` (optional): Language preference for response messages
- `POST /v1/products` - Create new product with **required** image upload
  - **Content-Type:** `multipart/form-data` only
  - **Required Fields:** name, price, stock_quantity, **image** (file)
  - **Optional Fields:** description, category
  - **Headers:**
    - `x-lang` (optional): Language preference for response messages
- `PUT /v1/products/:id` - Update product with optional image replacement
  - **Content-Type:** `multipart/form-data` only
  - **Optional Fields:** name, description, price, stock_quantity, category, image (file)
  - **Headers:**
    - `x-lang` (optional): Language preference for response messages
- `DELETE /v1/products/:id` - Soft delete product (sets deleted_at timestamp)

#### **File Upload Features**

- **Required Image Upload**: Product creation requires an image file
- **Optional Image Updates**: Product updates can optionally replace existing images
- **File Metadata Storage**: Complete file information including path, original name, MIME type, and size
- **Supported Formats**: Images (JPEG, PNG, GIF, WebP)
- **File Validation**: Automatic validation of file types and sizes
- **Storage Organization**: Date-based directory structure for organized file storage

#### **Enhanced Response Data**

All product responses now include complete file information:

```json
{
  "success": true,
  "message": "Product found successfully",
  "data": {
    "id": 1,
    "name": "iPhone 15 Pro",
    "description": "Latest iPhone with advanced camera system",
    "price": 1199.99,
    "stock_quantity": 50,
    "category": "Electronics",
    "file_id": 1,
    "file_path": "/var/www/files/images/2025/01/uuid.jpg",
    "image_original_name": "product-image.jpg",
    "image_mime_type": "image/jpeg",
    "image_file_size": 1024000,
    "created_at": "2025-01-15T10:30:00.000Z",
    "updated_at": "2025-01-15T14:45:00.000Z"
  }
}
```

#### **Custom Business Endpoints**

- `GET /v1/products/category/:category` - Get products by category with filters
  - **Query Parameters:**
    - `minPrice` (optional): Minimum price filter
    - `maxPrice` (optional): Maximum price filter
    - `inStock` (optional): Filter only in-stock products (true/false)
- `GET /v1/products/low-stock` - Get products with low stock
  - **Query Parameters:**
    - `threshold` (optional): Stock threshold (default: 10)
- `POST /v1/products/bulk-stock-update` - Update multiple product stock quantities
- `GET /v1/products/stats` - Get product statistics and analytics
- `POST /v1/products/advanced-search` - Advanced search with multiple filters

#### **Auto-Generated Utility Endpoints**

- `POST /v1/products/search` - Advanced search endpoint
- `GET /v1/products/combo` - Get products for dropdown/select options
- `GET /v1/products/rules` - Get validation rules for the domain
- `POST /v1/products/search-table` - Search for data tables
- `POST /v1/products/data-tabulator` - Get data for tabulator components
- `DELETE /v1/products/delete-all` - Bulk delete (with confirmation)

### 🔒 **Authentication**

- `POST /auth/login` - Login endpoint (public route)
- `GET /health` - Health check (public route)

### 📤 **Updated Content Type Examples**

#### **Product Creation with Required Image (multipart/form-data only)**

```bash
curl -X POST http://localhost:3004/v1/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-lang: en" \
  -F "name=iPhone 15 Pro" \
  -F "description=Latest iPhone with advanced camera" \
  -F "price=1199.99" \
  -F "stock_quantity=50" \
  -F "category=Electronics" \
  -F "image=@/path/to/product-image.jpg"
```

#### **Product Update with Optional Image**

```bash
# Update with new image
curl -X PUT http://localhost:3004/v1/products/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-lang: en" \
  -F "name=iPhone 15 Pro Updated" \
  -F "price=1299.99" \
  -F "image=@/path/to/new-image.jpg"

# Update without changing image
curl -X PUT http://localhost:3004/v1/products/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-lang: en" \
  -F "name=iPhone 15 Pro Updated" \
  -F "price=1299.99" \
  -F "stock_quantity=45"
```

#### **Product Listing with Filters**

```bash
# Basic pagination
curl -X GET "http://localhost:3004/v1/products?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-lang: en"

# Advanced filtering
curl -X GET "http://localhost:3004/v1/products?category=Electronics&name=iPhone&minPrice=500&maxPrice=1500&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-lang: id"
```

#### **Get Product by ID**

```bash
curl -X GET http://localhost:3004/v1/products/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "x-lang: en"
```

#### **Form-Data Request**

```bash
curl -X POST http://localhost:3004/v1/products \
  -H "Accept-Language: en" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=MacBook Pro" \
  -F "description=High-performance laptop" \
  -F "price=2999" \
  -F "stock_quantity=10" \
  -F "category=Electronics"
```

#### **URL-Encoded Request**

```bash
curl -X POST http://localhost:3004/v1/products \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "Accept-Language: en" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "name=MacBook Pro&description=High-performance laptop&price=2999&stock_quantity=10&category=Electronics"
```

## Technical Improvements & Error Handling

### 🔧 **Enhanced Validation System**

#### **FormData Validation Fix**

A custom `FilterFormDataInterceptor` has been implemented to handle multipart form submissions:

- **Automatic Field Filtering**: Removes file fields from request body before validation
- **Empty Field Handling**: Properly handles empty file fields in form submissions
- **Validation Pipeline**: Ensures clean DTOs reach the validation pipe

#### **Comprehensive Error Handling**

- **HTTP Status Codes**: Proper status codes for all scenarios (200, 201, 400, 404, 500)
- **Localized Error Messages**: Error messages in user's preferred language
- **Detailed Validation Errors**: Field-specific validation error messages
- **File Upload Errors**: Specific error handling for file upload scenarios

#### **Response Consistency**

All API responses follow a consistent structure:

```json
{
  "success": true|false,
  "message": "Localized message",
  "data": {...},
  "meta": {...} // For paginated responses
}
```

### 🗄️ **Database Schema Updates**

#### **Files Table Structure**

```sql
CREATE TABLE files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_path VARCHAR(500) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size INT NOT NULL,
  file_type VARCHAR(50),
  extension VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_file_path (file_path),
  INDEX idx_deleted_at (deleted_at)
);
```

#### **Products Table Updates**

```sql
ALTER TABLE products
ADD COLUMN file_id INT,
ADD FOREIGN KEY (file_id) REFERENCES files(id);
```

### 🛡️ **Soft Delete Implementation**

- **Products**: Soft delete with `deleted_at` timestamp
- **Files**: Soft delete support for file cleanup
- **Query Filtering**: Automatic exclusion of soft-deleted records
- **Data Recovery**: Ability to restore soft-deleted records

### 📋 **Swagger Documentation Enhancements**

- **Manual Parameter Injection**: Custom parameter definitions for better Swagger UI display
- **Multipart Form Support**: Proper documentation of file upload fields
- **Query Parameter Documentation**: Complete documentation of all filter and pagination options
- **Response Examples**: Detailed response schemas with realistic examples

## Internationalization (i18n)

The application supports multiple languages through the `nestjs-i18n` package.

### Supported Languages

- **English** (`en`) - Default/Fallback language
- **Indonesian** (`id`)

### Language Detection

The application detects language preference in the following priority order:

1. **Custom Header**: `x-lang` header (e.g., `x-lang: id`)
2. **Accept-Language**: Standard HTTP header (e.g., `Accept-Language: id`)
3. **Fallback**: English (`en`) if no language is specified

### Usage Examples

#### Using Custom Header

```bash
# English response
curl -H "x-lang: en" http://localhost:3004/products

# Indonesian response
curl -H "x-lang: id" http://localhost:3004/products
```

#### Using Accept-Language Header

```bash
# Indonesian response
curl -H "Accept-Language: id" http://localhost:3004/products
```

### Translation Files

Translation files are organized by language and module:

- `src/i18n/en/` - English translations
- `src/i18n/id/` - Indonesian translations

Each language directory contains:

- `common.json` - General messages (success, error, validation)
- `products.json` - Product-related messages

For detailed testing examples, see `i18n-test-examples.md`.
For file upload testing examples, see `file-upload-examples.md`.

## Database Scripts

```bash
# Run migrations
pnpm run db:migrate

# Rollback migrations
pnpm run db:migrate:rollback

# Run seeds
pnpm run db:seed

# Reset database (rollback all, migrate, and seed)
pnpm run db:reset
```

## Example API Usage

### Create a Product (English)

```bash
curl -X POST http://localhost:3004/products \
  -H "Content-Type: application/json" \
  -H "x-lang: en" \
  -d '{
    "name": "New Product",
    "description": "Product description",
    "price": 99.99,
    "stock_quantity": 10,
    "category": "Electronics"
  }'
```

### Create a Product (Indonesian)

```bash
curl -X POST http://localhost:3004/products \
  -H "Content-Type: application/json" \
  -H "x-lang: id" \
  -d '{
    "name": "Produk Baru",
    "description": "Deskripsi produk",
    "price": 99.99,
    "stock_quantity": 10,
    "category": "Elektronik"
  }'
```

### File Upload (English)

```bash
# General file upload
curl -X POST http://localhost:3004/products/upload \
  -H "x-lang: en" \
  -F "file=@/path/to/your/file.jpg"

# Product-specific file upload
curl -X POST http://localhost:3004/products/upload-for-product \
  -H "x-lang: en" \
  -F "file=@/path/to/your/document.pdf" \
  -F "productId=1"
```

### File Upload (Indonesian)

```bash
# Upload file umum
curl -X POST http://localhost:3004/products/upload \
  -H "x-lang: id" \
  -F "file=@/path/to/your/file.jpg"

# Upload file untuk produk tertentu
curl -X POST http://localhost:3004/products/upload-for-product \
  -H "x-lang: id" \
  -F "file=@/path/to/your/document.pdf" \
  -F "productId=1"
```

### File Download

```bash
# Download a file (English)
curl -X POST http://localhost:3004/products/download \
  -H "Content-Type: application/json" \
  -H "x-lang: en" \
  -d '{"filename": "product-1703123456789-123456789.jpg"}' \
  --output downloaded-file.jpg

# Download a file (Indonesian)
curl -X POST http://localhost:3004/products/download \
  -H "Content-Type: application/json" \
  -H "x-lang: id" \
  -d '{"filename": "product-1703123456789-123456789.jpg"}' \
  --output downloaded-file.jpg
```

## Development

```bash
# Run tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run e2e tests
pnpm run test:e2e

# Lint code
pnpm run lint

# Format code
pnpm run format
```

## Technologies Used

- **NestJS** - Progressive Node.js framework
- **nestjs-i18n** - Internationalization module for NestJS
- **Multer** - File upload handling middleware
- **Knex.js** - SQL query builder and ORM
- **MySQL** - Relational database
- **TypeScript** - Type-safe JavaScript
- **Jest** - Testing framework

## Authentication System

The application implements a comprehensive authentication middleware that supports multiple authentication methods:

### JWT Token Authentication

The application uses JWT (JSON Web Token) authentication with JWKS (JSON Web Key Set) for secure token validation.

#### How JWT Authentication Works

1. **Token Validation**: JWT tokens are validated using public keys fetched from a JWKS endpoint
2. **Key Rotation**: Automatic handling of key rotation from your authentication provider
3. **Caching**: Public keys are cached for performance and automatically refreshed when needed
4. **Standards Compliance**: Follows OAuth 2.0 and OpenID Connect standards

#### JWKS Implementation

The application uses the `jose` library's `createRemoteJWKSet` function which:

- Fetches public keys from your authentication provider's JWKS endpoint
- Automatically caches keys to avoid repeated network calls
- Handles key rotation seamlessly
- Validates JWT signatures using the appropriate public key

#### Environment Variables

Add these JWT-related environment variables to your `.env` file:

```env
# JWT Configuration
JWKS_URI=https://your-auth-provider.com/.well-known/jwks.json
ISSUER=https://your-auth-provider.com/
AUDIENCE=your-api-audience

# Service Authentication
APP_SERVICE_ID=your-service-id
APP_SERVICE_SECRET=your-service-secret
```

#### Local JWKS Setup (Optional Fallback)

For improved reliability and offline development, you can set up a local JWKS fallback:

1. **Download the JWKS file from your authentication provider (from the root_src directory):**

```bash
curl -s https://auth.upnvj.ac.id/realms/myapp-test/protocol/openid-connect/certs \
  -o jwks.json
```

2. **How it works:**
   - The application will first try to validate JWT tokens using the remote JWKS endpoint
   - If the remote endpoint is unavailable, it automatically falls back to the local JWKS file
   - This ensures your application remains functional even when the authentication server is temporarily unavailable

**Note:** Update the JWKS URL in the curl command to match your authentication provider's endpoint.

### Service Authentication

For service-to-service communication, the application supports header-based authentication:

```bash
# Access protected routes with service headers
curl -X GET http://localhost:3004/products \
  -H "Service-ID: your-service-id" \
  -H "Service-Secret: your-service-secret"
```

### Public Routes

Certain routes bypass authentication entirely and are configured in `src/config/service.config.ts`:

- `/auth/login` - Authentication endpoint
- `/health` - Health check endpoint

### Authentication Flow

1. **Public Routes**: Bypass all authentication checks
2. **Service Authentication**: Check for `Service-ID` and `Service-Secret` headers
3. **JWT Authentication**: Validate Bearer tokens using JWKS
4. **Error Handling**: Return appropriate HTTP status codes with internationalized messages

### Usage Examples

#### JWT Token Authentication

```bash
# Access protected route with JWT token
curl -X GET http://localhost:3004/products \
  -H "Authorization: Bearer your-jwt-token"
```

#### Service Authentication

```bash
# Access protected route with service credentials
curl -X GET http://localhost:3004/products \
  -H "Service-ID: your-service-id" \
  -H "Service-Secret: your-service-secret"
```

#### Public Route Access

```bash
# Access public routes without authentication
curl -X GET http://localhost:3004/health
```

### Authentication Middleware

The authentication logic is implemented in `src/common/middleware/auth.middleware.ts` and automatically applied to all routes except those configured as public routes.

## 📋 Recent Updates

### ✅ **Swagger API Documentation Implementation**

- **Complete Integration**: Full Swagger UI with interactive API testing
- **JWT Authentication**: Built-in Bearer token support with "Authorize" button
- **Schema Documentation**: All DTOs documented with `@ApiProperty` decorators
- **Request Examples**: Pre-filled examples for easy API testing
- **Validation Documentation**: Complete field requirements and constraints
- **Multiple Content Types**: JSON, form-data, and URL-encoded support

### ✅ **Enhanced DTO Documentation**

- **Rich Schema Information**: Field types, validation rules, and examples
- **Required/Optional Fields**: Clear indication using `@ApiProperty` vs `@ApiPropertyOptional`
- **Request Body Examples**: Multiple realistic examples in Swagger UI
- **Type Safety**: Proper TypeScript types with runtime validation

### ✅ **Auto-CRUD Pattern Improvements**

- **Inherited Authentication**: All controllers automatically get JWT auth via `@ApiBearerAuth`
- **Consistent Documentation**: Base controllers include Swagger decorators
- **Extensible Architecture**: Easy to add custom endpoints while maintaining documentation

## Next Steps

- ✅ Add input validation with class-validator
- ✅ Implement pagination for list endpoints
- ✅ Add comprehensive error handling
- ✅ Add API documentation with Swagger
- ✅ Implement file upload functionality with complete integration
- ✅ Enhanced Swagger documentation with multipart form support
- ✅ FormData validation improvements and error handling
- ✅ Database schema updates with Files domain
- ✅ Soft delete implementation for data integrity
- Add logging with Winston
- Implement caching with Redis
- Add unit and integration tests
- Add advanced search and filtering capabilities

## Changelog

### Version 2.1.0 (Latest) - File Upload System & Enhanced Documentation

**Major Features:**

- 🆕 **Complete File Upload System**: Integrated file management with Products domain
- 🆕 **Files Domain**: New domain for file metadata storage with Laravel-like hooks
- 🆕 **Enhanced Swagger Documentation**: Improved multipart form support and parameter documentation
- 🆕 **FormData Validation Fix**: Custom interceptor for proper multipart form handling

**API Improvements:**

- ✅ **Required Image Upload**: Product creation now requires image files
- ✅ **Optional Image Updates**: Product updates can optionally replace images
- ✅ **Enhanced Query Parameters**: Complete pagination, filtering, and search documentation
- ✅ **Localized Error Handling**: Proper HTTP status codes with internationalized messages

**Database Updates:**

- ✅ **Files Table**: New table for file metadata with indexes and soft delete
- ✅ **Foreign Key Relationships**: Products table now references files via file_id
- ✅ **Migration System**: Complete database migration support

**Technical Enhancements:**

- ✅ **Soft Delete**: Comprehensive soft delete implementation for data integrity
- ✅ **Error Handling**: Enhanced error handling with proper status codes
- ✅ **Response Consistency**: Standardized API response format
- ✅ **Documentation**: Updated README with complete feature documentation

### Version 2.0.0 - Auto-CRUD System & Internationalization

- ✅ Laravel-inspired Auto-CRUD system implementation
- ✅ Multi-language support (English/Indonesian)
- ✅ JWT authentication with JWKS support
- ✅ Advanced validation with i18n messages
- ✅ Comprehensive Swagger documentation
- ✅ Pagination and filtering system

### Version 1.0.0 - Initial Release

- ✅ Basic NestJS application structure
- ✅ MySQL database integration with Knex.js
- ✅ Products CRUD operations
- ✅ Clean architecture implementation
