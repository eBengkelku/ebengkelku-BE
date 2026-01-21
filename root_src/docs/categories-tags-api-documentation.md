# Categories & Tags API Documentation

## Overview

Complete API documentation for Categories and Tags management endpoints. Both domains use **Rich Domain Model Pattern** with custom controllers and repositories, providing standardized REST endpoints with pagination and i18n support.

## TL;DR

- **Categories**: Product classification with auto-generated slugs, name/description management
- **Tags**: Product labeling with hex color codes, max 20 character names
- **Custom Controllers**: Custom implementation (NOT using `BaseKnexController`)
- **Repository Pattern**: Data access through `CategoryRepository` and `TagRepository`
- **Relationships**: Many-to-One (Product → Category), Many-to-Many (Product ↔ Tag)
- **Error Handling**: Unique constraint violations return 409 Conflict, delete validates existence (404 if not found)
- **Swagger UI**: Available at `http://localhost:3004/api-docs` (tags: `categories`, `tags`)

---

## Categories API

### Base URL
```
/v1/categories
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/categories` | List categories with pagination |
| GET | `/v1/categories/:id` | Get category by ID (404 if not found) |
| POST | `/v1/categories` | Create new category (409 if duplicate slug/name) |
| PUT | `/v1/categories/:id` | Update category (404 if not found, 409 if conflict) |
| DELETE | `/v1/categories/:id` | Soft delete category (404 if not found) |

### Request/Response Examples

#### Create Category

**Request:**
```http
POST /v1/categories
Content-Type: application/json
Authorization: Bearer <token>
x-lang: en

{
  "name": "Electronics",
  "description": "Electronic items and gadgets",
  "slug": "electronics"  // Optional, auto-generated if not provided
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Category created successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Electronics",
    "slug": "electronics",
    "description": "Electronic items and gadgets",
    "created_at": "2025-01-13T10:00:00.000Z",
    "updated_at": "2025-01-13T10:00:00.000Z",
    "deleted_at": null
  }
}
```

#### List Categories (Pagination)

**Request:**
```http
GET /v1/categories?page=1&limit=10
Authorization: Bearer <token>
x-lang: en
```

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Categories retrieved successfully",
  "data": {
    "items": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Electronics",
        "slug": "electronics",
        "description": "Electronic items",
        "created_at": "2025-01-13T10:00:00.000Z",
        "updated_at": "2025-01-13T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### Update Category

**Request:**
```http
PUT /v1/categories/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json
Authorization: Bearer <token>
x-lang: en

{
  "name": "Updated Electronics",
  "description": "Updated description"
}
```

**Note:** Slug is auto-regenerated when name changes.

---

## Tags API

### Base URL
```
/v1/tags
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/tags` | List tags with pagination |
| GET | `/v1/tags/:id` | Get tag by ID (404 if not found) |
| POST | `/v1/tags` | Create new tag (409 if duplicate name) |
| PUT | `/v1/tags/:id` | Update tag (404 if not found, 409 if conflict) |
| DELETE | `/v1/tags/:id` | Soft delete tag (404 if not found) |

### Request/Response Examples

#### Create Tag

**Request:**
```http
POST /v1/tags
Content-Type: application/json
Authorization: Bearer <token>
x-lang: en

{
  "name": "Hot Item",
  "color": "#FF0000"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Tag created successfully",
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Hot Item",
    "color": "#FF0000",
    "created_at": "2025-01-13T10:00:00.000Z",
    "updated_at": "2025-01-13T10:00:00.000Z",
    "deleted_at": null
  }
}
```

#### List Tags (Pagination)

**Request:**
```http
GET /v1/tags?page=1&limit=10
Authorization: Bearer <token>
x-lang: en
```

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Tags retrieved successfully",
  "data": {
    "items": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Hot Item",
        "color": "#FF0000",
        "created_at": "2025-01-13T10:00:00.000Z",
        "updated_at": "2025-01-13T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### Update Tag

**Request:**
```http
PUT /v1/tags/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json
Authorization: Bearer <token>
x-lang: en

{
  "name": "Promo",
  "color": "#00FF00"
}
```

---

## Product Integration

### Assign Category to Product

**Request:**
```http
POST /v1/products
Content-Type: application/json
Authorization: Bearer <token>
x-lang: en

{
  "name": "iPhone 15 Pro",
  "price": 999.99,
  "stock_quantity": 50,
  "category_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Manage Product Tags

**Request:**
```http
POST /v1/products/123e4567-e89b-12d3-a456-426614174000/tags
Content-Type: application/json
Authorization: Bearer <token>
x-lang: en

{
  "tag_ids": [
    "123e4567-e89b-12d3-a456-426614174000",
    "a70af782-1f60-4f00-b448-6cb59c46b1dd"
  ]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Product tags updated successfully",
  "data": {
    "id": "product-uuid",
    "name": "iPhone 15 Pro",
    "tags": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Hot Item",
        "color": "#FF0000"
      },
      {
        "id": "a70af782-1f60-4f00-b448-6cb59c46b1dd",
        "name": "Promo",
        "color": "#00FF00"
      }
    ]
  }
}
```

---

## Validation Rules

### Category Validation

| Field | Required | Type | Max Length | Rules |
|-------|----------|------|------------|-------|
| `name` | ✅ Yes | string | 255 | Cannot be empty |
| `slug` | ⚠️ Auto | string | 255 | Lowercase, alphanumeric with hyphens |
| `description` | ❌ No | string | - | Optional |

**Business Rules:**
- Slug auto-generated from name if not provided
- Slug format: lowercase, alphanumeric with hyphens only
- Name and slug must be unique (enforced at database level)

### Tag Validation

| Field | Required | Type | Max Length | Rules |
|-------|----------|------|------------|-------|
| `name` | ✅ Yes | string | 20 | Cannot be empty, max 20 chars |
| `color` | ✅ Yes | string | 7 | Hex format: #RRGGBB or #RGB |

**Business Rules:**
- Name cannot exceed 20 characters
- Color must be valid hex format (#RRGGBB or #RGB)
- Color normalized to uppercase
- Name must be unique (enforced at database level)

---

## Error Responses

### Validation Error (400 Bad Request)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Category name is required",
      "code": "domain.categories.validation.name_required"
    }
  ]
}
```

