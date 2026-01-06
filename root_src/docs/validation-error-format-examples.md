# Validation Error Format Examples

## Overview

This document provides examples of the standardized validation error format used in the application.

---

## Error Response Structure

### Success Response

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Product created successfully",
  "data": {
    "id": "128aa945-dfe0-4dfa-81ac-8afbc21636e3",
    "name": "iPhone 15",
    "price": "99.00"
  },
  "timestamp": "2025-10-10T08:39:47.915Z",
  "path": "/v1/products"
}
```

### Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "property": "role_name",
      "value": "A",
      "code": "VALIDATION_MIN_LENGTH",
      "message": "role_name must be longer than or equal to 3 characters",
      "context_message": "Nama peran 'A' terlalu pendek. Panjang minimal yang diperbolehkan adalah 3 karakter.",
      "context": {
        "minLength": 3,
        "currentLength": 1
      }
    }
  ],
  "timestamp": "2025-10-10T08:40:19.143Z",
  "path": "/v1/products"
}
```

---

## Error Detail Fields

| Field             | Type   | Required | Description                                             |
| ----------------- | ------ | -------- | ------------------------------------------------------- |
| `property`        | string | No       | The field name that failed validation                   |
| `value`           | any    | No       | The invalid value provided                              |
| `code`            | string | Yes      | Standardized error code (e.g., `VALIDATION_MIN_LENGTH`) |
| `message`         | string | Yes      | Original validation message (usually in English)        |
| `context_message` | string | No       | Translated, contextualized error message                |
| `context`         | object | No       | Additional validation context (min/max values, etc.)    |

---

## Validation Error Examples

### 1. Minimum Length Validation

**DTO:**

```typescript
@MinLength(3)
name: string;
```

**Error Response:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "property": "name",
      "value": "AB",
      "code": "VALIDATION_MIN_LENGTH",
      "message": "name must be longer than or equal to 3 characters",
      "context_message": "Nama harus memiliki minimal 3 karakter",
      "context": {
        "minLength": 3,
        "currentLength": 2
      }
    }
  ],
  "timestamp": "2025-10-10T10:00:00.000Z",
  "path": "/api/users"
}
```

### 2. Maximum Length Validation

**DTO:**

```typescript
@MaxLength(50)
description: string;
```

**Error Response:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "property": "description",
      "value": "This is a very long description that exceeds the maximum allowed length...",
      "code": "VALIDATION_MAX_LENGTH",
      "message": "description must be shorter than or equal to 50 characters",
      "context_message": "Deskripsi terlalu panjang. Maksimal 50 karakter diperbolehkan",
      "context": {
        "maxLength": 50,
        "currentLength": 75
      }
    }
  ],
  "timestamp": "2025-10-10T10:00:00.000Z",
  "path": "/api/products"
}
```

### 3. Minimum Value Validation

**DTO:**

```typescript
@Min(1)
price: number;
```

**Error Response:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "property": "price",
      "value": -10,
      "code": "VALIDATION_MIN_VALUE",
      "message": "price must not be less than 1",
      "context_message": "Harga minimal adalah 1",
      "context": {
        "min": 1,
        "actualValue": -10
      }
    }
  ],
  "timestamp": "2025-10-10T10:00:00.000Z",
  "path": "/api/products"
}
```

### 4. Maximum Value Validation

**DTO:**

```typescript
@Max(100)
quantity: number;
```

**Error Response:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "property": "quantity",
      "value": 150,
      "code": "VALIDATION_MAX_VALUE",
      "message": "quantity must not be greater than 100",
      "context_message": "Jumlah maksimal adalah 100",
      "context": {
        "max": 100,
        "actualValue": 150
      }
    }
  ],
  "timestamp": "2025-10-10T10:00:00.000Z",
  "path": "/api/orders"
}
```

### 5. Required Field Validation

**DTO:**

```typescript
@IsNotEmpty()
email: string;
```

**Error Response:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "property": "email",
      "value": "",
      "code": "VALIDATION_REQUIRED",
      "message": "email should not be empty",
      "context_message": "Email wajib diisi"
    }
  ],
  "timestamp": "2025-10-10T10:00:00.000Z",
  "path": "/api/users"
}
```

### 6. Email Format Validation

**DTO:**

```typescript
@IsEmail()
email: string;
```

**Error Response:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "property": "email",
      "value": "invalid-email",
      "code": "VALIDATION_EMAIL_FORMAT",
      "message": "email must be an email",
      "context_message": "Format email tidak valid"
    }
  ],
  "timestamp": "2025-10-10T10:00:00.000Z",
  "path": "/api/users"
}
```

### 7. Enum Validation

**DTO:**

```typescript
@IsEnum(['ACTIVE', 'INACTIVE', 'PENDING'])
status: string;
```

**Error Response:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "property": "status",
      "value": "UNKNOWN",
      "code": "VALIDATION_ENUM",
      "message": "status must be one of the following values: ACTIVE, INACTIVE, PENDING",
      "context_message": "Status harus salah satu dari: ACTIVE, INACTIVE, PENDING",
      "context": {
        "allowedValues": ["ACTIVE", "INACTIVE", "PENDING"],
        "providedValue": "UNKNOWN"
      }
    }
  ],
  "timestamp": "2025-10-10T10:00:00.000Z",
  "path": "/api/users"
}
```

### 8. Array Minimum Size Validation

**DTO:**

```typescript
@ArrayMinSize(2)
tags: string[];
```

**Error Response:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "property": "tags",
      "value": ["tag1"],
      "code": "VALIDATION_ARRAY_MIN_SIZE",
      "message": "tags must contain at least 2 elements",
      "context_message": "Tags harus berisi minimal 2 item",
      "context": {
        "minSize": 2,
        "currentSize": 1
      }
    }
  ],
  "timestamp": "2025-10-10T10:00:00.000Z",
  "path": "/api/products"
}
```

