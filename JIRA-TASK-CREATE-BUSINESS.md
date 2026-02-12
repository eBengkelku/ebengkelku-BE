# JIRA Task: Create Business (Workshop) API Endpoint

## Task Name

Implement Create Business (Workshop) Endpoint with Business Hours

---

## User Story

**As a** registered workshop owner in eBengkelku  
**I want to** register my workshop/business with operating hours  
**So that** customers can discover my workshop and know when it's open

---

## Description

Create a new API endpoint at `POST /v1/businesses` that allows authenticated workshop owners to create a new business (bengkel) with its operating hours. The endpoint should support file uploads for business image and cover image, validate all inputs, create entries in both `business.businesses` and `business.business_hours` tables, and return the complete business data including the operating hours.

This endpoint requires JWT authentication via Bearer token, and the `owner_id` will be automatically populated from the authenticated user's token.

---

## Acceptance Criteria

### Functional Requirements

1. The endpoint must accept POST requests at `/v1/businesses`
2. The endpoint must require JWT Bearer token authentication
3. The endpoint must extract `owner_id` from the authenticated user's JWT token
4. The endpoint must accept multipart/form-data for file uploads (image and cover_image)
5. The endpoint must create a business record in `business.businesses` table
6. The endpoint must create business hours records in `business.business_hours` table for each day provided
7. The endpoint must return HTTP 201 status code on successful creation
8. The endpoint must return the complete business object including business hours in the response
9. The endpoint must support `x-lang` header for internationalization
10. The endpoint must set `status` to `pending` by default
11. The endpoint must set `created_at` and `id_creator` timestamps automatically
12. One owner can create multiple businesses

### Business Hours Requirements

1. Each business hour entry must have `day_of_week` (0-6, where 0=Sunday, 6=Saturday)
2. Each business hour entry must validate that `close_time > open_time`
3. Business hours are optional - a business can be created without hours initially
4. If business hours are provided, they must be validated properly
5. Duplicate `day_of_week` entries for the same business should be rejected

### Technical Requirements

1. Use the existing domain model pattern for implementation
2. Follow the standardized response format as per project documentation
3. Implement proper error handling with domain error codes
4. Use transaction for business creation and business hours to maintain data integrity
5. Implement proper validation using DTOs (Data Transfer Objects)
6. Use existing i18n pattern for error messages (English and Indonesian)
7. Follow the products domain structure as reference pattern
8. Use the existing FilesModule for image uploads
9. Ensure left join is used when fetching data with relations

### Security Requirements

1. JWT Bearer token authentication is required
2. Only authenticated users can create businesses
3. The `owner_id` must match the authenticated user's ID
4. Input validation must prevent SQL injection and XSS attacks
5. File uploads must be validated for type and size

---

## Database Tables

### business.businesses

| Column      | Type          | Constraints                                       | Description                      |
| ----------- | ------------- | ------------------------------------------------- | -------------------------------- |
| id          | UUID          | PK, auto-generated                                | Unique identifier                |
| owner_id    | UUID          | FK to core.users(id), NOT NULL, ON DELETE CASCADE | Owner of the business            |
| name        | VARCHAR(255)  | NOT NULL                                          | Business name                    |
| tagline     | VARCHAR(500)  | NULL                                              | Business tagline/slogan          |
| status      | TEXT          | DEFAULT 'pending', CHECK (pending/active/banned)  | Business status                  |
| phone       | VARCHAR(50)   | NULL                                              | Business phone number            |
| image       | VARCHAR(500)  | NULL                                              | Business logo/image URL          |
| cover_image | VARCHAR(500)  | NULL                                              | Business cover image URL         |
| latitude    | DECIMAL(11,8) | NULL                                              | Location latitude (-90 to 90)    |
| longitude   | DECIMAL(11,8) | NULL                                              | Location longitude (-180 to 180) |
| address     | TEXT          | NULL                                              | Business address                 |
| created_at  | TIMESTAMPTZ   | DEFAULT CURRENT_TIMESTAMP                         | Creation timestamp               |
| updated_at  | TIMESTAMPTZ   | NULL                                              | Update timestamp                 |
| deleted_at  | TIMESTAMPTZ   | NULL                                              | Soft delete timestamp            |
| id_creator  | UUID          | FK to core.users(public_id)                       | User who created the record      |
| id_updater  | UUID          | FK to core.users(public_id)                       | User who last updated            |

