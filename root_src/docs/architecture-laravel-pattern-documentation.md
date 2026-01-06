# Laravel Pattern Implementation in NestJS

This implementation brings the powerful Laravel MyModel pattern to NestJS using Knex.js, providing automatic CRUD operations, search functionality, and consistent API endpoints.

> **📁 Example Files Location:** All implementation examples are located in the `examples/products/` directory:
>
> - `examples/products/products-laravel.service.ts` - Service implementation example
> - `examples/products/products-laravel.controller.ts` - Controller implementation example
> - `examples/products/products-enhanced.service.ts` - Advanced search features example
>
> These are **demonstration files** showing different patterns and approaches. The main product implementation is in `src/domains/products/`.

## 🚀 Quick Start

### 1. Basic Usage

Create a new domain service by extending `BaseKnexService`:

```typescript
@Injectable()
export class YourService extends BaseKnexService<YourDto> {
  constructor(
    protected readonly databaseService: DatabaseService,
    protected readonly i18n: I18nService,
  ) {
    const config: BaseKnexServiceConfig = {
      tableName: 'your_table',
      primaryKey: 'id',
      descColumns: ['name', 'title'], // For combo/dropdown
      fillable: ['name', 'description', 'status'],
      rules: {
        name: { required: true, type: 'string', maxLength: 255 },
        status: { required: true, type: 'string' },
      },
    };
    super(databaseService, i18n, config);
  }
}
```

Create a controller by extending `BaseKnexController`:

```typescript
@Controller('v1/data/your-entity')
export class YourController extends BaseKnexController<YourDto> {
  constructor(private readonly yourService: YourService) {
    super(yourService, 'YourEntity');
  }

  // All CRUD endpoints are automatically available!
  // Add custom endpoints here
}
```

### 2. Auto-Generated Endpoints

Every controller automatically gets these Laravel-style endpoints:

```bash
# Basic CRUD
GET    /v1/data/your-entity/list              # Paginated list
GET    /v1/data/your-entity/detail/:id        # Get by ID
POST   /v1/data/your-entity/create            # Create new
PUT    /v1/data/your-entity/update/:id        # Update existing
DELETE /v1/data/your-entity/delete/:id        # Soft delete

# Search & Filter
POST   /v1/data/your-entity/search            # Advanced search
POST   /v1/data/your-entity/data-tabulator    # For data tables

# UI Helpers
GET    /v1/data/your-entity/combo             # Dropdown data
GET    /v1/data/your-entity/combo/:keyword    # Filtered dropdown
POST   /v1/data/your-entity/combo             # Complex dropdown

# Metadata
GET    /v1/data/your-entity/rules             # Validation rules

# Bulk Operations
DELETE /v1/data/your-entity/delete-all        # Bulk delete
```

## 📋 Complete Example: Products Domain

### Service Implementation

```typescript
@Injectable()
export class ProductsEnhancedService extends BaseKnexService<ProductDto> {
  constructor(
    protected readonly databaseService: DatabaseService,
    protected readonly i18n: I18nService,
  ) {
    super(databaseService, i18n, {
      tableName: 'products',
      primaryKey: 'id',
      timestampColumns: {
        created: 'created_at',
        updated: 'updated_at',
        deleted: 'deleted_at', // Enables soft delete
      },
      descColumns: ['name', 'category'],
      fillable: ['name', 'description', 'price', 'stock_quantity', 'category'],
      rules: {
        name: { required: true, type: 'string', maxLength: 255 },
        price: { required: true, type: 'number', min: 0 },
        stock_quantity: { required: true, type: 'number', min: 0 },
      },
    });
  }

  // Custom business logic (equivalent to Laravel's doAfterInsert)
  protected async afterCreate(product: ProductDto): Promise<void> {
    console.log(`Product created: ${product.name}`);
    // Add custom logic: notifications, cache updates, etc.
  }

  // Custom methods
  async findByCategory(category: string, pagination: any, lang?: string) {
    const searchDto = {
      filters: [['category', 'like', category]] as [string, string, any][],
    };
    return this.search(searchDto, pagination, lang);
  }
}
```

### Controller Implementation

```typescript
@Controller('v1/data/products')
@ApiTags('Products (Laravel Pattern)')
export class ProductsLaravelController extends BaseKnexController<ProductDto> {
  constructor(private readonly productsService: ProductsEnhancedService) {
    super(productsService, 'Product');
  }

  // Custom endpoints beyond the auto-generated ones
  @Get('category/:category')
  async findByCategory(
    @Param('category') category: string,
    @Query() pagination: any,
    @Headers('x-lang') lang?: string,
  ) {
    return this.productsService.findByCategory(category, pagination, lang);
  }
}
```

## 🔍 Advanced Features

### 1. Search with Filters

```typescript
// POST /v1/data/products/search
{
  "filters": [
    ["name", "like", "Phone"],
    ["price", ">=", 100],
    ["category", "in", ["Electronics", "Mobile"]],
    ["stock_quantity", ">", 0]
  ],
  "sort": [
    ["created_at", "desc"],
    ["name", "asc"]
  ]
}
```

### 2. Custom Base Query Override