### Not Found (404 Not Found)

**When:** Category/Tag not found (get, update, delete)

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Category with id 'uuid-123' not found",
  "data": null,
  "errors": {
    "code": "NOT_FOUND",
    "message": "domain.categories.not_found"
  }
}
```

### Conflict (409 Conflict)

**When:** Unique constraint violation (duplicate name/slug)

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Category with slug 'electronics' already exists",
  "data": null,
  "errors": {
    "code": "CONFLICT",
    "message": "domain.categories.slug_exists"
  }
}
```

### Unauthorized (401 Unauthorized)

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Authentication required",
  "data": null
}
```

---

## Authentication

All endpoints require authentication:

1. **JWT Bearer Token:**
   ```http
   Authorization: Bearer <your-jwt-token>
   ```

2. **Service Authentication:**
   ```http
   app_service_id: <your-service-id>
   app_service_secret: <your-service-secret>
   ```

See [JWT Token Guide](../../JWT_TOKEN_GUIDE.md) for details.

---

## Internationalization

All responses support i18n via `x-lang` header:

- `x-lang: en` - English (default)
- `x-lang: id` - Indonesian

**Example:**
```http
GET /v1/categories
x-lang: id
```

---

## Swagger UI

Interactive API documentation available at:
- **URL**: `http://localhost:3004/api-docs`
- **Tags**: `categories`, `tags`
- **Features**: 
  - Interactive testing
  - Request/response schemas
  - Authentication support
  - Example values

---

## Related Documentation

- [Categories & Tags Domain Implementation Guide](./categories-tags-domain-implementation-guide.md)
- [Domain Model Pattern Guide](./architecture-domain-model-pattern-documentation.md)
- [API Pagination Documentation](./api-pagination-complete-documentation.md)
- [Swagger Integration Guide](./api-swagger-integration-guide.md)
- [Testing Guide](../../TESTING_GUIDE.md)
- [Postman Testing Guide](../../POSTMAN_TESTING_GUIDE.md)

---

---

## Architecture Notes

### Domain Separation

Categories and Tags are now **separate domains**:
- `domains/categories/` - Category domain with its own module, repository, service, controller
- `domains/tags/` - Tag domain with its own module, repository, service, controller

### Rich Domain Model Pattern

Both domains follow the Rich Domain Model Pattern:
- **Controller** → **Service** → **Repository** → **Model** → **Database**
- Services do NOT extend `BaseKnexService`
- Controllers do NOT extend `BaseKnexController`
- All database access goes through Repository layer

### Error Handling

- **Unique Constraint Violations**: Caught in repository, converted to `DomainConflictException` (409 Conflict)
- **Delete Validation**: Service validates existence before delete (404 if not found)
- **Type Validation**: DTO validation errors return appropriate error codes (`VALIDATION_STRING`, `VALIDATION_LENGTH`, etc.)

---

**Version**: 2.0.0  
**Last Updated**: 2025-01-19
