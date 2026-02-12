# JIRA Task: Create Workshop Service Endpoint

## Task Name
**[BE] Implement Create Workshop Service (Layanan) Endpoint**

---

## User Story

**As a** workshop staff member or owner who is associated with a registered business,  
**I want to** create new services (layanan) for my workshop through the API,  
**So that** customers can see and book the services offered by my workshop.

---

## Description

Implement a POST endpoint to create new workshop services. This endpoint supports both single service creation and batch creation (multiple services at once). The endpoint must validate that the authenticated user is associated with the specified business and that the business is in active status.

### Endpoint Details
- **Method:** POST
- **Path:** `/api/v1/services`
- **Authentication:** Required (Bearer JWT Token)
- **Headers:** 
  - `Authorization: Bearer <jwt_token>` (Required)
  - `x-lang: en | id` (Optional, defaults to 'en')

### Domain Structure
Create a new `service` domain with the following folder structure:
```
src/domains/service/
├── dto/
│   ├── create-service.dto.ts
│   └── index.ts
├── errors/
│   ├── service.error.ts
│   └── index.ts
├── interfaces/
│   ├── service.interface.ts
│   └── index.ts
├── models/
│   ├── service.model.ts
│   └── index.ts
├── repository/
│   ├── service.repository.ts
│   └── index.ts
├── service.controller.ts
├── service.service.ts
├── service.module.ts
└── i18n/
    ├── en.json
    └── id.json
```

---

## Acceptance Criteria

### Functional Requirements

- [ ] **AC-1:** The endpoint accepts POST requests at `/api/v1/services`
- [ ] **AC-2:** The endpoint requires a valid JWT Bearer token in the Authorization header
- [ ] **AC-3:** The endpoint supports `x-lang` header for internationalization (en/id)
- [ ] **AC-4:** The endpoint supports single service creation (object in request body)
- [ ] **AC-5:** The endpoint supports batch service creation (array of objects in request body)
- [ ] **AC-6:** The `id_creator` field is automatically populated from the authenticated user's `public_id`
- [ ] **AC-7:** The `created_at` field is automatically set to current timestamp
- [ ] **AC-8:** The response includes the created service(s) with all fields populated

### Validation Requirements

- [ ] **AC-9:** Validate that `business_id` is required and is a valid UUID format
- [ ] **AC-10:** Validate that the business exists, is not soft-deleted, and has status 'active'
- [ ] **AC-11:** Validate that the authenticated user is associated with the specified business
- [ ] **AC-12:** Validate that `name` is required, non-empty string, max 255 characters
- [ ] **AC-13:** Validate that `name` is unique within the same business (case-insensitive)
- [ ] **AC-14:** Validate that `price` is required, integer, minimum 0, maximum 2,147,483,647
- [ ] **AC-15:** Validate that `description` is optional (can be null or string)
- [ ] **AC-16:** Validate that `duration_minutes` is optional, if provided must be integer, minimum 0, maximum 2,147,483,647
- [ ] **AC-17:** Validate that `daily_quota` is optional, if provided must be integer, minimum 0, maximum 2,147,483,647

### Batch Creation Requirements

- [ ] **AC-18:** When batch creating, validate all items before creating any
- [ ] **AC-19:** When batch creating, if any item fails validation, return error without creating any services
- [ ] **AC-20:** When batch creating, check for duplicate names within the batch itself
- [ ] **AC-21:** When batch creating, all services in the batch must belong to the same business_id

### Error Handling Requirements

- [ ] **AC-22:** Return appropriate error codes with i18n support
- [ ] **AC-23:** Return 401 Unauthorized when JWT token is missing or invalid
- [ ] **AC-24:** Return 403 Forbidden when user is not associated with the business
- [ ] **AC-25:** Return 400 Bad Request for validation errors with specific field messages
- [ ] **AC-26:** Return 404 Not Found when business does not exist
- [ ] **AC-27:** Return 409 Conflict when service name already exists in the same business

### Technical Requirements

