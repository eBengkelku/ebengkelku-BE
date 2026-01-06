# File Upload API Examples

This document provides examples for testing the file upload functionality in the Products API.

## Available Upload Endpoints

### 1. General File Upload

**Endpoint:** `POST /products/upload`
**Description:** Upload a file without associating it to a specific product

### 2. Product-Specific File Upload

**Endpoint:** `POST /products/:id/upload`
**Description:** Upload a file and associate it with a specific product ID

## Supported File Types

- **Images:** JPG, JPEG, PNG, GIF
- **Documents:** PDF, DOC, DOCX
- **File Size Limit:** 5MB maximum

## Testing with Postman

### General File Upload

1. **Method:** POST
2. **URL:** `http://localhost:3004/products/upload`
3. **Headers:**
   - `x-lang: en` (for English responses)
   - `x-lang: id` (for Indonesian responses)
4. **Body:**
   - Select "form-data"
   - Key: `file` (set type to "File")
   - Value: Select your file

### Product-Specific File Upload

1. **Method:** POST
2. **URL:** `http://localhost:3004/products/1/upload` (replace 1 with actual product ID)
3. **Headers:**
   - `x-lang: en` (for English responses)
   - `x-lang: id` (for Indonesian responses)
4. **Body:**
   - Select "form-data"
   - Key: `file` (set type to "File")
   - Value: Select your file

## Testing with cURL

### General File Upload (English)

```bash
curl -X POST http://localhost:3004/products/upload \
  -H "x-lang: en" \
  -F "file=@/path/to/your/file.jpg"
```

### General File Upload (Indonesian)

```bash
curl -X POST http://localhost:3004/products/upload \
  -H "x-lang: id" \
  -F "file=@/path/to/your/file.jpg"
```

### Product-Specific File Upload (English)

```bash
curl -X POST http://localhost:3004/products/1/upload \
  -H "x-lang: en" \
  -F "file=@/path/to/your/file.pdf"
```

### Product-Specific File Upload (Indonesian)

```bash
curl -X POST http://localhost:3004/products/1/upload \
  -H "x-lang: id" \
  -F "file=@/path/to/your/file.pdf"
```

## Expected Responses

### Success Response (English)

```json
{
  "message": "File uploaded successfully",
  "data": {
    "originalName": "example.jpg",
    "filename": "product-1642123456789-123456789.jpg",
    "path": "uploads/products/product-1642123456789-123456789.jpg",
    "size": 245760,
    "mimetype": "image/jpeg",
    "uploadedAt": "2024-01-15T10:30:45.123Z"
  }
}
```

### Success Response (Indonesian)

```json
{
  "message": "File berhasil diupload",
  "data": {
    "originalName": "example.jpg",
    "filename": "product-1642123456789-123456789.jpg",
    "path": "uploads/products/product-1642123456789-123456789.jpg",
    "size": 245760,
    "mimetype": "image/jpeg",
    "uploadedAt": "2024-01-15T10:30:45.123Z"
  }
}
```

### Product-Specific Success Response (English)

```json
{
  "message": "File uploaded successfully for product ID 1",
  "data": {
    "productId": 1,
    "originalName": "product-manual.pdf",
    "filename": "product-1642123456789-987654321.pdf",
    "path": "uploads/products/product-1642123456789-987654321.pdf",
    "size": 1024000,
    "mimetype": "application/pdf",
    "uploadedAt": "2024-01-15T10:35:20.456Z"
  }
}
```

## Error Responses

### No File Uploaded (English)

```json
{
  "statusCode": 400,
  "message": "No file uploaded",
  "error": "Bad Request"
}
```

### No File Uploaded (Indonesian)

```json
{
  "statusCode": 400,
  "message": "File tidak ditemukan",
  "error": "Bad Request"
}
```

### Invalid File Type

```json
{
  "statusCode": 400,
  "message": "Only image and document files are allowed!",
  "error": "Bad Request"
}
```

### Product Not Found (English)

```json
{
  "statusCode": 400,
  "message": "Product not found",
  "error": "Bad Request"
}
```

### Product Not Found (Indonesian)

```json
{
  "statusCode": 400,
  "message": "Produk tidak ditemukan",
  "error": "Bad Request"
}
```

### File Too Large

```json
{
  "statusCode": 413,
  "message": "File too large",
  "error": "Payload Too Large"
}
```

## File Storage

- **Directory:** `uploads/products/`
- **Naming Convention:** `product-{timestamp}-{random}.{extension}`
- **Example:** `product-1642123456789-123456789.jpg`

## Notes

1. **File Validation:** Only specific file types are allowed (images and documents)
2. **Size Limit:** Maximum file size is 5MB
3. **Unique Naming:** Files are automatically renamed to prevent conflicts
4. **Language Support:** Error messages and success messages support English and Indonesian
5. **Product Validation:** For product-specific uploads, the system checks if the product exists
6. **File Information:** The API returns comprehensive file information including original name, new filename, path, size, and upload timestamp