```typescript
// Override for custom joins or calculated fields
protected baseListQuery() {
  return this.knex(this.config.tableName)
    .leftJoin('categories', 'products.category_id', 'categories.id')
    .select([
      'products.*',
      'categories.name as category_name',
      this.knex.raw('(products.price * products.stock_quantity) as total_value')
    ])
    .whereNull('products.deleted_at');
}
```

### 3. Custom Validation Rules

```typescript
const config: BaseKnexServiceConfig = {
  // ... other config
  rules: {
    name: {
      required: true,
      type: 'string',
      maxLength: 255,
      unique: true,
    },
    email: {
      required: true,
      type: 'email',
      unique: true,
    },
    price: {
      required: true,
      type: 'number',
      min: 0,
      max: 999999.99,
    },
    status: {
      required: true,
      type: 'string',
      enum: ['active', 'inactive', 'pending'],
    },
  },
};
```

### 4. File Upload Support

```typescript
@Post('upload/:id')
@UseInterceptors(FileInterceptor('file'))
async uploadFile(
  @Param('id') id: number,
  @UploadedFile() file: Express.Multer.File,
) {
  const updated = await this.service.update(id, {
    file_path: file.path,
    file_name: file.originalname,
  });
  return { message: 'File uploaded successfully', data: updated };
}
```

## 🏗️ Auto-CRUD Module Generator

Generate complete CRUD modules automatically:

```typescript
// In your app.module.ts
import { AutoCrudModule } from './common/modules/auto-crud.module';

@Module({
  imports: [
    // Generate CRUD for multiple entities at once
    AutoCrudModule.forFeature({
      entityName: 'Certificate',
      tableName: 'certificates',
      descColumns: ['name', 'issuer'],
      softDeletes: true,
    }),
    AutoCrudModule.forFeature({
      entityName: 'User',
      tableName: 'users',
      descColumns: ['name', 'email'],
      softDeletes: true,
    }),
    // ... other modules
  ],
})
export class AppModule {}
```

## 🎯 Laravel Equivalent Mapping

| Laravel Feature               | NestJS Implementation        | Description                      |
| ----------------------------- | ---------------------------- | -------------------------------- |
| `MyModel::getList()`          | `BaseKnexService.findAll()`  | Paginated list with sorting      |
| `MyModel::getById()`          | `BaseKnexService.findOne()`  | Get single record by ID          |
| `MyModel::searchByKeywords()` | `BaseKnexService.search()`   | Advanced search with filters     |
| `MyModel::doInsert()`         | `BaseKnexService.create()`   | Create with hooks and validation |
| `MyModel::doUpdate()`         | `BaseKnexService.update()`   | Update with hooks and validation |
| `MyModel::doDelete()`         | `BaseKnexService.remove()`   | Soft delete by default           |
| `MyModel::combo()`            | `BaseKnexService.getCombo()` | Dropdown/select data             |
| `doAfterInsert()`             | `afterCreate()`              | Post-creation hook               |
| `doBeforeUpdate()`            | `beforeUpdate()`             | Pre-update hook                  |
| `TraitDocument`               | Service configuration        | Feature-specific configuration   |
| Dynamic routes                | `BaseKnexController`         | Auto-generated CRUD endpoints    |

## 🔧 Migration Support

Create migrations for your tables:

```javascript
// Add soft delete support
exports.up = function (knex) {
  return knex.schema.alterTable('your_table', function (table) {
    table.timestamp('deleted_at').nullable();
    table.string('created_by').nullable();
    table.string('updated_by').nullable();
    table.index('deleted_at');
  });
};
```

## 🧪 Testing

Test your Laravel pattern implementation:

```typescript
describe('Laravel Pattern Test', () => {
  let service: YourService;

  it('should complete full CRUD workflow', async () => {
    // CREATE
    const created = await service.create({ name: 'Test Item' });
    expect(created.id).toBeDefined();

    // READ
    const found = await service.findOne(created.id);
    expect(found.name).toBe('Test Item');

    // UPDATE
    const updated = await service.update(created.id, { name: 'Updated Item' });
    expect(updated.name).toBe('Updated Item');

    // SEARCH
    const searchResult = await service.search(
      { filters: [['name', 'like', 'Updated']] },
      { page: 1, limit: 10 },
    );
    expect(searchResult.data.length).toBeGreaterThan(0);

    // DELETE
    await service.remove(created.id);
    await expect(service.findOne(created.id)).rejects.toThrow();
  });
});
```

## 📚 Best Practices

1. **Service Layer**: Keep business logic in service methods
2. **Custom Hooks**: Use `beforeCreate`, `afterUpdate`, etc. for custom logic
3. **Validation**: Define comprehensive rules in service configuration
4. **Soft Deletes**: Enable for data integrity
5. **Indexing**: Add database indexes for performance
6. **Testing**: Write comprehensive tests for your services
7. **Documentation**: Use Swagger decorators for API documentation

## 🚀 Benefits

- ✅ **Rapid Development**: One service/controller = 15+ endpoints
- ✅ **Consistency**: Same API structure across all domains
- ✅ **Type Safety**: Full TypeScript support
- ✅ **Laravel Familiarity**: Same patterns as Laravel
- ✅ **Extensibility**: Easy to add custom business logic
- ✅ **Testing**: Built-in testability
- ✅ **Documentation**: Auto-generated Swagger docs

This pattern gives you the same productivity boost as Laravel's MyModel but with NestJS's modern TypeScript architecture!