### business.business_hours

| Column      | Type        | Constraints                                                | Description                        |
| ----------- | ----------- | ---------------------------------------------------------- | ---------------------------------- |
| id          | UUID        | PK, auto-generated                                         | Unique identifier                  |
| business_id | UUID        | FK to business.businesses(id), NOT NULL, ON DELETE CASCADE | Parent business                    |
| day_of_week | INT         | NOT NULL (0-6)                                             | Day of week (0=Sunday, 6=Saturday) |
| open_time   | TIME        | NULL                                                       | Opening time                       |
| close_time  | TIME        | NULL                                                       | Closing time                       |
| updated_at  | TIMESTAMPTZ | NULL                                                       | Update timestamp                   |
| deleted_at  | TIMESTAMPTZ | NULL                                                       | Soft delete timestamp              |
| id_creator  | UUID        | FK to core.users(public_id)                                | User who created the record        |
| id_updater  | UUID        | FK to core.users(public_id)                                | User who last updated              |

---

## Expected Request

### Headers

| Header        | Required | Description                              |
| ------------- | -------- | ---------------------------------------- |
| Authorization | Yes      | Bearer {JWT_TOKEN}                       |
| Content-Type  | Yes      | multipart/form-data                      |
| x-lang        | No       | Language preference (en/id), default: en |

### Request Body (multipart/form-data)

#### Business Fields

| Field       | Type   | Required | Validation    | Description           |
| ----------- | ------ | -------- | ------------- | --------------------- |
| name        | string | Yes      | 1-255 chars   | Business name         |
| tagline     | string | No       | max 500 chars | Business tagline      |
| phone       | string | No       | 1-50 chars    | Business phone number |
| address     | string | No       | text          | Business address      |
| latitude    | number | No       | -90 to 90     | Location latitude     |
| longitude   | number | No       | -180 to 180   | Location longitude    |
| image       | file   | No       | image/\*      | Business logo/image   |
| cover_image | file   | No       | image/\*      | Business cover image  |

#### Business Hours Fields (Array)

| Field                        | Type   | Required                | Validation                        | Description  |
| ---------------------------- | ------ | ----------------------- | --------------------------------- | ------------ |
| business_hours[].day_of_week | number | Yes (if hours provided) | 0-6                               | Day of week  |
| business_hours[].open_time   | string | Yes (if hours provided) | HH:MM format                      | Opening time |
| business_hours[].close_time  | string | Yes (if hours provided) | HH:MM format, must be > open_time | Closing time |

### Request Example

```
POST /v1/businesses
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
x-lang: en

name=Bengkel Jaya Motor
tagline=Service Cepat dan Berkualitas
phone=+6281234567890
address=Jl. Sudirman No. 123, Jakarta
latitude=-6.2088
longitude=106.8456
image=[FILE]
cover_image=[FILE]
business_hours[0][day_of_week]=1
business_hours[0][open_time]=09:00
business_hours[0][close_time]=18:00
business_hours[1][day_of_week]=2
business_hours[1][open_time]=09:00
business_hours[1][close_time]=18:00
...
```

---

## Expected Response

