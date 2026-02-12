# Technical Plan: GET /v1/business Endpoint

## 📋 Overview

**Endpoint**: `GET /v1/business`  
**Purpose**: Retrieve all businesses owned by the authenticated user  
**Authentication**: Required (Bearer Token / JWT)  
**Authorization**: Business owner only

---

## 🎯 Requirements

1. ✅ Create GET endpoint at `/v1/business`
2. ✅ Require Bearer Token authentication
3. ✅ Validate user is authenticated
4. ✅ Return only businesses owned by the authenticated user
5. ✅ Follow existing domain structure (products domain as reference)
6. ✅ Implement i18n (internationalization)
7. ✅ Create comprehensive unit tests (30+ positive, 30+ negative, edge cases)

---

## 🏗️ Architecture Overview

### Request-Response Flow Diagram

```
┌─────────────┐
│   Client    │
│  (Browser/  │
│   Mobile)   │
└──────┬──────┘
       │
       │ GET /v1/business
       │ Headers: Authorization: Bearer <token>
       │          x-lang: en|id
       ▼
┌─────────────────────────────────────────────────────┐
│            NestJS Application Layer                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  1. JwtAuthGuard                           │    │
│  │  - Extract token from Authorization header │    │
│  │  - Verify JWT signature & expiration       │    │
│  │  - Decode payload to get user.sub          │    │
│  │  - Attach user object to request           │    │
│  └────────────┬───────────────────────────────┘    │
│               │                                     │
│               ▼                                     │
│  ┌────────────────────────────────────────────┐    │
│  │  2. BusinessController                     │    │
│  │  @Get()                                    │    │
│  │  - Extract req.user.sub (JWT public_id)   │    │
│  │  - Extract x-lang header                   │    │
│  │  - Call service.findAllByOwner()           │    │
│  │  - Apply @ResponseMessage decorator        │    │
│  └────────────┬───────────────────────────────┘    │
│               │                                     │
│               ▼                                     │
│  ┌────────────────────────────────────────────┐    │
│  │  3. BusinessService                        │    │
│  │  - Resolve owner_id from JWT sub           │    │
│  │  - Call repository.findAllByOwnerId()      │    │
│  │  - Orchestrate business logic              │    │
│  └────────────┬───────────────────────────────┘    │
│               │                                     │
│               ▼                                     │
│  ┌────────────────────────────────────────────┐    │
│  │  4. BusinessRepository                     │    │
│  │  - Query database with LEFT JOIN           │    │
│  │  - Join businesses with business_hours     │    │
│  │  - Filter by owner_id                      │    │
│  │  - Exclude soft-deleted records            │    │
│  │  - Map raw data to domain interfaces       │    │
│  └────────────┬───────────────────────────────┘    │
│               │                                     │
└───────────────┼─────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────┐
│            PostgreSQL Database                     │
├───────────────────────────────────────────────────┤
│                                                    │
│  business.businesses                               │
│  ├── id (PK, UUID)                                │
│  ├── owner_id (FK → core.users.id)               │
│  ├── name, tagline, status, phone                 │
│  ├── image, cover_image                           │
│  ├── latitude, longitude, address                 │
│  ├── created_at, updated_at, deleted_at           │
│  └── id_creator, id_updater                       │
│                                                    │
│  business.business_hours                           │
│  ├── id (PK, UUID)                                │
│  ├── business_id (FK → businesses.id)            │
│  ├── day_of_week (0-6)                            │
│  ├── open_time, close_time (HH:MM)               │
│  ├── created_at, updated_at, deleted_at           │
│  └── id_creator, id_updater                       │
│                                                    │
└───────────────────────────────────────────────────┘
                │
                │ Result Set
                ▼
┌───────────────────────────────────────────────────┐
│  Response (JSON)                                   │
├───────────────────────────────────────────────────┤
│  {                                                 │
│    "statusCode": 200,                             │
│    "message": "businesses.listed",                │
│    "data": [                                      │
│      {                                            │
│        "business": { ... },                       │
│        "business_hours": [ ... ]                  │
│      }                                            │
│    ]                                              │
│  }                                                │
└───────────────────────────────────────────────────┘
```