- [ ] **AC-28:** Follow the domain-driven design pattern as per product domain reference
- [ ] **AC-29:** Implement i18n for all error messages and responses
- [ ] **AC-30:** Create comprehensive unit tests (minimum 30 positive, 30 negative, 30 edge cases)
- [ ] **AC-31:** Repository layer handles database operations
- [ ] **AC-32:** Service layer handles business logic
- [ ] **AC-33:** Controller layer handles HTTP request/response

---

## Request Body

### Single Service Creation
```json
{
  "business_id": "uuid",
  "name": "string (required, max 255 chars)",
  "description": "string | null (optional)",
  "price": "integer (required, min 0)",
  "duration_minutes": "integer | null (optional, min 0)",
  "daily_quota": "integer | null (optional, min 0)"
}
```

### Batch Service Creation
```json
{
  "services": [
    {
      "business_id": "uuid",
      "name": "string (required, max 255 chars)",
      "description": "string | null (optional)",
      "price": "integer (required, min 0)",
      "duration_minutes": "integer | null (optional, min 0)",
      "daily_quota": "integer | null (optional, min 0)"
    }
  ]
}
```

---

## Expected Response Body

### Single Service Creation - Success (201 Created)
```json
{
  "statusCode": 201,
  "message": "Service created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "business_id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Oil Change Service",
    "description": "Complete oil change with quality oil",
    "price": 150000,
    "duration_minutes": 60,
    "daily_quota": 10,
    "created_at": "2026-02-02T10:00:00.000Z",
    "updated_at": null,
    "id_creator": "770e8400-e29b-41d4-a716-446655440002",
    "id_updater": null
  }
}
```

### Batch Service Creation - Success (201 Created)
```json
{
  "statusCode": 201,
  "message": "Services created successfully",
  "data": {
    "created_count": 3,
    "services": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "business_id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Oil Change Service",
        "description": "Complete oil change",
        "price": 150000,
        "duration_minutes": 60,
        "daily_quota": 10,
        "created_at": "2026-02-02T10:00:00.000Z",
        "updated_at": null,
        "id_creator": "770e8400-e29b-41d4-a716-446655440002",
        "id_updater": null
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "business_id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Tire Rotation",
        "description": null,
        "price": 50000,
        "duration_minutes": 30,
        "daily_quota": null,
        "created_at": "2026-02-02T10:00:00.000Z",
        "updated_at": null,
        "id_creator": "770e8400-e29b-41d4-a716-446655440002",
        "id_updater": null
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440004",
        "business_id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Engine Tune-up",
        "description": "Full engine diagnostic and tune-up",
        "price": 500000,
        "duration_minutes": 120,
        "daily_quota": 5,
        "created_at": "2026-02-02T10:00:00.000Z",
        "updated_at": null,
        "id_creator": "770e8400-e29b-41d4-a716-446655440002",
        "id_updater": null
      }
    ]
  }
}
```

### Error Response Examples

#### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "UNAUTHORIZED"
}
```

#### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "You are not authorized to create services for this business",
  "error": "SERVICE_FORBIDDEN_NOT_ASSOCIATED"
}
```

#### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Business not found",
  "error": "SERVICE_BUSINESS_NOT_FOUND"
}
```

#### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Service with this name already exists in this business",
  "error": "SERVICE_NAME_DUPLICATE"
}
```

