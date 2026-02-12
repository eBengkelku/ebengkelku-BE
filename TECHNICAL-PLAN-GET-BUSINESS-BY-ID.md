# Technical Plan: GET /v1/businesses/:business_id

## 1. Overview

Create an endpoint `GET /v1/businesses/:business_id` that retrieves a specific business owned by the authenticated user. The owner may have multiple businesses, so this endpoint returns one specific business by ID along with its business hours.

**Authentication**: Bearer JWT token (mandatory)
**Authorization**: Only the business owner (business.owner_id matches the authenticated user) can access the business data.

---

## 2. Data Flow Diagram

```
┌──────────┐     GET /v1/businesses/:business_id      ┌────────────────┐
│  Client   │ ──────────────────────────────────────▶  │  Middleware     │
│           │    Headers:                               │                │
│           │    - Authorization: Bearer <JWT>           │  1. LoggerMW   │
│           │    - x-lang: en|id                        │  2. TimingMW   │
└──────────┘                                           │  3. AuthMW     │
                                                       └───────┬────────┘
                                                               │
                                                               ▼
                                                       ┌────────────────┐
                                                       │  JwtAuthGuard  │
                                                       │                │
                                                       │  Verify JWT    │
                                                       │  Attach user   │
                                                       │  to req.user   │
                                                       └───────┬────────┘
                                                               │
                                                               ▼
                                                       ┌────────────────┐
                                                       │  Controller    │
                                                       │  findOne()     │
                                                       │                │
                                                       │  Extract:      │
                                                       │  - business_id │
                                                       │  - req.user.sub│
                                                       │  - x-lang      │
                                                       └───────┬────────┘
                                                               │
                                                               ▼
                                                       ┌────────────────┐
                                                       │  Service       │
                                                       │  findOneById() │
                                                       │                │
                                                       │  1. Validate   │
                                                       │     sub        │
                                                       │  2. Resolve    │
                                                       │     owner_id   │
                                                       │  3. Fetch biz  │
                                                       │  4. Authorize  │
                                                       │  5. Return     │
                                                       └───────┬────────┘
                                                               │
                                                               ▼
                                                       ┌────────────────┐
                                                       │  Repository    │
                                                       │                │
                                                       │  findBusiness  │
                                                       │  WithHoursById │
                                                       │  (LEFT JOIN)   │
                                                       └───────┬────────┘
                                                               │
                                                               ▼
                                                       ┌────────────────┐
                                                       │  PostgreSQL    │
                                                       │                │
                                                       │  business.     │
                                                       │  businesses    │
                                                       │  LEFT JOIN     │
                                                       │  business.     │
                                                       │  business_hours│
                                                       └───────┬────────┘
                                                               │
                                                               ▼
                                                       ┌────────────────┐
                                                       │  Response      │
                                                       │  Transform     │
                                                       │  Interceptor   │
                                                       │                │
                                                       │  { success,    │
                                                       │    data,       │
                                                       │    message }   │
                                                       └────────────────┘
```

---

## 3. Sequence Diagram