---

## 📦 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     Data Transformation Flow                  │
└──────────────────────────────────────────────────────────────┘

JWT Token (Header)
    │
    │ Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
    │
    ▼
┌─────────────────────────────────────┐
│  JWT Payload (Decoded)              │
│  {                                  │
│    "sub": "uuid-public-id",         │  ← public_id from core.users
│    "email": "user@example.com",     │
│    "iat": 1643723400,               │
│    "exp": 1643809800                │
│  }                                  │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Repository Query                   │
│  - Lookup owner_id from public_id   │
│  - core.users.id WHERE public_id    │
└─────────────────┬───────────────────┘
                  │
                  │ owner_id: "uuid-internal-id"
                  ▼
┌─────────────────────────────────────┐
│  LEFT JOIN Query                    │
│                                     │
│  SELECT                             │
│    businesses.*,                    │
│    business_hours.*                 │
│  FROM business.businesses           │
│  LEFT JOIN business.business_hours  │
│    ON businesses.id =               │
│       business_hours.business_id    │
│  WHERE businesses.owner_id = ?      │
│    AND businesses.deleted_at IS NULL│
│    AND business_hours.deleted_at    │
│        IS NULL                      │
│  ORDER BY                           │
│    businesses.created_at DESC,      │
│    business_hours.day_of_week ASC   │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Raw Database Rows (Flattened)     │
│  [                                  │
│    {                                │
│      id: "business-1",              │
│      owner_id: "...",               │
│      name: "Bengkel A",             │
│      hour_id: "hour-1",             │
│      hour_day_of_week: 1,           │
│      ...                            │
│    },                               │
│    {                                │
│      id: "business-1",              │
│      owner_id: "...",               │
│      name: "Bengkel A",             │
│      hour_id: "hour-2",             │
│      hour_day_of_week: 2,           │
│      ...                            │
│    },                               │
│    {                                │
│      id: "business-2",              │
│      owner_id: "...",               │
│      name: "Bengkel B",             │
│      hour_id: null,                 │
│      ...                            │
│    }                                │
│  ]                                  │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Data Transformation Logic          │
│  - Group rows by business.id        │
│  - Extract business fields          │
│  - Collect all business_hours       │
│  - Filter null hours (LEFT JOIN)    │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Structured Response                │
│  [                                  │
│    {                                │
│      business: {                    │
│        id: "business-1",            │
│        owner_id: "...",             │
│        name: "Bengkel A",           │
│        tagline: "...",              │
│        status: "active",            │
│        ...                          │
│      },                             │
│      business_hours: [              │
│        {                            │
│          id: "hour-1",              │
│          day_of_week: 1,            │
│          open_time: "08:00",        │
│          close_time: "17:00",       │
│          ...                        │
│        },                           │
│        {                            │
│          id: "hour-2",              │
│          day_of_week: 2,            │
│          ...                        │
│        }                            │
│      ]                              │
│    },                               │
│    {                                │
│      business: {                    │
│        id: "business-2",            │
│        name: "Bengkel B",           │
│        ...                          │
│      },                             │
│      business_hours: []             │
│    }                                │
│  ]                                  │
└─────────────────────────────────────┘
```

---

## 🔧 Implementation Details

### 1. Controller Layer

**File**: `root_src/src/domains/businesses/business.controller.ts`

#### Method Signature

```typescript
@Get()
@HttpCode(HttpStatus.OK)
@ResponseMessage('businesses.listed')
@ApiOperation({
  summary: 'Get all businesses owned by authenticated user',
  description: 'Returns all businesses with their operating hours for the current user.'
})
@ApiResponse({
  status: 200,
  description: 'Businesses retrieved successfully'
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized - Invalid or missing token'
})
async findAll(
  @Req() req: Request & { user?: { sub: string } }
): Promise<Array<{
  business: IBusiness;
  business_hours: IBusinessHours[];
}>>
```

#### Logic Flow

1. Extract `req.user.sub` (JWT public_id)
2. Extract `x-lang` header for i18n
3. Validate user authentication
4. Call `businessService.findAllByOwner(sub, lang)`
5. Return structured response

#### Error Handling

- **401 Unauthorized**: Missing or invalid JWT token
- **500 Internal Server Error**: Database or service errors

---

### 2. Service Layer

**File**: `root_src/src/domains/businesses/business.service.ts`

#### Method Signature

```typescript
async findAllByOwner(
  sub: string,
  lang?: string
): Promise<Array<{
  business: IBusiness;
  business_hours: IBusinessHours[];
}>>
```

#### Logic Flow

1. **Validate Input**
   - Check `sub` is not empty
   - Throw `UnauthorizedException` if invalid

2. **Resolve Owner ID**
   - Call `resolveOwnerIdFromSub(sub)` to get internal `owner_id`
   - This prevents JWT spoofing by looking up `core.users.id` from `public_id`

3. **Fetch Data**
   - Call `repository.findAllByOwnerId(ownerId)`
   - Repository handles LEFT JOIN and data mapping

4. **Return Results**
   - Return array of business + hours structures
   - Empty array if no businesses found

#### Business Rules

- Only return businesses where `owner_id` matches authenticated user
- Exclude soft-deleted businesses (`deleted_at IS NULL`)
- Include all business_hours via LEFT JOIN (even if no hours exist)
- Order by `created_at DESC` (newest first)

---

### 3. Repository Layer

**File**: `root_src/src/domains/businesses/repository/business.repository.ts`

#### Method Signature

```typescript
async findAllByOwnerId(
  ownerId: string
): Promise<Array<{
  business: IBusiness;
  business_hours: IBusinessHours[];
}>>
```

#### SQL Query Structure

```sql
SELECT
  b.id,
  b.owner_id,
  b.name,
  b.tagline,
  b.status,
  b.phone,
  b.image,
  b.cover_image,
  b.latitude,
  b.longitude,
  b.address,
  b.created_at,
  b.updated_at,
  b.deleted_at,
  b.id_creator,
  b.id_updater,
  bh.id AS hour_id,
  bh.business_id AS hour_business_id,
  bh.day_of_week AS hour_day_of_week,
  bh.open_time AS hour_open_time,
  bh.close_time AS hour_close_time,
  bh.created_at AS hour_created_at,
  bh.updated_at AS hour_updated_at,
  bh.deleted_at AS hour_deleted_at,
  bh.id_creator AS hour_id_creator,
  bh.id_updater AS hour_id_updater