#### 400 Bad Request (Validation Error)
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR",
  "details": [
    {
      "field": "name",
      "message": "Name is required"
    },
    {
      "field": "price",
      "message": "Price must be a non-negative integer"
    }
  ]
}
```

---

## Unit Test Cases

### Success Test Cases (Positive Cases) - Minimum 30

| # | Test Case Name | Description |
|---|----------------|-------------|
| 1 | Should create a single service with all required fields | Create service with name, price, business_id only |
| 2 | Should create a single service with all fields populated | Create service with all fields including optional ones |
| 3 | Should create service with description as null | Verify null description is accepted |
| 4 | Should create service with duration_minutes as null | Verify null duration is accepted |
| 5 | Should create service with daily_quota as null | Verify null quota is accepted |
| 6 | Should create service with price as 0 (free service) | Verify zero price is valid |
| 7 | Should create service with minimum duration (0 minutes) | Verify zero duration is valid |
| 8 | Should create service with minimum quota (0) | Verify zero quota is valid |
| 9 | Should create service with maximum price (2147483647) | Verify max int4 value for price |
| 10 | Should create service with maximum duration (2147483647) | Verify max int4 value for duration |
| 11 | Should create service with maximum quota (2147483647) | Verify max int4 value for quota |
| 12 | Should create service with name at max length (255 chars) | Verify max name length works |
| 13 | Should create service with very long description | Verify long description is accepted |
| 14 | Should auto-populate id_creator from authenticated user | Verify id_creator is set correctly |
| 15 | Should auto-populate created_at timestamp | Verify created_at is set to current time |
| 16 | Should return id_updater as null on creation | Verify id_updater is null initially |
| 17 | Should return updated_at as null on creation | Verify updated_at is null initially |
| 18 | Should create service with x-lang header set to 'en' | Verify English response messages |
| 19 | Should create service with x-lang header set to 'id' | Verify Indonesian response messages |
| 20 | Should create service without x-lang header (default to en) | Verify default language behavior |
| 21 | Should batch create multiple services (2 services) | Create 2 services in one request |
| 22 | Should batch create multiple services (5 services) | Create 5 services in one request |
| 23 | Should batch create multiple services (10 services) | Create 10 services in one request |
| 24 | Should batch create services with different optional values | Mix of null and populated optional fields |
| 25 | Should allow same service name in different businesses | Verify name uniqueness is per-business |
| 26 | Should create service when user is business owner | Owner can create services |
| 27 | Should create service when user is business staff | Staff member can create services |
| 28 | Should generate unique UUID for each created service | Verify each service gets unique ID |
| 29 | Should create service with special characters in name | Names like "Oil Change (Premium)" |
| 30 | Should create service with unicode characters in description | Support for non-ASCII characters |
| 31 | Should create service with numbers in name | Names like "Service Package 1" |
| 32 | Should create service with description containing line breaks | Multi-line descriptions |
| 33 | Should return correct created_count in batch response | Verify count matches actual created |
| 34 | Should preserve order of services in batch response | Response order matches request order |
| 35 | Should create service with price containing leading zeros input normalized | Price "0150000" normalized to 150000 |

### Failed Test Cases (Negative Cases) - Minimum 30

| # | Test Case Name | Description |
|---|----------------|-------------|
| 1 | Should fail when Authorization header is missing | 401 Unauthorized |
| 2 | Should fail when JWT token is invalid | 401 Unauthorized |
| 3 | Should fail when JWT token is expired | 401 Unauthorized |
| 4 | Should fail when JWT token is malformed | 401 Unauthorized |
| 5 | Should fail when business_id is missing | 400 Validation Error |
| 6 | Should fail when business_id is not a valid UUID | 400 Validation Error |
| 7 | Should fail when business_id does not exist | 404 Not Found |
| 8 | Should fail when business is soft-deleted | 404 Not Found |
| 9 | Should fail when business status is 'pending' | 400 Business Not Active |
| 10 | Should fail when business status is 'banned' | 400 Business Not Active |
| 11 | Should fail when user is not associated with business | 403 Forbidden |
| 12 | Should fail when name is missing | 400 Validation Error |
| 13 | Should fail when name is empty string | 400 Validation Error |
| 14 | Should fail when name is only whitespace | 400 Validation Error |
| 15 | Should fail when name exceeds 255 characters | 400 Validation Error |
| 16 | Should fail when name already exists in same business | 409 Conflict |
| 17 | Should fail when name already exists (case-insensitive) | 409 Conflict - "Oil Change" vs "OIL CHANGE" |
| 18 | Should fail when price is missing | 400 Validation Error |
| 19 | Should fail when price is negative | 400 Validation Error |
| 20 | Should fail when price is a decimal number | 400 Validation Error |
| 21 | Should fail when price is a string | 400 Validation Error |
| 22 | Should fail when price exceeds int4 max | 400 Validation Error |
| 23 | Should fail when duration_minutes is negative | 400 Validation Error |
| 24 | Should fail when duration_minutes is a decimal | 400 Validation Error |
| 25 | Should fail when duration_minutes exceeds int4 max | 400 Validation Error |
| 26 | Should fail when daily_quota is negative | 400 Validation Error |
| 27 | Should fail when daily_quota is a decimal | 400 Validation Error |
| 28 | Should fail when daily_quota exceeds int4 max | 400 Validation Error |
| 29 | Should fail batch when one item has invalid business_id | All-or-nothing validation |
| 30 | Should fail batch when items have different business_ids | Must be same business |
| 31 | Should fail batch when duplicate names within batch | 409 Conflict |
| 32 | Should fail batch when one name conflicts with existing | 409 Conflict |
| 33 | Should fail when request body is empty | 400 Validation Error |
| 34 | Should fail when request body is not JSON | 400 Bad Request |
| 35 | Should fail when services array is empty in batch mode | 400 Validation Error |

### Edge Cases - Minimum 30

| # | Test Case Name | Description |
|---|----------------|-------------|
| 1 | Should handle name with leading/trailing whitespace | Trim whitespace from name |
| 2 | Should handle name with multiple consecutive spaces | Normalize internal spaces |
| 3 | Should handle description with only whitespace | Treat as null or empty |
| 4 | Should handle concurrent requests creating same service name | First wins, second gets 409 |
| 5 | Should handle batch with 100 services | Performance/limit testing |
| 6 | Should handle batch with 1 service (minimum batch) | Single item in array |
| 7 | Should handle price at boundary: 0 | Minimum boundary |
| 8 | Should handle price at boundary: 2147483647 | Maximum boundary |
| 9 | Should handle price at boundary: 2147483646 | One below maximum |
| 10 | Should handle duration at boundary: 0 | Minimum boundary |
| 11 | Should handle duration at boundary: 2147483647 | Maximum boundary |
| 12 | Should handle quota at boundary: 0 | Minimum boundary |
| 13 | Should handle quota at boundary: 2147483647 | Maximum boundary |
| 14 | Should handle name at boundary: 1 character | Minimum valid name |
| 15 | Should handle name at boundary: 255 characters | Maximum valid name |
| 16 | Should handle name at boundary: 256 characters | Just over maximum |
| 17 | Should handle empty description vs null description | Distinguish "" from null |
| 18 | Should handle database connection failure gracefully | 500 Internal Server Error |
| 19 | Should handle transaction rollback on partial batch failure | Atomicity |
| 20 | Should handle name with SQL injection attempt | Security: sanitize input |
| 21 | Should handle name with XSS attempt | Security: sanitize input |
| 22 | Should handle description with HTML tags | Sanitize or escape |
| 23 | Should handle JWT token with wrong signature | 401 Unauthorized |
| 24 | Should handle case-insensitive duplicate: "SERVICE" vs "service" | 409 Conflict |
| 25 | Should handle case-insensitive duplicate: "Service" vs "SERVICE" | 409 Conflict |
| 26 | Should handle unicode name: Japanese characters | "オイル交換" |
| 27 | Should handle unicode name: Arabic characters | "تغيير الزيت" |
| 28 | Should handle unicode name: Emoji in name | "🔧 Service" - accept or reject |
| 29 | Should handle extremely long description (1MB text) | Performance/storage limits |
| 30 | Should handle request timeout during database insert | Handle gracefully |
| 31 | Should handle business becoming inactive during request | Race condition handling |
| 32 | Should handle user being disassociated during request | Race condition handling |
| 33 | Should handle null vs undefined for optional fields | Distinguish missing vs null |
| 34 | Should handle numeric string for price: "150000" | Type coercion or reject |
| 35 | Should handle boolean value for price: true | 400 Validation Error |
| 36 | Should handle array value for name: ["a", "b"] | 400 Validation Error |
| 37 | Should handle object value for price: {} | 400 Validation Error |
| 38 | Should handle float price that looks like int: 150000.0 | Accept or reject |
| 39 | Should handle negative zero for price: -0 | Treat as 0 |
| 40 | Should handle Infinity for numeric fields | 400 Validation Error |

---

## Error Codes Reference

| Error Code | HTTP Status | Description (EN) | Description (ID) |
|------------|-------------|------------------|------------------|
| UNAUTHORIZED | 401 | Authentication required | Autentikasi diperlukan |
| INVALID_TOKEN | 401 | Invalid or expired token | Token tidak valid atau kadaluarsa |
| SERVICE_FORBIDDEN_NOT_ASSOCIATED | 403 | You are not authorized to create services for this business | Anda tidak memiliki akses untuk membuat layanan di bisnis ini |
| SERVICE_BUSINESS_NOT_FOUND | 404 | Business not found | Bisnis tidak ditemukan |
| SERVICE_BUSINESS_NOT_ACTIVE | 400 | Business is not active | Bisnis tidak aktif |
| SERVICE_NAME_REQUIRED | 400 | Service name is required | Nama layanan wajib diisi |
| SERVICE_NAME_TOO_LONG | 400 | Service name cannot exceed 255 characters | Nama layanan tidak boleh melebihi 255 karakter |
| SERVICE_NAME_DUPLICATE | 409 | Service with this name already exists in this business | Layanan dengan nama ini sudah ada di bisnis ini |
| SERVICE_PRICE_REQUIRED | 400 | Price is required | Harga wajib diisi |
| SERVICE_PRICE_INVALID | 400 | Price must be a non-negative integer | Harga harus berupa bilangan bulat non-negatif |
| SERVICE_DURATION_INVALID | 400 | Duration must be a non-negative integer | Durasi harus berupa bilangan bulat non-negatif |
| SERVICE_QUOTA_INVALID | 400 | Daily quota must be a non-negative integer | Kuota harian harus berupa bilangan bulat non-negatif |
| SERVICE_BATCH_DIFFERENT_BUSINESS | 400 | All services in batch must belong to the same business | Semua layanan dalam batch harus milik bisnis yang sama |
| SERVICE_BATCH_DUPLICATE_NAMES | 400 | Duplicate service names found in batch | Ditemukan nama layanan duplikat dalam batch |
| VALIDATION_ERROR | 400 | Validation failed | Validasi gagal |
| INTERNAL_SERVER_ERROR | 500 | An unexpected error occurred | Terjadi kesalahan yang tidak terduga |

---

## Technical Notes

### Database Schema Reference
- Table: `service.services`
- Primary Key: `id` (UUID, auto-generated)
- Foreign Keys:
  - `business_id` → `business.businesses(id)` ON DELETE CASCADE
  - `id_creator` → `core.users(public_id)`
  - `id_updater` → `core.users(public_id)`

### Business Association Validation
The system must verify user-business association. This could be done by:
1. Checking if user is the owner of the business (`businesses.owner_id`)
2. Checking if user is a staff member (if staff table exists)
3. Using a business-user association table (if exists)

### Performance Considerations
- Index on `business_id` for fast lookups
- Consider adding composite unique index on `(business_id, LOWER(name))` for case-insensitive uniqueness
- Batch inserts should use transactions

### i18n Implementation
- Create translation files: `en.json` and `id.json`
- Error messages should be translatable
- Success messages should be translatable
- Use `x-lang` header to determine language (default: 'en')

---

## Definition of Done

- [ ] Endpoint implemented and accessible at POST `/api/v1/services`
- [ ] All acceptance criteria met
- [ ] All 35+ positive test cases passing
- [ ] All 35+ negative test cases passing
- [ ] All 40 edge case scenarios handled
- [ ] Code coverage minimum 80%
- [ ] i18n implemented for EN and ID languages
- [ ] API documentation updated (Swagger/OpenAPI)
- [ ] Code reviewed and approved
- [ ] No critical or high severity bugs

---

## Story Points
**8 Points** (Medium-Large complexity due to batch support and comprehensive testing requirements)

---

## Labels
`backend`, `api`, `service-domain`, `feature`, `workshop-management`

---

## Sprint
*To be assigned*

---

## Priority
**High** - Core feature for workshop service management