```
Client          Middleware       Guard       Controller      Service          Repository       Database
  │                │              │             │               │                │               │
  │ GET /v1/businesses/:id        │             │               │                │               │
  │ Authorization: Bearer <JWT>   │             │               │                │               │
  │──────────────▶│               │             │               │                │               │
  │                │ Log request  │             │               │                │               │
  │                │ Start timer  │             │               │                │               │
  │                │ Parse auth   │             │               │                │               │
  │                │──────────────▶             │               │                │               │
  │                │              │ Verify JWT  │               │                │               │
  │                │              │ Attach user │               │                │               │
  │                │              │─────────────▶               │                │               │
  │                │              │             │ findOne()     │                │               │
  │                │              │             │ Extract params│                │               │
  │                │              │             │───────────────▶                │               │
  │                │              │             │               │ Validate sub   │                │
  │                │              │             │               │────────────────▶               │
  │                │              │             │               │                │ SELECT id     │
  │                │              │             │               │                │ FROM core.users│
  │                │              │             │               │                │ WHERE          │
  │                │              │             │               │                │ public_id=sub  │
  │                │              │             │               │                │───────────────▶│
  │                │              │             │               │                │◀──────────────│
  │                │              │             │               │◀───────────────│ owner_id      │
  │                │              │             │               │                │               │
  │                │              │             │               │ findBusiness   │                │
  │                │              │             │               │ WithHoursById  │                │
  │                │              │             │               │────────────────▶               │
  │                │              │             │               │                │ SELECT * FROM │
  │                │              │             │               │                │ businesses    │
  │                │              │             │               │                │ LEFT JOIN     │
  │                │              │             │               │                │ business_hours│
  │                │              │             │               │                │───────────────▶│
  │                │              │             │               │                │◀──────────────│
  │                │              │             │               │◀───────────────│ {business,    │
  │                │              │             │               │                │  hours}       │
  │                │              │             │               │ Verify         │                │
  │                │              │             │               │ owner_id match │                │
  │                │              │             │◀──────────────│                │               │
  │                │              │             │ Return data   │                │               │
  │◀───────────────────────────────────────────│               │                │               │
  │ { success, data, message }    │             │               │                │               │
```

---

## 4. Function Signatures & Data Types

### 4.1 Controller: `BusinessController.findOne()`

```typescript
/**
 * GET /v1/businesses/:business_id
 *
 * @param {string} businessId - UUID from URL path parameter
 * @param {Request & { user?: { sub: string } }} req - Express request with JWT payload
 * @returns {Promise<{ business: IBusiness; business_hours: IBusinessHours[] }>}
 * @throws {UnauthorizedException} - Missing/invalid JWT
 * @throws {NotFoundException} - Business not found or soft-deleted
 * @throws {ForbiddenException} - User is not the owner of the business
 */
@Get(':business_id')
@HttpCode(HttpStatus.OK)
@ResponseMessage('businesses.found')
async findOne(
  @Param('business_id') businessId: string,
  @Req() req: Request & { user?: { sub: string } },
): Promise<{ business: IBusiness; business_hours: IBusinessHours[] }>
```

### 4.2 Service: `BusinessService.findOneById()`

```typescript
/**
 * Find a specific business by ID, verifying that the authenticated user
 * is the owner of the business.
 *
 * @param {string} businessId - UUID of the business to retrieve
 * @param {string} sub - JWT sub claim (public_id from core.users)
 * @param {string} [lang='en'] - Language code for i18n
 * @returns {Promise<{ business: IBusiness; business_hours: IBusinessHours[] }>}
 * @throws {UnauthorizedException} - Invalid sub / user not found
 * @throws {NotFoundException} - Business not found or soft-deleted
 * @throws {ForbiddenException} - User is not the owner of the business
 */
async findOneById(
  businessId: string,
  sub: string,
  lang?: string,
): Promise<{ business: IBusiness; business_hours: IBusinessHours[] }>
```

### 4.3 Repository: `BusinessRepository.findBusinessWithHoursById()` (existing)

```typescript
/**
 * Find business by id with business_hours using LEFT JOIN (single query).
 * Returns null if not found or soft-deleted.
 *
 * @param {string} id - UUID of the business
 * @returns {Promise<{ business: IBusiness; business_hours: IBusinessHours[] } | null>}
 */
async findBusinessWithHoursById(id: string): Promise<{
  business: IBusiness;
  business_hours: IBusinessHours[];
} | null>
```

### 4.4 Data Types

```typescript
// IBusiness (existing)
interface IBusiness {
  id: string;
  owner_id: string;
  name: string;
  tagline?: string | null;
  status: string;              // 'pending' | 'active' | 'banned'
  phone?: string | null;
  image?: string | null;
  cover_image?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  address?: string | null;
  created_at: Date;
  updated_at?: Date | null;
  deleted_at?: Date | null;
  id_creator?: string | null;
  id_updater?: string | null;
}

// IBusinessHours (existing)
interface IBusinessHours {
  id: string;
  business_id: string;
  day_of_week: number;         // 0-6 (Sunday-Saturday)
  open_time: string;           // HH:MM format
  close_time: string;          // HH:MM format
  created_at?: Date | null;
  updated_at?: Date | null;
  deleted_at?: Date | null;
  id_creator?: string | null;
  id_updater?: string | null;
}
```