### Success Response (HTTP 201)

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Business created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "owner_id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Bengkel Jaya Motor",
    "tagline": "Service Cepat dan Berkualitas",
    "status": "pending",
    "phone": "+6281234567890",
    "image": "/uploads/businesses/image-uuid.jpg",
    "cover_image": "/uploads/businesses/cover-uuid.jpg",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "address": "Jl. Sudirman No. 123, Jakarta",
    "created_at": "2026-02-02T10:30:00.000Z",
    "updated_at": null,
    "deleted_at": null,
    "id_creator": "770e8400-e29b-41d4-a716-446655440002",
    "id_updater": null,
    "business_hours": [
      {
        "id": "880e8400-e29b-41d4-a716-446655440003",
        "business_id": "550e8400-e29b-41d4-a716-446655440000",
        "day_of_week": 1,
        "open_time": "09:00:00",
        "close_time": "18:00:00"
      },
      {
        "id": "880e8400-e29b-41d4-a716-446655440004",
        "business_id": "550e8400-e29b-41d4-a716-446655440000",
        "day_of_week": 2,
        "open_time": "09:00:00",
        "close_time": "18:00:00"
      }
    ]
  }
}
```

### Error Response Example (HTTP 400)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Business name is required",
      "code": "BUSINESS_NAME_REQUIRED"
    }
  ]
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CREATE BUSINESS FLOW                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌──────────┐    ┌─────────────┐    ┌───────────────┐    ┌─────────────────┐
│  Client  │───▶│  JWT Guard  │───▶│  Controller   │───▶│    Service      │
└──────────┘    └─────────────┘    └───────────────┘    └─────────────────┘
     │                │                    │                     │
     │ POST           │ Validate           │ Transform           │
     │ /v1/businesses │ Bearer Token       │ DTO → Model         │
     │ + Bearer Token │                    │                     │
     │ + Form Data    │                    │                     │
     ▼                ▼                    ▼                     ▼
┌──────────┐    ┌─────────────┐    ┌───────────────┐    ┌─────────────────┐
│ Request  │    │ User from   │    │ CreateBusiness│    │ BusinessModel   │
│ Body     │    │ JWT Payload │    │ Dto           │    │ BusinessHours   │
│ (form)   │    │ (owner_id)  │    │               │    │ Model           │
└──────────┘    └─────────────┘    └───────────────┘    └─────────────────┘
                                                               │
                                                               ▼
                                   ┌───────────────────────────────────────┐
                                   │          TRANSACTION START            │
                                   └───────────────────────────────────────┘
                                                               │
                     ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
                     ▼                                         ▼                                         ▼
            ┌─────────────────┐                      ┌─────────────────┐                      ┌─────────────────┐
            │  FilesService   │                      │   Business      │                      │ BusinessHours   │
            │  (if images)    │                      │   Repository    │                      │ Repository      │
            └─────────────────┘                      └─────────────────┘                      └─────────────────┘
                     │                                         │                                         │
                     │ Upload                                  │ Insert                                  │ Bulk Insert
                     │ images                                  │ business                                │ hours
                     ▼                                         ▼                                         ▼
            ┌─────────────────┐                      ┌─────────────────┐                      ┌─────────────────┐
            │  files table    │                      │   business.     │                      │   business.     │
            │  (store refs)   │                      │   businesses    │                      │  business_hours │
            └─────────────────┘                      └─────────────────┘                      └─────────────────┘
                                                               │
                                                               ▼
                                   ┌───────────────────────────────────────┐
                                   │          TRANSACTION COMMIT           │
                                   └───────────────────────────────────────┘
                                                               │
                                                               ▼
                                   ┌───────────────────────────────────────┐
                                   │      Fetch created business with      │
                                   │      business hours (LEFT JOIN)       │
                                   └───────────────────────────────────────┘
                                                               │
                                                               ▼
                                   ┌───────────────────────────────────────┐
                                   │     Response with business data       │
                                   │     + business_hours array            │
                                   └───────────────────────────────────────┘
```

---

## Domain Structure

