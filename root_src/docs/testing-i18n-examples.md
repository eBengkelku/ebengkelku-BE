# I18n Implementation Test Examples

## Testing Language Support

Your NestJS application now supports English and Indonesian languages via the `x-lang` custom header.

### 1. Test User Signup (English)

```bash
curl -X POST http://localhost:3004/users/signup \
  -H "Content-Type: application/json" \
  -H "x-lang: en" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 2. Test User Signup (Indonesian)

```bash
curl -X POST http://localhost:3004/users/signup \
  -H "Content-Type: application/json" \
  -H "x-lang: id" \
  -d '{
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "password": "password123"
  }'
```

### 3. Test User Signin (English)

```bash
curl -X POST http://localhost:3004/users/signin \
  -H "Content-Type: application/json" \
  -H "x-lang: en" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 4. Test User Signin (Indonesian)

```bash
curl -X POST http://localhost:3004/users/signin \
  -H "Content-Type: application/json" \
  -H "x-lang: id" \
  -d '{
    "email": "budi@example.com",
    "password": "password123"
  }'
```

### 5. Test Products List (English)

```bash
curl -X GET http://localhost:3004/products \
  -H "x-lang: en"
```

### 6. Test Products List (Indonesian)

```bash
curl -X GET http://localhost:3004/products \
  -H "x-lang: id"
```

### 7. Test Create Product (English)

```bash
curl -X POST http://localhost:3004/products \
  -H "Content-Type: application/json" \
  -H "x-lang: en" \
  -d '{
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 1500
  }'
```

### 8. Test Create Product (Indonesian)

```bash
curl -X POST http://localhost:3004/products \
  -H "Content-Type: application/json" \
  -H "x-lang: id" \
  -d '{
    "name": "Laptop",
    "description": "Laptop performa tinggi",
    "price": 1500
  }'
```

### 9. Test Error Messages (User Not Found - English)

```bash
curl -X POST http://localhost:3004/users/signin \
  -H "Content-Type: application/json" \
  -H "x-lang: en" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "password123"
  }'
```

### 10. Test Error Messages (User Not Found - Indonesian)

```bash
curl -X POST http://localhost:3004/users/signin \
  -H "Content-Type: application/json" \
  -H "x-lang: id" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "password123"
  }'
```

## Expected Responses

### English Response Example:

```json
{
  "message": "User created successfully",
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Indonesian Response Example:

```json
{
  "message": "Pengguna berhasil dibuat",
  "id": 1,
  "name": "Budi Santoso",
  "email": "budi@example.com"
}
```

## Language Detection Priority

1. **Custom Header**: `x-lang: en` or `x-lang: id` (highest priority)
2. **Accept-Language Header**: `Accept-Language: en-US,en;q=0.9`
3. **Fallback**: English (default)

## Notes

- If no `x-lang` header is provided, the system will fall back to English
- Supported languages: `en` (English), `id` (Indonesian)
- All API endpoints now support internationalization
- Error messages are also localized based on the language preference