FROM business.businesses b
LEFT JOIN business.business_hours bh
  ON b.id = bh.business_id
  AND bh.deleted_at IS NULL
WHERE b.owner_id = ?
  AND b.deleted_at IS NULL
ORDER BY b.created_at DESC, bh.day_of_week ASC
```

#### Data Transformation Logic

```typescript
// 1. Execute query and get flattened rows
const rows = await this.knex
  .withSchema('business')
  .from('businesses as b')
  .leftJoin('business_hours as bh', ...)
  .where('b.owner_id', ownerId)
  .whereNull('b.deleted_at')
  ...

// 2. Group by business.id
const businessMap = new Map<string, {
  business: IBusiness;
  business_hours: IBusinessHours[];
}>();

for (const row of rows) {
  const businessId = row.id;

  // Initialize business if not exists
  if (!businessMap.has(businessId)) {
    businessMap.set(businessId, {
      business: {
        id: row.id,
        owner_id: row.owner_id,
        name: row.name,
        tagline: row.tagline ?? null,
        status: row.status,
        phone: row.phone ?? null,
        image: row.image ?? null,
        cover_image: row.cover_image ?? null,
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
        address: row.address ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at ?? null,
        deleted_at: row.deleted_at ?? null,
        id_creator: row.id_creator ?? null,
        id_updater: row.id_updater ?? null,
      },
      business_hours: []
    });
  }

  // Add business hour if exists (LEFT JOIN may return null)
  if (row.hour_id) {
    businessMap.get(businessId)!.business_hours.push({
      id: row.hour_id,
      business_id: row.hour_business_id,
      day_of_week: row.hour_day_of_week,
      open_time: row.hour_open_time,
      close_time: row.hour_close_time,
      created_at: row.hour_created_at ?? null,
      updated_at: row.hour_updated_at ?? null,
      deleted_at: row.hour_deleted_at ?? null,
      id_creator: row.hour_id_creator ?? null,
      id_updater: row.hour_id_updater ?? null,
    });
  }
}