---

## 5. Step-by-Step Logic

### Step 1: Request arrives at Controller
1. JwtAuthGuard validates Bearer token, attaches `req.user = { sub: <public_id> }`
2. Controller handler `findOne()` is invoked
3. Extract `business_id` from `@Param('business_id')`
4. Extract `sub` from `req.user.sub`
5. Extract `lang` from `req.headers['x-lang']` (default: `'en'`)
6. If `!sub`, throw `UnauthorizedException` with i18n message `businesses.errors.ownerRequired`
7. Validate `business_id` is a valid UUID format (non-empty string)
8. If `business_id` is empty/invalid, throw `BadRequestException` with i18n message `businesses.errors.invalidBusinessId`
9. Call `businessService.findOneById(businessId, sub, lang)`
10. Return `{ business, business_hours }`

### Step 2: Service validates and fetches
1. Validate `sub` is non-empty (trim whitespace check)
2. If empty, throw `UnauthorizedException` with i18n `businesses.errors.ownerRequired`
3. Call `resolveOwnerIdFromSub(sub)` to convert JWT `sub` (public_id) to internal `owner_id`
   - Repository looks up `core.users` WHERE `public_id = sub` AND `deleted_at IS NULL`
   - If not found, throw `UnauthorizedException`
4. Validate `businessId` is non-empty
5. If empty, throw `BadRequestException` with i18n `businesses.errors.invalidBusinessId`
6. Call `repository.findBusinessWithHoursById(businessId)`
7. If result is `null`, throw `NotFoundException` with i18n `businesses.errors.notFound`
8. Compare `result.business.owner_id` with `ownerId` (resolved internal ID)
9. If mismatch, throw `ForbiddenException` with i18n `businesses.errors.accessDenied`
10. Return `{ business, business_hours }`

### Step 3: Repository queries database (existing)
1. Query `business.businesses` LEFT JOIN `business.business_hours`
2. Filter: `businesses.id = :businessId` AND `businesses.deleted_at IS NULL`
3. LEFT JOIN condition: `business_hours.business_id = businesses.id` AND `business_hours.deleted_at IS NULL`
4. Order: `business_hours.day_of_week ASC`
5. Map joined rows → single `IBusiness` + array of `IBusinessHours[]`
6. Return `{ business, business_hours }` or `null`

### Step 4: Response transformation
1. `ResponseTransformInterceptor` wraps the result
2. Uses `@ResponseMessage('businesses.found')` i18n key
3. Returns standardized response:
```json
{
  "success": true,
  "data": {
    "business": { ... },
    "business_hours": [ ... ]
  },
  "message": "Business retrieved successfully"
}
```

---

## 6. Error Flow Diagram

```
                    ┌─────────────────────────┐
                    │  GET /v1/businesses/:id  │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │  Is JWT token present?   │
                    └───────────┬─────────────┘
                           No   │   Yes
                    ┌───────────┘   │
                    ▼               ▼
              401 Unauthorized  ┌───────────────────┐
                                │  Is sub non-empty? │
                                └───────┬───────────┘
                                   No   │   Yes
                                ┌───────┘   │
                                ▼           ▼
                          401 Unauth   ┌────────────────────┐
                                       │  Is business_id    │
                                       │  valid (non-empty)? │
                                       └───────┬────────────┘
                                          No    │   Yes
                                       ┌────────┘   │
                                       ▼            ▼
                                 400 Bad Req  ┌─────────────────┐
                                              │  Resolve sub →   │
                                              │  owner_id        │
                                              └───────┬─────────┘
                                                 Fail │   Success
                                              ┌───────┘   │
                                              ▼           ▼
                                        401 Unauth  ┌──────────────────┐
                                                     │  Find business   │
                                                     │  by ID           │
                                                     └───────┬──────────┘
                                                        Null │   Found
                                                     ┌───────┘   │
                                                     ▼           ▼
                                               404 Not Found ┌──────────────────┐
                                                             │  owner_id match?  │
                                                             └───────┬──────────┘
                                                                No   │   Yes
                                                             ┌───────┘   │
                                                             ▼           ▼
                                                       403 Forbidden  200 OK
                                                                      { business,
                                                                        business_hours }
```

