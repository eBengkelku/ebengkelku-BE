# Categories & Tags Domain Implementation Guide

## Overview

Step-by-step guide for implementing Categories and Tags domain using **Rich Domain Model Pattern** with Repository layer. This guide covers the complete implementation from database migrations to API endpoints.

**Note:** Categories and Tags are now **separate domains** (not combined under `classifiers`), each with its own module, repository, service, and controller.

## TL;DR

- **Rich Domain Models**: `CategoryModel` and `TagModel` with business logic encapsulation
- **Repository Pattern**: `CategoryRepository` and `TagRepository` extend `BaseDomainRepository`
- **Custom Services**: `CategoryService` and `TagService` (NOT extending `BaseKnexService`)
- **Custom Controllers**: `CategoryController` and `TagController` (NOT extending `BaseKnexController`)
- **Relationships**: Many-to-One (Product → Category), Many-to-Many (Product ↔ Tag)
- **Validation**: Business rules enforced in domain models (slug format, hex color, name length)
- **Error Handling**: Unique constraint violations return 409 Conflict
- **Delete Validation**: Validates existence before delete (returns 404 if not found)
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
│              (Custom Controller)                        │
│              - Custom CRUD endpoints                    │
│              - Swagger documentation                    │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│           CategoryService / TagService                  │
│           (Custom Service)                              │
│           - Orchestrates business logic                 │
│           - Uses Repository for data access             │
│           - Uses Domain Models for validation           │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│     CategoryRepository / TagRepository                 │
│     (Extends BaseDomainRepository)                      │
│     - Handles database access                           │
│     - Converts entities to domain models                │
│     - Handles unique constraint violations              │
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

### Step 4: Repositories

**Files:**
- `repository/category.repository.ts`
- `repository/tag.repository.ts`

**Extends:** `BaseDomainRepository<CategoryModel, ICategory>` / `BaseDomainRepository<TagModel, ITag>`

**Key Features:**
- Handles database access (insert, update, delete)
- Converts database entities to domain models
- Handles unique constraint violations (converts to DomainConflictException)
- Implements soft delete logic

**Methods:**
- `findById()` - Find by ID (returns null if not found)
- `findByIdOrThrow()` - Find by ID (throws if not found)
- `findAll()` - Paginated listing
- `save()` - Insert or update based on existence
- `delete()` - Soft delete

---

### Step 5: Services

**Files:**
- `category.service.ts` (root level)
- `tag.service.ts` (root level)

**Pattern:** Custom service (NOT extending `BaseKnexService`)

**Dependencies:**
- Injects `CategoryRepository` / `TagRepository`
- Injects `I18nService` for translations

**Methods:**
- `create()` - Creates domain model, validates, persists via repository
- `findAll()` - Gets paginated list via repository
- `findById()` - Gets single entity via repository
- `update()` - Gets existing model, updates via domain methods, persists
- `delete()` - Validates existence, then deletes via repository

---

### Step 6: Controllers

**Files:**
- `category.controller.ts` (root level)
- `tag.controller.ts` (root level)

**Pattern:** Custom controller (NOT extending `BaseKnexController`)

**Endpoints:**
- `GET /v1/categories` - List with pagination
- `GET /v1/categories/:id` - Get by ID (returns 404 if not found)
- `POST /v1/categories` - Create
- `PUT /v1/categories/:id` - Update (returns 404 if not found, 409 if conflict)
- `DELETE /v1/categories/:id` - Soft delete (returns 404 if not found)

---

### Step 7: DTOs

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

### Step 8: i18n Files

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

### Step 9: Product Integration

**Changes:**
- `ProductModel`: Added `categoryId` property
- `ProductService`: 
  - Validates `category_id` on create/update
  - Eager loads category and tags
  - `updateProductTags()` method for many-to-many
- `ProductController`: Added `POST /v1/products/:id/tags` endpoint

---

### Step 10: Module Setup

**Files:**
- `categories.module.ts`
- `tags.module.ts`

**CategoriesModule:**
```typescript
@Module({
  imports: [DatabaseModule, CommonModule, AuthModule],
  providers: [CategoryService, CategoryRepository],
  controllers: [CategoryController],
  exports: [CategoryService, CategoryRepository],
})
export class CategoriesModule {}
```

**TagsModule:**
```typescript
@Module({
  imports: [DatabaseModule, CommonModule, AuthModule],
  providers: [TagService, TagRepository],
  controllers: [TagController],
  exports: [TagService, TagRepository],
})
export class TagsModule {}
```

**Integration:**
- Both modules added to `AppModule` imports
- Both modules added to `ProductsModule` imports (for service injection)

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
- `__tests__/category.model.spec.ts`
- `__tests__/tag.model.spec.ts`

**Service Tests:**
- `__tests__/category.service.spec.ts`
- `__tests__/tag.service.spec.ts`

**Run Tests:**
```bash
pnpm test categories
pnpm test tags
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
- Keep services thin - delegate to domain models and repositories
- Use repository for all database access (never direct Knex in service)
- Handle unique constraint violations in repository
- Validate existence before delete operations
- Use i18n for all messages

### ❌ DON'T

- Don't bypass domain models in services
- Don't put business logic in controllers
- Don't access database directly in services (use repository)
- Don't use `BaseKnexService` or `BaseKnexController` for Category/Tag
- Don't hardcode validation rules
- Don't skip i18n for error messages
- Don't use `new` directly - use factory methods
- Don't let delete succeed silently if entity doesn't exist

---

## Related Documentation

- [Categories & Tags API Documentation](./categories-tags-api-documentation.md)
- [Domain Model Pattern Guide](./architecture-domain-model-pattern-documentation.md)
- [API Swagger Integration Guide](./api-swagger-integration-guide.md)
- [Testing Guide](../../TESTING_GUIDE.md)

---

---

## Error Handling

### Unique Constraint Violations

When creating or updating with duplicate name/slug, the repository catches PostgreSQL error code `23505` and converts it to `DomainConflictException`:

**Category:**
- Duplicate slug → `409 Conflict` with `domain.categories.slug_exists`
- Duplicate name → `409 Conflict` with `domain.categories.name_exists`

**Tag:**
- Duplicate name → `409 Conflict` with `domain.tags.name_exists`

### Delete Validation

Before deleting, the service validates that the entity exists:

- If not found → `404 Not Found` with `domain.categories.not_found` or `domain.tags.not_found`
- If found → Proceeds with soft delete → `200 OK`

---

**Version**: 2.0.0  
**Last Updated**: 2025-01-19