// 3. Convert Map to Array
return Array.from(businessMap.values());
```

#### Why LEFT JOIN?

- Businesses may not have operating hours
- We want to return all businesses, even those without hours
- LEFT JOIN ensures we don't lose businesses that lack hours
- Follows project guideline: "prefer LEFT JOIN over INNER JOIN"

---

### 4. DTO Layer

**File**: `root_src/src/domains/businesses/dto/business.dto.ts`

#### Response DTO (Optional - for Swagger documentation)

```typescript
export class BusinessResponseDto extends BaseDto {
  @ApiProperty({
    description: "Business unique identifier",
    example: "a70af782-1f60-4f00-b448-6cb59c46b1dd",
  })
  id: string;

  @ApiProperty({
    description: "Owner user ID",
    example: "user-uuid-123",
  })
  owner_id: string;

  @ApiProperty({
    description: "Business name",
    example: "Bengkel Jaya Motor",
  })
  name: string;

  @ApiPropertyOptional({
    description: "Business tagline",
    example: "Service terpercaya sejak 2010",
  })
  tagline?: string | null;

  @ApiProperty({
    description: "Business status",
    enum: ["pending", "active", "banned"],
    example: "active",
  })
  status: string;

  // ... other fields
}

export class BusinessHoursResponseDto {
  @ApiProperty({
    description: "Business hour unique identifier",
    example: "hour-uuid-456",
  })
  id: string;

  @ApiProperty({
    description: "Day of week (0=Sunday, 6=Saturday)",
    example: 1,
    minimum: 0,
    maximum: 6,
  })
  day_of_week: number;

  @ApiProperty({
    description: "Opening time",
    example: "08:00",
    pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$",
  })
  open_time: string;

  @ApiProperty({
    description: "Closing time",
    example: "17:00",
    pattern: "^([01]?[0-9]|2[0-3]):[0-5][0-9]$",
  })
  close_time: string;

  // ... other fields
}

export class GetBusinessesResponseDto {
  @ApiProperty({
    description: "Business details",
    type: BusinessResponseDto,
  })
  business: BusinessResponseDto;

