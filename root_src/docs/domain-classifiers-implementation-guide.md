# Domain Classifiers Implementation Guide

## Overview

Step-by-step guide for implementing Categories and Tags domain using Rich Domain Models, Auto CRUD pattern, and i18n support. This guide covers the complete implementation from database migrations to API endpoints.

## TL;DR

- **Rich Domain Models**: `CategoryModel` and `TagModel` with business logic encapsulation
- **Auto CRUD**: `BaseKnexService` provides standard CRUD operations automatically
- **Relationships**: Many-to-One (Product → Category), Many-to-Many (Product ↔ Tag)
- **Validation**: Business rules enforced in domain models (slug format, hex color, name length)
- **i18n**: All messages localized (English/Indonesian)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Request                         │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              CategoryController / TagController         │
│              (BaseKnexController)                       │
│              - Auto CRUD endpoints                      │
│              - Swagger documentation                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│           CategoryService / TagService                  │
│           (BaseKnexService)                             │
│           - CRUD operations                             │
│           - Pagination & Search                         │
│           - Uses Domain Models for validation           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│        CategoryModel / TagModel                         │
│        (Rich Domain Model)                              │
│        - Business rules                                 │
│        - Validation logic                               │
│        - State management                               │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    Database (Knex)                      │
│                    - categories table                   │
│                    - tags table                         │
│                    - product_tags pivot                 │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### Step 1: Database Migrations

**Files Created:**
- `001_create_categories_table.js`
- `002_create_tags_table.js`
- `003_create_product_tags_table.js`
- `004_add_category_id_to_products.js`

**Key Features:**
- UUID primary keys
- Soft delete support (`deleted_at`)
- Timestamps (`created_at`, `updated_at`)
- Unique constraints (category name/slug, tag name)
- Foreign key relationships

---

### Step 2: Domain Interfaces

**Files:**
- `interfaces/category.interface.ts`
- `interfaces/tag.interface.ts`

**Structure:**
```typescript
export interface ICategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}
```

---

### Step 3: Rich Domain Models

**Files:**
- `models/category.model.ts`
- `models/tag.model.ts`

**Key Methods:**
- `create()` - Factory method with validation
- `reconstitute()` - Restore from database
- `toEntity()` - Convert to database format
- Business methods: `updateDetails()`, `changeSlug()`, `updateColor()`, `renameWithValidation()`

**Business Rules:**
- Category: Name required, slug auto-generated, slug format validation
- Tag: Name max 20 chars, hex color validation, color normalization

---

### Step 4: Services

**Files:**
- `services/category.service.ts`
- `services/tag.service.ts`

**Extends:** `BaseKnexService<ICategory>` / `BaseKnexService<ITag>`

**Overrides:**
- `create()` - Uses domain model for validation
- `update()` - Uses domain model for business rules

**Auto-Provided Methods:**
- `findAll()` - Paginated listing
- `findOne()` - Get by ID
- `search()` - Advanced search
- `remove()` - Soft delete
- `getCombo()` - Dropdown data

---

### Step 5: Controllers

**Files:**
- `controllers/category.controller.ts`
- `controllers/tag.controller.ts`

**Extends:** `BaseKnexController<ICategory>` / `BaseKnexController<ITag>`

**Auto-Generated Endpoints:**
- `GET /v1/categories` - List with pagination
- `GET /v1/categories/:id` - Get by ID
- `POST /v1/categories` - Create
- `PUT /v1/categories/:id` - Update
- `DELETE /v1/categories/:id` - Soft delete
- `POST /v1/categories/search` - Advanced search
- `GET /v1/categories/combo` - Dropdown data

---

### Step 6: DTOs

**Files:**
- `dto/create-category.dto.ts`
- `dto/update-category.dto.ts`
- `dto/create-tag.dto.ts`
- `dto/update-tag.dto.ts`

**Features:**
- `class-validator` decorators
- `@ApiProperty` for Swagger
- Validation rules match domain model rules