```
src/domains/businesses/
├── constants/
│   ├── index.ts
│   └── business-error-codes.ts
├── dto/
│   ├── index.ts
│   ├── create-business.dto.ts
│   └── business-hours.dto.ts
├── errors/
│   ├── index.ts
│   └── business-error-codes.ts
├── interfaces/
│   ├── index.ts
│   ├── business.interface.ts
│   └── business-hours.interface.ts
├── models/
│   ├── index.ts
│   ├── business.model.ts
│   └── business-hours.model.ts
├── repository/
│   ├── index.ts
│   ├── business.repository.ts
│   └── business-hours.repository.ts
├── __tests__/
│   ├── business.controller.spec.ts
│   ├── business.service.spec.ts
│   └── utils/
│       └── test-helpers.ts
├── __mocks__/
│   └── business.mock.ts
├── business.controller.ts
├── business.service.ts
└── businesses.module.ts
```

---

## Method Signatures

### Controller Layer

```typescript
// business.controller.ts
@Controller('v1/businesses')
@ApiTags('businesses')
@ApiBearerAuth('JWT-auth')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  /**
   * Create a new business with optional business hours
   * @param createDto - Business creation data
   * @param user - Authenticated user from JWT
   * @param files - Uploaded files (image, cover_image)
   * @returns Created business with business hours
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files'))
  @ResponseMessage('businesses.created')
  async create(
    @Body() createDto: CreateBusinessDto,
    @CurrentUser() user: JwtPayload,
    @UploadedFiles() files?: Express.Multer.File[]
  ): Promise<IBusinessWithHours>
}
```

### Service Layer

```typescript
// business.service.ts
@Injectable()
export class BusinessService {
  constructor(
    private readonly businessRepository: BusinessRepository,
    private readonly businessHoursRepository: BusinessHoursRepository,
    private readonly filesService: FilesService,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Create a new business with business hours in a transaction
   * @param dto - Business creation data
   * @param ownerId - Owner's user ID from JWT
   * @param creatorPublicId - Creator's public ID for audit
   * @param files - Optional uploaded files
   * @returns Created business with hours
   */
  async create(
    dto: CreateBusinessDto,
    ownerId: string,
    creatorPublicId: string,
    files?: Express.Multer.File[],
  ): Promise<IBusinessWithHours>;

  /**
   * Find business by ID with business hours
   * @param id - Business ID
   * @returns Business with hours or null
   */
  async findById(id: string): Promise<IBusinessWithHours | null>;

  /**
   * Upload business images
   * @param files - Files to upload
   * @returns Object with image paths
   */
  private async uploadImages(
    files?: Express.Multer.File[],
  ): Promise<{ image?: string; cover_image?: string }>;
}
```

### Repository Layer

```typescript
// business.repository.ts
@Injectable()
export class BusinessRepository extends BaseDomainRepository<
  BusinessModel,
  IBusiness
> {
  protected tableName = "business.businesses";

  /**
   * Find business by ID
   * @param id - Business UUID
   * @returns Business model or null
   */
  async findById(id: string): Promise<BusinessModel | null>;

  /**
   * Find business with hours using LEFT JOIN
   * @param id - Business UUID
   * @returns Business with hours data
   */
  async findByIdWithHours(id: string): Promise<IBusinessWithHours | null>;

  /**
   * Save business model (insert or update)
   * @param model - Business domain model
   * @param trx - Optional transaction
   */
  async save(model: BusinessModel, trx?: Knex.Transaction): Promise<void>;
}

// business-hours.repository.ts
@Injectable()
export class BusinessHoursRepository extends BaseDomainRepository<
  BusinessHoursModel,
  IBusinessHours
> {
  protected tableName = "business.business_hours";

  /**
   * Bulk insert business hours
   * @param hours - Array of business hours models
   * @param trx - Transaction instance
   */
  async bulkInsert(
    hours: BusinessHoursModel[],
    trx: Knex.Transaction,
  ): Promise<void>;

  /**
   * Find all hours for a business
   * @param businessId - Business UUID
   * @returns Array of business hours
   */
  async findByBusinessId(businessId: string): Promise<BusinessHoursModel[]>;
}
```