---

## 7. Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `business.controller.ts` | MODIFY | Add `findOne()` handler with `@Get(':business_id')` |
| `business.service.ts` | MODIFY | Add `findOneById()` method with auth check |
| `business-error-codes.ts` | MODIFY | Add `ACCESS_DENIED`, `INVALID_BUSINESS_ID` |
| `i18n/en/businesses.json` | MODIFY | Add `found`, `errors.accessDenied`, `errors.invalidBusinessId` |
| `i18n/id/businesses.json` | MODIFY | Add Indonesian translations |
| `__tests__/business.service.spec.ts` | MODIFY | Add 30+ positive, 30+ negative, edge case tests |
| `__tests__/business.controller.spec.ts` | MODIFY | Add controller tests for findOne |

---

## 8. SQL Query (Repository - existing, reused)

```sql
SELECT
  businesses.id, businesses.owner_id, businesses.name,
  businesses.tagline, businesses.status, businesses.phone,
  businesses.image, businesses.cover_image,
  businesses.latitude, businesses.longitude, businesses.address,
  businesses.created_at, businesses.updated_at, businesses.deleted_at,
  businesses.id_creator, businesses.id_updater,
  business_hours.id AS hour_id,
  business_hours.business_id AS hour_business_id,
  business_hours.day_of_week AS hour_day_of_week,
  business_hours.open_time AS hour_open_time,
  business_hours.close_time AS hour_close_time,
  business_hours.created_at AS hour_created_at,
  business_hours.updated_at AS hour_updated_at,
  business_hours.deleted_at AS hour_deleted_at,
  business_hours.id_creator AS hour_id_creator,
  business_hours.id_updater AS hour_id_updater
FROM business.businesses
LEFT JOIN business.business_hours
  ON businesses.id = business_hours.business_id
  AND business_hours.deleted_at IS NULL
WHERE businesses.id = :business_id
  AND businesses.deleted_at IS NULL
ORDER BY business_hours.day_of_week ASC;
```

---

## 9. Interrelationship Analysis & Break Change Risk

| Area | Risk | Mitigation |
|------|------|------------|
| Existing `findById()` service method | Low - We add new method, don't modify existing | New method `findOneById()` is separate |
| Repository `findBusinessWithHoursById()` | None - Reused as-is | No changes needed |
| Controller route collision | Low - `@Get(':business_id')` could match `@Get()` | NestJS handles specificity; param route comes after exact match |
| `BusinessesModule` exports | None - `BusinessService` already exported | Other modules can use the new method |
| i18n keys | None - Adding new keys only | Existing keys untouched |
| Test suite | None - Adding new describe blocks | Existing tests untouched |

---

## 10. SOLID / DRY / KISS / YAGNI Compliance

- **S** (Single Responsibility): Controller handles HTTP, Service handles business logic, Repository handles data access
- **O** (Open/Closed): Adding new method without modifying existing ones
- **L** (Liskov): Interfaces remain consistent (IBusiness, IBusinessHours)
- **I** (Interface Segregation): Return type is focused - only business + hours
- **D** (Dependency Inversion): Service depends on repository abstraction
- **DRY**: Reuses existing `resolveOwnerIdFromSub()` and `findBusinessWithHoursById()`
- **KISS**: Simple authorization check (owner_id comparison)
- **YAGNI**: No pagination/filtering needed for single entity retrieval