---

### Step 7: i18n Files

**Files:**
- `i18n/en/categories.json`
- `i18n/id/categories.json`
- `i18n/en/tags.json`
- `i18n/id/tags.json`
- `i18n/en/domain.json` (updated)
- `i18n/id/domain.json` (updated)

**Messages:**
- Success messages (created, updated, deleted, listed)
- Validation errors
- Business rule errors

---

### Step 8: Product Integration

**Changes:**
- `ProductModel`: Added `categoryId` property
- `ProductService`: 
  - Validates `category_id` on create/update
  - Eager loads category and tags
  - `updateProductTags()` method for many-to-many
- `ProductController`: Added `POST /v1/products/:id/tags` endpoint

---

### Step 9: Module Setup

**File:** `classifiers.module.ts`

```typescript
@Module({
  imports: [DatabaseModule, CommonModule, AuthModule],
  providers: [CategoryService, TagService],
  controllers: [CategoryController, TagController],
  exports: [CategoryService, TagService],
})
export class ClassifiersModule {}
```

**Integration:**
- Added to `AppModule` imports
- Added to `ProductsModule` imports (for service injection)

---

## Business Rules

### Category Rules

1. **Name**: Required, cannot be empty
2. **Slug**: Auto-generated from name if not provided
3. **Slug Format**: Lowercase, alphanumeric with hyphens only
4. **Uniqueness**: Name and slug must be unique (database constraint)

### Tag Rules

1. **Name**: Required, max 20 characters
2. **Color**: Required, valid hex format (#RRGGBB or #RGB)
3. **Color Normalization**: Converted to uppercase
4. **Uniqueness**: Name must be unique (database constraint)

---

## Testing

### Unit Tests

**Model Tests:**
- `models/__tests__/category.model.spec.ts`
- `models/__tests__/tag.model.spec.ts`

**Service Tests:**
- `services/__tests__/category.service.spec.ts`
- `services/__tests__/tag.service.spec.ts`

**Run Tests:**
```bash
pnpm test classifiers
```

---

## Common Patterns

### Pattern 1: Create with Auto-Generated Slug

```typescript
// Slug auto-generated from name
const category = CategoryModel.create({
  id: uuidv4(),
  name: 'Fashion & Apparel',
  description: 'Fashion items',
});
// category.getSlug() === 'fashion-apparel'
```

### Pattern 2: Update with Business Rules

```typescript
// Update name - slug auto-regenerated
category.updateDetails('New Category Name', 'New description');
// category.getSlug() === 'new-category-name'
```

### Pattern 3: Custom Slug

```typescript
// Provide custom slug
const category = CategoryModel.create({
  id: uuidv4(),
  name: 'Electronics',
  slug: 'custom-slug',
});
```

### Pattern 4: Tag Color Normalization

```typescript
// Color normalized to uppercase
const tag = TagModel.create({
  id: uuidv4(),
  name: 'Hot Item',
  color: '#ff0000',
});
// tag.getColor() === '#FF0000'
```

---

## Best Practices

### ✅ DO

- Use domain models for all business logic
- Validate data in domain models, not services
- Use `create()` for new entities, `reconstitute()` for database data
- Keep services thin - delegate to domain models
- Use i18n for all messages

### ❌ DON'T

- Don't bypass domain models in services
- Don't put business logic in controllers
- Don't hardcode validation rules
- Don't skip i18n for error messages
- Don't use `new` directly - use factory methods

---

## Related Documentation

- [Categories & Tags API Documentation](./categories-tags-api-documentation.md)
- [Domain Model Pattern Guide](./architecture-domain-model-pattern-documentation.md)
- [Auto CRUD Pattern Guide](./architecture-auto-crud-pattern-guide.md)
- [API Swagger Integration Guide](./api-swagger-integration-guide.md)
- [Testing Guide](../../TESTING_GUIDE.md)

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-13