### Model Layer

```typescript
// business.model.ts
export class BusinessModel extends BaseDomainModel<IBusiness> {
  /**
   * Factory method for creating new business
   */
  static create(data: CreateBusinessData): BusinessModel;

  /**
   * Factory method for reconstituting from database
   */
  static reconstitute(data: IBusiness): BusinessModel;

  /**
   * Convert to database entity
   */
  toEntity(): IBusiness;

  // Getters
  getId(): string;
  getName(): string;
  getOwnerId(): string;
  getStatus(): BusinessStatus;
  // ... other getters
}

// business-hours.model.ts
export class BusinessHoursModel extends BaseDomainModel<IBusinessHours> {
  /**
   * Factory method for creating new business hours
   * Validates that close_time > open_time
   */
  static create(data: CreateBusinessHoursData): BusinessHoursModel;

  /**
   * Factory method for reconstituting from database
   */
  static reconstitute(data: IBusinessHours): BusinessHoursModel;

  /**
   * Convert to database entity
   */
  toEntity(): IBusinessHours;
}
```

### DTO Layer

```typescript
// create-business.dto.ts
export class CreateBusinessDto {
  @IsNotEmpty()
  @IsString()
  @Length(1, 255)
  name: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  tagline?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BusinessHoursDto)
  business_hours?: BusinessHoursDto[];
}

// business-hours.dto.ts
export class BusinessHoursDto {
  @IsNotEmpty()
  @IsInt()
  @Min(0)
  @Max(6)
  day_of_week: number;

  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  open_time: string;

  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  close_time: string;
}
```

---

## Unit Test Cases - Success Scenarios

### Basic Creation Tests

1. **Test successful business creation with required fields only**: Verify that a business can be created with only name, receiving HTTP 201 with complete data
2. **Test successful business creation with all fields**: Verify creation with name, tagline, phone, address, latitude, longitude
3. **Test successful business creation with business hours**: Verify business and hours are created together in transaction
4. **Test successful business creation with weekday hours only**: Verify creation with Monday-Friday hours
5. **Test successful business creation with weekend hours only**: Verify creation with Saturday-Sunday hours
6. **Test successful business creation with single day hours**: Verify creation with hours for just one day
7. **Test successful business creation with all 7 days hours**: Verify creation with complete weekly schedule
8. **Test owner_id is automatically set from JWT**: Verify owner_id matches authenticated user's ID
9. **Test status defaults to pending**: Verify new business has status='pending'
10. **Test created_at is automatically set**: Verify timestamp is set correctly
11. **Test id_creator is set from user public_id**: Verify audit field is populated

### File Upload Tests

12. **Test successful business creation with image upload**: Verify image is uploaded and path stored
13. **Test successful business creation with cover_image upload**: Verify cover image is uploaded
14. **Test successful business creation with both images**: Verify both images uploaded and stored
15. **Test business creation without images**: Verify business created with null image fields

### Validation Success Tests

16. **Test name with exactly 255 characters**: Verify max length is accepted
17. **Test tagline with exactly 500 characters**: Verify max length is accepted
18. **Test phone with exactly 50 characters**: Verify max length is accepted
19. **Test latitude at boundary -90**: Verify minimum latitude accepted
20. **Test latitude at boundary 90**: Verify maximum latitude accepted
21. **Test longitude at boundary -180**: Verify minimum longitude accepted
22. **Test longitude at boundary 180**: Verify maximum longitude accepted
23. **Test business hours with 00:00 open time**: Verify midnight opening accepted
24. **Test business hours with 23:59 close time**: Verify late closing accepted
25. **Test business hours open=09:00 close=09:01**: Verify minimum time difference

### Response Structure Tests