  @ApiProperty({
    description: "Business operating hours",
    type: [BusinessHoursResponseDto],
    isArray: true,
  })
  business_hours: BusinessHoursResponseDto[];
}
```

---

### 5. i18n (Internationalization)

**File**: `root_src/src/i18n/en/businesses.json`

```json
{
  "title": "Businesses",
  "created": "Business created successfully",
  "listed": "Businesses retrieved successfully",
  "found": "Business found",
  "notFound": "Business not found",
  "validation": {
    // ... existing validations
  },
  "errors": {
    "ownerRequired": "Owner identity is required. Please provide a valid JWT.",
    "notFound": "Business not found",
    "unauthorized": "You are not authorized to access these businesses"
  }
}
```

**File**: `root_src/src/i18n/id/businesses.json`

```json
{
  "title": "Bisnis",
  "created": "Bisnis berhasil dibuat",
  "listed": "Bisnis berhasil diambil",
  "found": "Bisnis ditemukan",
  "notFound": "Bisnis tidak ditemukan",
  "validation": {
    // ... existing validations
  },
  "errors": {
    "ownerRequired": "Identitas pemilik diperlukan. Harap berikan JWT yang valid.",
    "notFound": "Bisnis tidak ditemukan",
    "unauthorized": "Anda tidak berhak mengakses bisnis ini"
  }
}
```

---

## 🧪 Testing Strategy

### Unit Test Structure

**File**: `root_src/src/domains/businesses/__tests__/business.service.findAllByOwner.spec.ts`

#### Test Categories

1. **Positive Test Cases (30+)**
   - ✅ Returns empty array when user has no businesses
   - ✅ Returns single business with no hours
   - ✅ Returns single business with one hour
   - ✅ Returns single business with multiple hours (all days)
   - ✅ Returns multiple businesses (each with hours)
   - ✅ Returns multiple businesses (some with hours, some without)
   - ✅ Correctly orders businesses by created_at DESC
   - ✅ Correctly orders hours by day_of_week ASC
   - ✅ Returns businesses with all status types (pending, active, banned)
   - ✅ Returns businesses with complete data (all fields populated)
   - ✅ Returns businesses with minimal data (only required fields)
   - ✅ Returns businesses with image and cover_image
   - ✅ Returns businesses with latitude and longitude
   - ✅ Returns businesses with phone and address
   - ✅ Returns businesses created by same user
   - ✅ Returns businesses updated by same user
   - ✅ Returns hours with all time ranges (00:00 - 23:59)
   - ✅ Returns hours for different day_of_week values (0-6)
   - ✅ Returns correct hour timestamps (created_at, updated_at)
   - ✅ Handles UUID format for all ID fields
   - ✅ Handles different owner_id values
   - ✅ Handles different public_id to owner_id mappings
   - ✅ Returns consistent data structure across requests
   - ✅ Handles large number of businesses (100+)
   - ✅ Handles large number of hours per business (7 days)
   - ✅ Returns businesses created at different times
   - ✅ Returns businesses with special characters in name
   - ✅ Returns businesses with long taglines
   - ✅ Returns businesses with international phone numbers
   - ✅ Returns businesses with various address formats
   - ✅ Handles concurrent requests for same owner

2. **Negative Test Cases (30+)**
   - ❌ Throws error when sub is null
   - ❌ Throws error when sub is undefined
   - ❌ Throws error when sub is empty string
   - ❌ Throws error when sub contains only whitespace
   - ❌ Throws error when sub is invalid UUID format
   - ❌ Throws error when public_id not found in core.users
   - ❌ Throws error when user is soft-deleted
   - ❌ Returns empty array when owner_id not found
   - ❌ Excludes soft-deleted businesses (deleted_at not null)
   - ❌ Excludes soft-deleted hours (deleted_at not null)
   - ❌ Does not return businesses owned by other users
   - ❌ Throws error when database connection fails
   - ❌ Throws error when query execution fails
   - ❌ Throws error when transaction fails
   - ❌ Handles null values in optional fields gracefully
   - ❌ Handles missing business_hours table gracefully
   - ❌ Handles missing businesses table gracefully
   - ❌ Handles corrupt data in database
   - ❌ Handles invalid day_of_week values (<0 or >6)
   - ❌ Handles invalid time format in hours
   - ❌ Handles timezone issues in timestamps
   - ❌ Throws error when repository method fails
   - ❌ Throws error when LEFT JOIN fails
   - ❌ Handles database timeout
   - ❌ Handles connection pool exhaustion
   - ❌ Handles invalid owner_id format
   - ❌ Handles SQL injection attempts
   - ❌ Handles very long string inputs
   - ❌ Handles special SQL characters in fields
   - ❌ Handles NULL vs empty string differences
   - ❌ Returns error with appropriate i18n message (en/id)

3. **Edge Cases**
   - 🔍 Business with exactly 7 hours (all days)
   - 🔍 Business with 0 hours
   - 🔍 Owner with 100+ businesses
   - 🔍 Business created and updated in same second
   - 🔍 Hours with open_time = 00:00 and close_time = 23:59
   - 🔍 Business with null tagline vs empty tagline
   - 🔍 Business with null image vs no image field
   - 🔍 Coordinates at boundary values (lat: -90/90, lon: -180/180)
   - 🔍 Phone numbers with + prefix and country code
   - 🔍 Addresses with newlines and special characters
   - 🔍 UUID collision handling (theoretical)
   - 🔍 Business status transitions (pending → active → banned)
   - 🔍 Multiple businesses created in quick succession
   - 🔍 Query performance with 1000+ businesses
   - 🔍 Memory usage with large result sets
   - 🔍 Response time under load
   - 🔍 Concurrent requests from multiple users
   - 🔍 Race conditions in data fetching
   - 🔍 Cache invalidation scenarios
   - 🔍 Data consistency after failures

---

## 🔐 Security Considerations

### Authentication Flow

```
1. Client sends request with JWT in Authorization header
2. JwtAuthGuard intercepts request
3. Guard extracts token from "Bearer <token>"
4. Guard verifies JWT signature using public key
5. Guard checks expiration (exp claim)
6. Guard decodes payload to get user.sub (public_id)
7. Guard attaches req.user = { sub, email, ... }
8. Controller accesses req.user.sub
9. Service resolves owner_id from public_id
10. Repository filters businesses by owner_id
```

### Preventing Unauthorized Access

- ✅ **JWT Required**: All requests must have valid Bearer token
- ✅ **Owner Verification**: Resolve internal `owner_id` from JWT `sub` (public_id)
- ✅ **No Parameter Injection**: `owner_id` never comes from request body/query
- ✅ **Soft Delete Filtering**: Exclude `deleted_at IS NOT NULL` records
- ✅ **Schema Isolation**: Use `business` schema prefix in queries
- ✅ **SQL Injection Protection**: Use parameterized queries via Knex
- ✅ **Authorization**: User can only see their own businesses

### Potential Attack Vectors (Mitigated)

| Attack                | Mitigation                                           |
| --------------------- | ---------------------------------------------------- |
| JWT Spoofing          | RS256 signature verification with public key         |
| Token Replay          | Expiration check (exp claim)                         |
| SQL Injection         | Parameterized queries via Knex ORM                   |
| Owner ID Tampering    | Resolve from JWT, not from request params            |
| Soft Delete Bypass    | Explicit `deleted_at IS NULL` filter                 |
| Cross-User Access     | Filter by authenticated owner_id only                |
| Missing Authorization | JwtAuthGuard applied to controller                   |
| Timing Attacks        | Consistent response times (empty array vs no access) |

---

## 📊 Performance Considerations

### Query Optimization

1. **Indexes**
   - ✅ `businesses_owner_id_index` (already exists)
   - ✅ `businesses_status_index` (already exists)
   - ✅ `business_hours_business_id_index` (already exists)

2. **Query Strategy**
   - Use LEFT JOIN to fetch businesses and hours in single query
   - Order by `created_at DESC` utilizes index
   - Filter by `owner_id` utilizes index
   - Soft delete filter on indexed `deleted_at` columns

3. **Expected Performance**
   - Single query execution (1 database round-trip)
   - O(n) data transformation (n = total rows)
   - Efficient for typical user (1-10 businesses)
   - Acceptable for power users (100+ businesses)

### Scalability

- **Small Result Sets** (1-10 businesses): < 50ms
- **Medium Result Sets** (10-100 businesses): < 200ms
- **Large Result Sets** (100-1000 businesses): < 1s

### Caching Strategy (Future Enhancement)

- Cache key: `businesses:owner:{owner_id}`
- TTL: 5 minutes
- Invalidate on: Create, Update, Delete business
- Reduce database load for repeated requests

---

## 🛠️ SOLID Principles Application

### Single Responsibility Principle (SRP)

- **Controller**: HTTP request/response handling only
- **Service**: Business logic orchestration
- **Repository**: Data access and persistence
- **Model**: Domain entity representation (not implemented yet, can add BusinessModel if needed)

### Open/Closed Principle (OCP)

- Extend BusinessService without modifying existing methods
- Add new filters/sorting via optional parameters
- Use decorators for cross-cutting concerns (@ResponseMessage)

### Liskov Substitution Principle (LSP)

- BusinessRepository follows repository contract
- Can be mocked/replaced in tests
- Interface-based dependencies

### Interface Segregation Principle (ISP)

- IBusiness and IBusinessHours are focused interfaces
- No client forced to depend on unused methods
- Lean DTOs with only necessary fields

### Dependency Inversion Principle (DIP)

- Service depends on Repository abstraction, not implementation
- Controller depends on Service abstraction
- Easy to mock dependencies in tests

---

## 🔄 Comparison with Products Domain

| Aspect         | Products Domain        | Businesses Domain        |
| -------------- | ---------------------- | ------------------------ |
| **Endpoint**   | `GET /v1/products`     | `GET /v1/business`       |
| **Auth**       | Required (JWT)         | Required (JWT)           |
| **Filter**     | Category, price, stock | Owner only               |
| **Join**       | LEFT JOIN files        | LEFT JOIN business_hours |
| **Pagination** | Yes (page, limit)      | No (return all)          |
| **Ordering**   | Configurable           | created_at DESC          |
| **Response**   | ProductDto[]           | BusinessWithHours[]      |
| **i18n**       | products.listed        | businesses.listed        |
| **Tests**      | 60+ test cases         | 60+ test cases           |

---

## 📝 Implementation Checklist

### Phase 1: Repository Layer

- [ ] Add `findAllByOwnerId()` method to `BusinessRepository`
- [ ] Implement LEFT JOIN query with proper aliasing
- [ ] Implement data transformation logic (group by business.id)
- [ ] Handle empty results and null hours
- [ ] Add JSDoc comments

### Phase 2: Service Layer

- [ ] Add `findAllByOwner()` method to `BusinessService`
- [ ] Implement `resolveOwnerIdFromSub()` call
- [ ] Handle errors and throw appropriate exceptions
- [ ] Add JSDoc comments

### Phase 3: Controller Layer

- [ ] Add `@Get()` endpoint to `BusinessController`
- [ ] Extract `req.user.sub` and `x-lang` header
- [ ] Call `businessService.findAllByOwner()`
- [ ] Apply `@ResponseMessage('businesses.listed')` decorator
- [ ] Add Swagger documentation

### Phase 4: i18n

- [ ] Add `"listed"` key to `en/businesses.json`
- [ ] Add `"listed"` key to `id/businesses.json`
- [ ] Update error messages if needed

### Phase 5: Testing

- [ ] Create `business.service.findAllByOwner.spec.ts`
- [ ] Implement 30+ positive test cases
- [ ] Implement 30+ negative test cases
- [ ] Implement edge case tests
- [ ] Achieve 80%+ code coverage
- [ ] Run tests and ensure all pass

### Phase 6: Code Quality

- [ ] Run Codacy analysis on all modified files
- [ ] Fix any linting issues
- [ ] Fix any security issues
- [ ] Fix any code smell issues
- [ ] Ensure all files pass quality checks

### Phase 7: Documentation

- [ ] Update API documentation
- [ ] Add usage examples
- [ ] Document error responses
- [ ] Update changelog

---

## 📖 Example API Request/Response

### Request

```http
GET /v1/business HTTP/1.1
Host: api.ebengkelku.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
x-lang: en
Content-Type: application/json
```

### Success Response (200 OK)

```json
{
  "statusCode": 200,
  "message": "Businesses retrieved successfully",
  "data": [
    {
      "business": {
        "id": "a70af782-1f60-4f00-b448-6cb59c46b1dd",
        "owner_id": "user-uuid-123",
        "name": "Bengkel Jaya Motor",
        "tagline": "Service terpercaya sejak 2010",
        "status": "active",
        "phone": "+6281234567890",
        "image": "uploads/images/2026/business-1.jpg",
        "cover_image": "uploads/images/2026/business-1-cover.jpg",
        "latitude": "-6.2088",
        "longitude": "106.8456",
        "address": "Jl. Sudirman No. 123, Jakarta Selatan",
        "created_at": "2026-01-15T08:30:00.000Z",
        "updated_at": "2026-01-20T10:15:00.000Z",
        "deleted_at": null,
        "id_creator": "public-uuid-456",
        "id_updater": "public-uuid-456"
      },
      "business_hours": [
        {
          "id": "hour-uuid-1",
          "business_id": "a70af782-1f60-4f00-b448-6cb59c46b1dd",
          "day_of_week": 1,
          "open_time": "08:00",
          "close_time": "17:00",
          "created_at": "2026-01-15T08:30:00.000Z",
          "updated_at": null,
          "deleted_at": null,
          "id_creator": "public-uuid-456",
          "id_updater": null
        },
        {
          "id": "hour-uuid-2",
          "business_id": "a70af782-1f60-4f00-b448-6cb59c46b1dd",
          "day_of_week": 2,
          "open_time": "08:00",
          "close_time": "17:00",
          "created_at": "2026-01-15T08:30:00.000Z",
          "updated_at": null,
          "deleted_at": null,
          "id_creator": "public-uuid-456",
          "id_updater": null
        }
      ]
    },
    {
      "business": {
        "id": "b80af782-2f60-5f00-c558-7db69c57b2ee",
        "owner_id": "user-uuid-123",
        "name": "Bengkel Sejahtera",
        "tagline": null,
        "status": "pending",
        "phone": null,
        "image": null,
        "cover_image": null,
        "latitude": null,
        "longitude": null,
        "address": null,
        "created_at": "2026-01-10T14:20:00.000Z",
        "updated_at": null,
        "deleted_at": null,
        "id_creator": "public-uuid-456",
        "id_updater": null
      },
      "business_hours": []
    }
  ]
}
```

### Empty Response (200 OK - No Businesses)

```json
{
  "statusCode": 200,
  "message": "Businesses retrieved successfully",
  "data": []
}
```

### Error Response (401 Unauthorized)

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Owner identity is required. Please provide a valid JWT."
}
```

---

## 🎓 Key Takeaways

1. **Security First**: Always resolve owner_id from JWT, never trust request params
2. **Consistent Patterns**: Follow existing domain structures (products as reference)
3. **LEFT JOIN Preferred**: Include all businesses even without hours
4. **Comprehensive Testing**: Cover positive, negative, and edge cases
5. **i18n Support**: Provide translations for all user-facing messages
6. **Performance**: Single query with LEFT JOIN for efficiency
7. **SOLID Principles**: Keep layers decoupled and focused
8. **Code Quality**: Run Codacy analysis and fix issues

---

## 📅 Next Steps

1. ✅ Review and approve this technical plan
2. ⏳ Implement repository layer
3. ⏳ Implement service layer
4. ⏳ Implement controller layer
5. ⏳ Add i18n translations
6. ⏳ Write comprehensive unit tests
7. ⏳ Run Codacy analysis
8. ⏳ Create pull request
9. ⏳ Code review
10. ⏳ Merge to development

---

**Document Version**: 1.0  
**Created**: February 6, 2026  
**Author**: GitHub Copilot  
**Status**: Pending Approval
