# Base CRUD Controller with Swagger Integration

This document explains how to use the cleaned Base CRUD Controller pattern with proper Swagger documentation separation.

## Overview

The `BaseKnexController` is now free of Swagger decorators, making it focused on business logic. Swagger documentation is handled through decorator factories that child controllers can use.

## File Structure

This shows how the files are organized in your project:

### 📁 **Common Files** (Shared across all features)

```text
src/common/
├── controllers/base-knex.controller.ts    ← Parent class (NO Swagger decorators)
└── decorators/swagger-crud.decorator.ts   ← Swagger decorator functions
```

### 📁 **Domain Files** (Specific features like products, users, etc.)

```text
src/domains/
└── products/
    └── product.controller.ts              ← Child class (WITH Swagger decorators)
```

### 🔄 **How They Work Together**

1. **`base-knex.controller.ts`** = The parent class with all CRUD methods (GET, POST, PUT, DELETE)
   - Contains business logic only
   - No Swagger documentation
   - Can be inherited by any feature

2. **`swagger-crud.decorator.ts`** = Collection of Swagger decorator functions
   - Contains reusable documentation patterns
   - Used by child controllers to add Swagger docs
   - No business logic, just documentation

3. **`product.controller.ts`** = Child controller for Products feature
   - Extends the parent class (inherits all CRUD methods)
   - Uses decorators to add Swagger documentation
   - Can override methods to add custom behavior

### 📊 **Visual Flow**

```text
base-knex.controller.ts (Parent)
         ↓ (inherits from)
product.controller.ts (Child)
         ↓ (uses decorators from)
swagger-crud.decorator.ts (Documentation)
         ↓ (generates)
Swagger API Documentation
```

## How to Create New Controllers

### Step 1: Import Required Dependencies

```typescript
import { Controller, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BaseKnexController } from '../../common/controllers/base-knex.controller';
import {
  BaseCrudSwagger,
  SwaggerFindAll,
  SwaggerFindOne,
  SwaggerCreate,
  SwaggerUpdate,
  SwaggerDelete,
} from '../../common/decorators/swagger-crud.decorator';
import type { Express } from 'express';
```

### Step 2: Set Up Class Decorators

```typescript
@Controller('v1/your-resource')
@BaseCrudSwagger({
  tag: 'your-resource',           // Swagger tag
  entityName: 'YourEntity',       // Used in Swagger descriptions
  createDto: CreateYourDto,       // For Swagger schema
  updateDto: UpdateYourDto,       // For Swagger schema
})
@UseInterceptors(FileInterceptor('file'), FilterFormDataInterceptor)
export class YourController extends BaseKnexController {
  protected entityName = 'YourEntity';
  
  constructor(
    private readonly yourService: YourService,
    private readonly i18n: I18nService,
  ) {
    super(yourService);
  }
}
```

### Step 3: Override Methods with Swagger Decorators

```typescript
// Override base methods to add Swagger documentation
@SwaggerFindAll('YourEntity')
async findAll(pagination: any, lang?: string) {
  return super.findAll(pagination, lang);
}

@SwaggerFindOne('YourEntity')
async findOne(id: string, lang?: string) {
  return super.findOne(id, lang);
}

@SwaggerCreate('YourEntity')
async create(createDto: any, lang?: string, file?: Express.Multer.File) {
  return super.create(createDto, lang, file);
}

@SwaggerUpdate('YourEntity')
async update(
  id: string,
  updateDto: any,
  lang?: string,
  file?: Express.Multer.File,
) {
  return super.update(id, updateDto, lang, file);
}

@SwaggerDelete('YourEntity')
async remove(id: string, lang?: string) {
  return super.remove(id, lang);
}
```

## Available Swagger Decorators

| Decorator | Purpose | Usage |
|-----------|---------|-------|
| `BaseCrudSwagger` | Class-level decorator for basic setup | `@BaseCrudSwagger({ tag, entityName, createDto, updateDto })` |
| `SwaggerFindAll` | GET / endpoint | `@SwaggerFindAll('EntityName')` |
| `SwaggerFindOne` | GET /:id endpoint | `@SwaggerFindOne('EntityName')` |
| `SwaggerCreate` | POST / endpoint | `@SwaggerCreate('EntityName')` |
| `SwaggerUpdate` | PUT /:id endpoint | `@SwaggerUpdate('EntityName')` |
| `SwaggerDelete` | DELETE /:id endpoint | `@SwaggerDelete('EntityName')` |
| `SwaggerSearch` | POST /search endpoint | `@SwaggerSearch('EntityName')` |
| `SwaggerCombo` | GET /combo endpoint | `@SwaggerCombo('EntityName')` |
| `SwaggerRules` | GET /rules endpoint | `@SwaggerRules('EntityName')` |

## File Upload Integration

### Optional File Requirements

Override `isFileRequired()` to define when files are mandatory:

```typescript
protected isFileRequired(createDto: CreateYourDto): boolean {
  // Examples:
  return true;                           // Always required
  return createDto.category === 'media'; // Required for specific categories  
  return createDto.price > 500;          // Required for expensive items
  return false;                          // Always optional
}
```

### Custom File Handling

Override file handling methods as needed:

```typescript
// Handle creation with file
protected async createWithFile(
  createDto: CreateYourDto,
  file: Express.Multer.File,
): Promise<any> {
  return this.yourService.createWithFile(createDto, file);
}

// Handle updates with file
protected async updateWithFile(
  id: string,
  updateDto: UpdateYourDto,
  file?: Express.Multer.File,
): Promise<any> {
  return this.yourService.updateWithFile(id, updateDto, file);
}
```

## Benefits

### ✅ **Clean Separation of Concerns**

- Base controller focuses on business logic
- Swagger documentation is separate and reusable
- Easy to maintain and modify

### ✅ **Reusable Documentation**

- Consistent Swagger docs across all controllers
- Easy to update documentation patterns
- Type-safe decorator parameters

### ✅ **Flexible Implementation**

- Override only the methods you need
- Add custom business logic without conflicts
- Support for both JSON and file uploads

### ✅ **Maintainable Architecture**

- Changes to base functionality don't affect documentation
- Each controller has its own tailored Swagger specs
- Easy to add new endpoints with proper documentation

## Example: Complete Product Controller

See `src/domains/products/product.controller.ts` for a complete implementation that includes:

- Swagger documentation for all CRUD operations
- Custom file upload handling
- Business logic for file requirements
- Internationalization support
- Custom endpoint implementations

## Migration from Old Pattern

If you have existing controllers using the old pattern:

1. Remove Swagger imports from base controller usage
2. Import the new decorator functions
3. Replace class-level decorators with `@BaseCrudSwagger()`
4. Add method-level decorators to overridden methods
5. Test that Swagger documentation still works correctly

This pattern ensures your Swagger documentation stays up-to-date while keeping your business logic clean and maintainable!