26. **Test response includes business_hours array**: Verify hours are included in response
27. **Test response includes all business fields**: Verify complete data returned
28. **Test response format matches specification**: Verify JSON structure
29. **Test i18n message in English (x-lang: en)**: Verify English success message
30. **Test i18n message in Indonesian (x-lang: id)**: Verify Indonesian success message

### Multiple Business Tests

31. **Test owner can create multiple businesses**: Verify same owner creates second business
32. **Test different owners can have same business name**: Verify name uniqueness is not enforced

---

## Unit Test Cases - Failure Scenarios

### Authentication Failures

1. **Test creation fails without Bearer token**: Verify HTTP 401 Unauthorized
2. **Test creation fails with invalid JWT token**: Verify HTTP 401 with invalid token error
3. **Test creation fails with expired JWT token**: Verify HTTP 401 with token expired error
4. **Test creation fails with malformed Authorization header**: Verify HTTP 401

### Required Field Validation

5. **Test creation fails when name is missing**: Verify HTTP 400 with name required error
6. **Test creation fails when name is empty string**: Verify HTTP 400 with name required error
7. **Test creation fails when name is only whitespace**: Verify HTTP 400 with validation error

### Field Length Validation

8. **Test creation fails when name exceeds 255 characters**: Verify HTTP 400 with length error
9. **Test creation fails when tagline exceeds 500 characters**: Verify HTTP 400 with length error
10. **Test creation fails when phone exceeds 50 characters**: Verify HTTP 400 with length error

### Coordinate Validation

11. **Test creation fails when latitude < -90**: Verify HTTP 400 with range error
12. **Test creation fails when latitude > 90**: Verify HTTP 400 with range error
13. **Test creation fails when longitude < -180**: Verify HTTP 400 with range error
14. **Test creation fails when longitude > 180**: Verify HTTP 400 with range error
15. **Test creation fails when latitude is not a number**: Verify HTTP 400 with type error
16. **Test creation fails when longitude is not a number**: Verify HTTP 400 with type error

### Business Hours Validation

17. **Test creation fails when day_of_week < 0**: Verify HTTP 400 with range error
18. **Test creation fails when day_of_week > 6**: Verify HTTP 400 with range error
19. **Test creation fails when day_of_week is not integer**: Verify HTTP 400 with type error
20. **Test creation fails when open_time format is invalid**: Verify HTTP 400 with format error
21. **Test creation fails when close_time format is invalid**: Verify HTTP 400 with format error
22. **Test creation fails when close_time <= open_time**: Verify HTTP 400 with validation error
23. **Test creation fails when open_time is missing but close_time provided**: Verify HTTP 400
24. **Test creation fails when close_time is missing but open_time provided**: Verify HTTP 400
25. **Test creation fails with duplicate day_of_week entries**: Verify HTTP 400 with duplicate error

### Data Type Validation

26. **Test creation fails when name is not a string**: Verify HTTP 400 with type error
27. **Test creation fails when business_hours is not an array**: Verify HTTP 400 with type error
28. **Test creation fails when phone is a number**: Verify HTTP 400 with type error

### File Upload Validation

29. **Test creation fails with invalid image file type**: Verify HTTP 400 with file type error
30. **Test creation fails with image file too large**: Verify HTTP 400 with file size error

### Transaction Rollback Tests

31. **Test business not created if business_hours insertion fails**: Verify transaction rollback
32. **Test files are cleaned up if business creation fails**: Verify no orphan files

---

## Unit Test Cases - Edge Cases

### Boundary Value Tests

1. **Test name with exactly 1 character**: Verify minimum length accepted
2. **Test phone with exactly 1 character**: Verify minimum length accepted
3. **Test business_hours with close_time = open_time + 1 minute**: Verify minimum duration
4. **Test latitude/longitude with high precision decimals**: Verify decimal handling

### Special Character Handling