### 9. Multiple Validation Errors

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "property": "name",
      "value": "AB",
      "code": "VALIDATION_MIN_LENGTH",
      "message": "name must be longer than or equal to 3 characters",
      "context_message": "Nama harus memiliki minimal 3 karakter",
      "context": {
        "minLength": 3,
        "currentLength": 2
      }
    },
    {
      "property": "email",
      "value": "invalid",
      "code": "VALIDATION_EMAIL_FORMAT",
      "message": "email must be an email",
      "context_message": "Format email tidak valid"
    },
    {
      "property": "price",
      "value": -5,
      "code": "VALIDATION_MIN_VALUE",
      "message": "price must not be less than 0",
      "context_message": "Harga tidak boleh kurang dari 0",
      "context": {
        "min": 0,
        "actualValue": -5
      }
    }
  ],
  "timestamp": "2025-10-10T10:00:00.000Z",
  "path": "/api/products"
}
```

---

## Supported Validation Codes

### String Validations

- `VALIDATION_MIN_LENGTH` - String too short
- `VALIDATION_MAX_LENGTH` - String too long
- `VALIDATION_LENGTH` - String length doesn't match
- `VALIDATION_EMAIL_FORMAT` - Invalid email format
- `VALIDATION_URL_FORMAT` - Invalid URL format
- `VALIDATION_UUID_FORMAT` - Invalid UUID format
- `VALIDATION_ALPHA` - Must be alphabetic only
- `VALIDATION_ALPHANUMERIC` - Must be alphanumeric only
- `VALIDATION_PATTERN` - Doesn't match required pattern

### Number Validations

- `VALIDATION_MIN_VALUE` - Value too small
- `VALIDATION_MAX_VALUE` - Value too large
- `VALIDATION_POSITIVE` - Must be positive
- `VALIDATION_NEGATIVE` - Must be negative
- `VALIDATION_INTEGER` - Must be an integer
- `VALIDATION_DECIMAL` - Must be a decimal number

### Required Fields

- `VALIDATION_REQUIRED` - Field is required

### Array Validations

- `VALIDATION_ARRAY_NOT_EMPTY` - Array cannot be empty
- `VALIDATION_ARRAY_MIN_SIZE` - Array too small
- `VALIDATION_ARRAY_MAX_SIZE` - Array too large
- `VALIDATION_ARRAY_UNIQUE` - Array must have unique values

### Enum Validations

- `VALIDATION_ENUM` - Value not in allowed enum
- `VALIDATION_IN` - Value not in allowed list

### Date Validations

- `VALIDATION_DATE_FORMAT` - Invalid date format
- `VALIDATION_DATE_STRING` - Invalid date string

### Type Validations

- `VALIDATION_STRING` - Must be a string
- `VALIDATION_NUMBER` - Must be a number
- `VALIDATION_BOOLEAN` - Must be a boolean
- `VALIDATION_JSON_FORMAT` - Invalid JSON format

---

## Client-Side Error Handling

### TypeScript Example

```typescript
interface ErrorDetail {
  property?: string;
  value?: any;
  code: string;
  message: string;
  context_message?: string;
  context?: Record<string, any>;
}

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors: ErrorDetail[];
  timestamp: string;
  path: string;
}

// Handle validation errors
function handleValidationError(error: ErrorResponse) {
  error.errors.forEach((err) => {
    // Display translated message if available
    const displayMessage = err.context_message || err.message;

    // Show error for specific field
    if (err.property) {
      showFieldError(err.property, displayMessage);
    }

    // Log error code for debugging
    console.log(`Error code: ${err.code}`, err.context);
  });
}
```

### React Example

```tsx
const CreateProductForm = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (data: FormData) => {
    try {
      await api.post('/products', data);
    } catch (error) {
      if (error.response?.data?.errors) {
        const fieldErrors: Record<string, string> = {};

        error.response.data.errors.forEach((err: ErrorDetail) => {
          if (err.property) {
            // Use context_message if available (translated)
            fieldErrors[err.property] = err.context_message || err.message;
          }
        });

        setErrors(fieldErrors);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      {errors.name && <span className="error">{errors.name}</span>}

      <input name="price" type="number" />
      {errors.price && <span className="error">{errors.price}</span>}
    </form>
  );
};
```

---

## Notes

1. **Stack Trace**: Stack traces are only included in development mode (`NODE_ENV !== 'production'`). They will not appear in production responses.

2. **Context Message**: The `context_message` field contains the translated, human-readable error message. This is ideal for displaying to end users.

3. **Context Object**: The `context` field contains additional validation metadata that can be useful for:
   - Displaying detailed error messages
   - Client-side validation
   - Analytics and debugging

4. **Error Codes**: Always use the `code` field for programmatic error handling, not the `message` field, as messages can be translated or changed.

5. **Multiple Errors**: A single request can have multiple validation errors. Always handle the `errors` array properly.

---

**Last Updated**: 2025-10-10
**Version**: 1.0.0
