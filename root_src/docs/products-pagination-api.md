# Products API Pagination Documentation

## Overview

The Products API now supports comprehensive pagination, filtering, and sorting capabilities.

## API Endpoint

```
GET /products
```

## Query Parameters

### Pagination

- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 10, min: 1, max: 100)

### Sorting

- `sortBy` (optional): Field to sort by (default: 'id')
- `sortOrder` (optional): Sort direction - 'ASC' or 'DESC' (default: 'DESC')

### Filtering

- `search` (optional): Search in product name and description
- `category` (optional): Filter by category

### Internationalization

- `x-lang` (header, optional): Language for response messages ('en' or 'id')

## Example Requests

### Basic Pagination

```bash
GET /products?page=1&limit=5
```

### With Search

```bash
GET /products?search=laptop&page=1&limit=10
```

### With Category Filter

```bash
GET /products?category=electronics&page=2&limit=5
```

### With Sorting

```bash
GET /products?sortBy=name&sortOrder=ASC&page=1&limit=10
```

### Combined Parameters

```bash
GET /products?search=phone&category=electronics&sortBy=price&sortOrder=DESC&page=1&limit=5
```

## Response Format

```json
{
  "data": [
    {
      "id": 1,
      "name": "Product Name",
      "description": "Product Description",
      "price": 99.99,
      "stock_quantity": 10,
      "category": "electronics",
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNext": true,
    "hasPrevious": false
  },
  "message": "Products listed successfully"
}
```

## Pagination Metadata

- `currentPage`: Current page number
- `totalPages`: Total number of pages
- `totalItems`: Total number of items across all pages
- `itemsPerPage`: Number of items per page (same as limit)
- `hasNext`: Boolean indicating if there are more pages
- `hasPrevious`: Boolean indicating if there are previous pages

## Performance Considerations

1. **Limit Cap**: Maximum of 100 items per request to prevent performance issues
2. **Database Indexing**: Ensure proper indexing on sortable fields
3. **Search Optimization**: Uses ILIKE for case-insensitive search (PostgreSQL)

## Error Handling

- Invalid pagination parameters return validation errors
- Page numbers beyond available pages return empty results
- Invalid sort fields may cause database errors

## Frontend Implementation Tips

### Navigation Links

```javascript
// Generate pagination links
const generatePageUrl = (page) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: currentLimit.toString(),
    ...(search && { search }),
    ...(category && { category }),
    sortBy: currentSortBy,
    sortOrder: currentSortOrder,
  });
  return `/products?${params.toString()}`;
};

// Previous page
if (pagination.hasPrevious) {
  const prevUrl = generatePageUrl(pagination.currentPage - 1);
}

// Next page
if (pagination.hasNext) {
  const nextUrl = generatePageUrl(pagination.currentPage + 1);
}
```

### State Management

```javascript
const [products, setProducts] = useState([]);
const [pagination, setPagination] = useState({});
const [loading, setLoading] = useState(false);
const [filters, setFilters] = useState({
  page: 1,
  limit: 10,
  search: '',
  category: '',
  sortBy: 'id',
  sortOrder: 'DESC',
});

const fetchProducts = async () => {
  setLoading(true);
  try {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`/products?${queryParams}`);
    const data = await response.json();
    setProducts(data.data);
    setPagination(data.pagination);
  } catch (error) {
    console.error('Error fetching products:', error);
  } finally {
    setLoading(false);
  }
};
```