5. **Test name with special characters (@#$%^&\*)**: Verify special chars accepted
6. **Test name with Unicode characters (中文, العربية)**: Verify Unicode support
7. **Test name with emoji (🔧🚗)**: Verify emoji handling
8. **Test address with multiline text**: Verify newlines handled
9. **Test tagline with HTML entities**: Verify HTML is escaped/handled

### Concurrent Operations

10. **Test concurrent business creation by same owner**: Verify both succeed
11. **Test concurrent creation with same image file**: Verify file handling

### Database Constraint Tests

12. **Test creation when owner_id references deleted user**: Verify error handling
13. **Test transaction integrity with partial business_hours failure**: Verify rollback

---

## i18n Translations Required

### English (en/businesses.json)

```json
{
  "title": "Businesses",
  "validation": {
    "name": {
      "required": "Business name is required",
      "string": "Business name must be a text value",
      "length": "Business name must be between 1 and 255 characters"
    },
    "tagline": {
      "string": "Tagline must be a text value",
      "length": "Tagline cannot exceed 500 characters"
    },
    "phone": {
      "string": "Phone must be a text value",
      "length": "Phone must be between 1 and 50 characters"
    },
    "address": {
      "string": "Address must be a text value"
    },
    "latitude": {
      "number": "Latitude must be a valid number",
      "range": "Latitude must be between -90 and 90"
    },
    "longitude": {
      "number": "Longitude must be a valid number",
      "range": "Longitude must be between -180 and 180"
    },
    "business_hours": {
      "array": "Business hours must be an array",
      "day_of_week": {
        "required": "Day of week is required",
        "integer": "Day of week must be an integer",
        "range": "Day of week must be between 0 (Sunday) and 6 (Saturday)"
      },
      "open_time": {
        "required": "Opening time is required",
        "format": "Opening time must be in HH:MM format"
      },
      "close_time": {
        "required": "Closing time is required",
        "format": "Closing time must be in HH:MM format",
        "after_open": "Closing time must be after opening time"
      },
      "duplicate_day": "Duplicate day of week is not allowed"
    }
  },
  "created": "Business created successfully",
  "updated": "Business updated successfully",
  "deleted": "Business deleted successfully",
  "listed": "Businesses retrieved successfully",
  "found": "Business found successfully",
  "errors": {
    "notFound": "Business not found",
    "notFoundDetail": "Business with ID {{id}} not found",
    "unauthorized": "You are not authorized to access this business",
    "creationFailed": "Failed to create business. Please try again"
  }
}
```

### Indonesian (id/businesses.json)

```json
{
  "title": "Bisnis",
  "validation": {
    "name": {
      "required": "Nama bisnis wajib diisi",
      "string": "Nama bisnis harus berupa teks",
      "length": "Nama bisnis harus antara 1 dan 255 karakter"
    },
    "tagline": {
      "string": "Tagline harus berupa teks",
      "length": "Tagline tidak boleh lebih dari 500 karakter"
    },
    "phone": {
      "string": "Telepon harus berupa teks",
      "length": "Telepon harus antara 1 dan 50 karakter"
    },
    "address": {
      "string": "Alamat harus berupa teks"
    },
    "latitude": {
      "number": "Latitude harus berupa angka yang valid",
      "range": "Latitude harus antara -90 dan 90"
    },
    "longitude": {
      "number": "Longitude harus berupa angka yang valid",
      "range": "Longitude harus antara -180 dan 180"
    },
    "business_hours": {
      "array": "Jam operasional harus berupa array",
      "day_of_week": {
        "required": "Hari wajib diisi",
        "integer": "Hari harus berupa bilangan bulat",
        "range": "Hari harus antara 0 (Minggu) dan 6 (Sabtu)"
      },
      "open_time": {
        "required": "Jam buka wajib diisi",
        "format": "Jam buka harus dalam format HH:MM"
      },
      "close_time": {
        "required": "Jam tutup wajib diisi",
        "format": "Jam tutup harus dalam format HH:MM",
        "after_open": "Jam tutup harus setelah jam buka"
      },
      "duplicate_day": "Hari yang sama tidak boleh diisi lebih dari sekali"
    }
  },
  "created": "Bisnis berhasil dibuat",
  "updated": "Bisnis berhasil diperbarui",
  "deleted": "Bisnis berhasil dihapus",
  "listed": "Daftar bisnis berhasil diambil",
  "found": "Bisnis ditemukan",
  "errors": {
    "notFound": "Bisnis tidak ditemukan",
    "notFoundDetail": "Bisnis dengan ID {{id}} tidak ditemukan",
    "unauthorized": "Anda tidak memiliki akses ke bisnis ini",
    "creationFailed": "Gagal membuat bisnis. Silakan coba lagi"
  }
}
```

---

## Technical Notes

### Implementation Guidelines

- Follow the existing products domain pattern as reference
- Use the standardized response format as per architecture documentation
- Implement validation following the validation-error-format-examples
- Use i18n pattern for error messages as documented
- Follow the request-response flow documentation
- Use LEFT JOIN when fetching business with hours

### Database Transactions

- Use database transactions for business and hours creation
- Rollback entire transaction if any step fails
- Clean up uploaded files if transaction fails
- Ensure proper error handling

### Validation Order

1. Validate JWT token (Guard)
2. Validate request body structure and required fields
3. Validate field formats and lengths
4. Validate coordinate ranges
5. Validate business hours (times, duplicates)
6. Process file uploads
7. Create business and hours in transaction

### Security Considerations

- Validate JWT token authenticity
- Sanitize all inputs
- Validate file types and sizes
- Use parameterized queries
- Log security-relevant events

---

## Definition of Done

- [ ] API endpoint implemented at POST /v1/businesses
- [ ] JWT authentication guard implemented
- [ ] All acceptance criteria met
- [ ] All success test cases (32+) passing
- [ ] All failure test cases (32+) passing
- [ ] All edge case tests (13+) passing
- [ ] API documentation updated in Swagger
- [ ] Code follows project coding standards and patterns
- [ ] Code reviewed and approved
- [ ] Transaction handling working correctly
- [ ] File upload working correctly
- [ ] Error messages properly internationalized (EN/ID)
- [ ] No security vulnerabilities identified
- [ ] Merged to development branch

---

## Dependencies

- Existing FilesModule for file uploads
- JWT authentication module
- Database migrations for business.businesses and business.business_hours tables
- core.users table with uuid primary key

---

## Assumptions

- JWT authentication is already implemented and working
- FilesModule is functional for image uploads
- Database migrations have been run
- Base domain classes (BaseDomainModel, BaseDomainRepository) are available
- i18n module is configured

---

## Out of Scope

- Business verification/approval workflow
- Email notification for business creation
- Business update endpoint
- Business delete endpoint
- Business listing endpoint
- Business search functionality
- Business hours update endpoint
- Image cropping/resizing

---

## Related Documentation

- docs/architecture-domain-model-pattern-documentation.md
- docs/architecture-standardized-response-format-implementation-documentation.md
- docs/architecture-request-response-flow-documentation.md
- docs/domain-i18n-pattern-guide.md
- docs/error-handling-domain-error-codes-guide.md
- docs/api-file-upload-examples.md

---

## Estimated Story Points

**13 Points** - High complexity feature requiring:

- New domain structure creation
- Transaction handling for multiple tables
- File upload integration
- Comprehensive validation
- 60+ unit tests with edge cases
- i18n support (EN/ID)

---

## Priority

**High** - Core functionality for workshop owners to register their businesses

---

## Labels

`backend`, `api`, `business`, `workshop`, `authenticated`, `file-upload`, `v1`

---

## Sprint

Sprint 5 - Business Registration Features

---

## Created Date

February 2, 2026
