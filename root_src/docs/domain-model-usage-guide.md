# Domain Model Pattern - Usage Guide

**Version**: 1.0
**Last Updated**: 2025-10-03
**Author**: System Architecture Team
**Status**: ✅ Production Ready

---

## Table of Contents

- [Introduction](#introduction)
- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Implementation Example: Products](#implementation-example-products)
- [Step-by-Step Guide](#step-by-step-guide)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [Testing Strategy](#testing-strategy)
- [Migration from Anemic Model](#migration-from-anemic-model)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Introduction

### What is the Domain Model Pattern?

The **Rich Domain Model** pattern is a Domain-Driven Design (DDD) approach where business logic and validation rules are encapsulated within domain models rather than services. This creates self-contained, testable, and maintainable domain objects that cannot exist in invalid states.

### Why Use This Pattern?

✅ **Encapsulation**: Business logic lives in domain models, not scattered in services
✅ **Type Safety**: Rich models with methods prevent invalid states
✅ **Testability**: Business logic can be tested without databases
✅ **Maintainability**: Single source of truth for business rules
✅ **Scalability**: Clean separation of concerns enables growth
✅ **Self-Documenting**: Domain models express business intent clearly

### When to Use?

| **Use Rich Domain Model** | **Use Anemic Model (BaseKnexService)** |
|---------------------------|----------------------------------------|
| ✅ Complex business rules | ✅ Simple CRUD operations |
| ✅ State management needed | ✅ Minimal business logic |
| ✅ Validation with invariants | ✅ Data-centric operations |
| ✅ Time-based logic | ✅ Rapid prototyping |
| ✅ Multiple related rules | ✅ Straightforward validation |

**Decision Score** (see blueprint for detailed matrix):
- **0-1 points**: Use Anemic Model
- **2-3 points**: Either pattern works
- **4+ points**: Use Rich Domain Model

---

## Quick Start

### 1. Import Base Infrastructure

```typescript
// Already available in nest-starter
import {
  BaseDomainModel,
  BaseDomainRepository,
  BaseDomainService, // Optional
  DomainRepositoryConfig,
} from '@/common/domain';
```

### 2. Create Your Domain Structure

```
src/domains/your-domain/
├── models/
│   └── your-entity.model.ts      # Rich domain model
├── repository/
│   └── your-entity.repository.ts # Data access layer
├── interfaces/
│   └── your-entity.interface.ts  # Database schema
├── your-entity.service.ts         # Orchestration layer
├── your-entity.controller.ts      # HTTP layer
└── your-entity.module.ts          # NestJS module
```

### 3. Follow the Pattern

1. **Define Entity Interface** (database schema)
2. **Create Domain Model** (business logic)
3. **Implement Repository** (data access)
4. **Create Service** (orchestration)
5. **Register in Module**

---

## Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────────┐
│         Layer 1: Presentation           │
│           (Controllers)                 │
│   - HTTP Request/Response               │
│   - DTO Validation                      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       Layer 2: Application              │
│            (Services)                   │
│   - Use case orchestration              │
│   - Transaction management              │
│   - Domain ↔ Entity conversion          │
└─────────────────────────────────────────┘
                    ↓
        ┌──────────┴──────────┐
        ↓                     ↓
┌──────────────┐    ┌──────────────────┐
│   Domain     │    │   Repository     │
│   (Models)   │    │   (Data Access)  │
│              │    │                  │
│ - Business   │    │ - DB Queries     │
│   Logic      │    │ - Data Mapping   │
│ - Validation │    │ - Persistence    │
└──────────────┘    └──────────────────┘
                           ↓
                ┌──────────────────────┐
                │   Database (Knex)    │
                └──────────────────────┘
```

### Data Flow

#### Creation Flow
```
1. Controller receives DTO
   └─> Validates with class-validator

2. Service orchestrates
   └─> Creates Domain Model (validates business rules)
       └─> Calls Repository.save()

3. Repository persists
   └─> Converts model.toEntity()
       └─> Inserts to database

4. Service returns
   └─> Converts model.toEntity()
       └─> Returns to Controller
```

#### Update Flow
```
1. Controller receives DTO + ID

2. Service orchestrates
   └─> Repository.findByIdOrThrow(id)
       └─> Gets Domain Model
           └─> Calls model.update(data) (validates)
               └─> Repository.save(model)

3. Repository persists
   └─> Updates database

4. Service returns updated entity
```

---

## Implementation Example: Products

### 1. Entity Interface

```typescript
// src/domains/products/interfaces/product.interface.ts

export interface IProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  category?: string;
  file_id?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}
```

### 2. Domain Model

```typescript
// src/domains/products/models/product.model.ts

import { BaseDomainModel } from '@/common/domain';
import { IProduct } from '../interfaces/product.interface';
import { BadRequestException } from '@nestjs/common';

export class ProductModel extends BaseDomainModel<IProduct> {
  private constructor(
    private id: string,
    private name: string,
    private price: number,
    private stockQuantity: number,
    private description?: string,
    private category?: string,
    private fileId?: string,
    private createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
    private deletedAt: Date | null = null,
  ) {
    super();
  }

  // Factory: Create new instance with validation
  static create(data: {
    id: string;
    name: string;
    price: number;
    stock: number;
    description?: string;
    category?: string;
    fileId?: string;
  }): ProductModel {
    // Business Rule: Name required
    if (!data.name || data.name.trim().length === 0) {
      throw new BadRequestException('Product name is required');
    }

    // Business Rule: Price must be non-negative
    if (data.price < 0) {
      throw new BadRequestException('Price must be non-negative');
    }

    // Business Rule: Stock must be non-negative
    if (data.stock < 0) {
      throw new BadRequestException('Stock must be non-negative');
    }

    const now = new Date();
    return new ProductModel(
      data.id,
      data.name.trim(),
      data.price,
      data.stock,
      data.description,
      data.category,
      data.fileId,
      now,
      now,
      null
    );
  }

  // Factory: Reconstitute from database
  static reconstitute(data: IProduct): ProductModel {
    return new ProductModel(
      data.id,
      data.name,
      data.price,
      data.stock_quantity,
      data.description,
      data.category,
      data.file_id,
      data.created_at,
      data.updated_at,
      data.deleted_at || null
    );
  }

  // Business Method: Update product
  update(data: {
    name?: string;
    price?: number;
    stock?: number;
    description?: string;
    category?: string;
  }): void {
    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new BadRequestException('Name cannot be empty');
      }
      this.name = data.name.trim();
    }

    if (data.price !== undefined) {
      if (data.price < 0) {
        throw new BadRequestException('Price must be non-negative');
      }
      this.price = data.price;
    }

    if (data.stock !== undefined) {
      if (data.stock < 0) {
        throw new BadRequestException('Stock must be non-negative');
      }
      this.stockQuantity = data.stock;
    }

    if (data.description !== undefined) {
      this.description = data.description;
    }

    if (data.category !== undefined) {
      this.category = data.category;
    }

    this.updatedAt = new Date();
  }

  // Business Method: Adjust stock
  adjustStock(delta: number): void {
    const newStock = this.stockQuantity + delta;

    if (newStock < 0) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${this.stockQuantity}`
      );
    }

    this.stockQuantity = newStock;
    this.updatedAt = new Date();
  }

  // Business Method: Apply discount
  applyDiscount(percent: number): void {
    if (percent < 0 || percent > 100) {
      throw new BadRequestException('Discount must be 0-100%');
    }

    const discount = this.price * (percent / 100);
    this.price = this.price - discount;
    this.updatedAt = new Date();
  }

  // Query Method: Check stock
  isInStock(): boolean {
    return this.stockQuantity > 0;
  }

  // Query Method: Low stock check
  isLowStock(threshold: number = 10): boolean {
    return this.stockQuantity <= threshold;
  }

  // Convert to entity
  toEntity(): IProduct {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      stock_quantity: this.stockQuantity,
      category: this.category,
      file_id: this.fileId,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      deleted_at: this.deletedAt || undefined,
    };
  }

  // Getters
  getId(): string { return this.id; }
  getName(): string { return this.name; }
  getPrice(): number { return this.price; }
  getStockQuantity(): number { return this.stockQuantity; }
}
```

### 3. Repository

```typescript
// src/domains/products/repository/product.repository.ts

import { Injectable } from '@nestjs/common';
import { BaseDomainRepository } from '@/common/domain';
import { ProductModel } from '../models/product.model';
import { IProduct } from '../interfaces/product.interface';
import { DatabaseService } from '@/database/database.service';

@Injectable()
export class ProductRepository extends BaseDomainRepository<
  ProductModel,
  IProduct
> {
  protected tableName = 'products';

  constructor(databaseService: DatabaseService) {
    super(databaseService, {
      entityName: 'Product',
      tableName: 'products',
      primaryKey: 'id',
      timestampColumns: {
        created: 'created_at',
        updated: 'updated_at',
        deleted: 'deleted_at',
      },
      softDelete: true,
      descColumns: ['name', 'description'],
    });
  }

  async findById(id: string): Promise<ProductModel | null> {
    const row = await this.baseQuery().where('id', id).first();
    if (!row) return null;
    return ProductModel.reconstitute(row);
  }

  async findAll(pagination: { page: number; limit: number }) {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const [{ count }] = await this.baseQuery().count('* as count');
    const total = parseInt(count as string, 10);

    const rows = await this.baseQuery()
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    const data = rows.map(row => ProductModel.reconstitute(row));
    return { data, total };
  }

  protected async insert(entity: IProduct): Promise<void> {
    await this.knex(this.tableName).insert(entity);
  }

  protected async update(entity: IProduct): Promise<void> {
    await this.knex(this.tableName)
      .where('id', entity.id)
      .update({ ...entity, updated_at: new Date() });
  }

  protected async exists(id: string): Promise<boolean> {
    const row = await this.knex(this.tableName).where('id', id).first();
    return !!row;
  }

  protected async softDelete(id: string): Promise<void> {
    await this.knex(this.tableName)
      .where('id', id)
      .update({ deleted_at: new Date() });
  }

  protected async hardDelete(id: string): Promise<void> {
    await this.knex(this.tableName).where('id', id).delete();
  }

  // Custom queries
  async findByCategory(category: string): Promise<ProductModel[]> {
    const rows = await this.baseQuery()
      .whereRaw('LOWER(category) LIKE LOWER(?)', [`%${category}%`]);
    return rows.map(row => ProductModel.reconstitute(row));
  }

  async findLowStock(threshold: number = 10): Promise<ProductModel[]> {
    const rows = await this.baseQuery()
      .where('stock_quantity', '<=', threshold)
      .orderBy('stock_quantity', 'asc');
    return rows.map(row => ProductModel.reconstitute(row));
  }
}
```

### 4. Service (Thin Orchestration Layer)

```typescript
// src/domains/products/product.service.ts

import { Injectable } from '@nestjs/common';
import { ProductRepository } from './repository/product.repository';
import { ProductModel } from './models/product.model';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ProductService {
  constructor(
    private readonly repository: ProductRepository,
  ) {}

  async create(dto: CreateProductDto) {
    // Create domain model (validates business rules)
    const product = ProductModel.create({
      id: uuidv4(),
      name: dto.name,
      price: dto.price,
      stock: dto.stock_quantity,
      description: dto.description,
      category: dto.category,
    });

    // Persist
    await this.repository.save(product);

    // Return entity
    return product.toEntity();
  }

  async findById(id: string) {
    const product = await this.repository.findByIdOrThrow(id);
    return product.toEntity();
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.repository.findByIdOrThrow(id);

    // Business logic in model
    product.update({
      name: dto.name,
      price: dto.price,
      stock: dto.stock_quantity,
      description: dto.description,
      category: dto.category,
    });

    await this.repository.save(product);
    return product.toEntity();
  }

  async applyDiscount(id: string, percent: number) {
    const product = await this.repository.findByIdOrThrow(id);
    product.applyDiscount(percent); // Business logic in model!
    await this.repository.save(product);
    return product.toEntity();
  }

  async adjustStock(id: string, delta: number) {
    const product = await this.repository.findByIdOrThrow(id);
    product.adjustStock(delta); // Business logic in model!
    await this.repository.save(product);
    return product.toEntity();
  }

  async getLowStockProducts(threshold: number = 10) {
    const products = await this.repository.findLowStock(threshold);
    return products.map(p => p.toEntity());
  }
}
```

### 5. Module Registration

```typescript
// src/domains/products/products.module.ts

import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ProductRepository } from './repository/product.repository';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [ProductRepository, ProductService],
  controllers: [ProductController],
  exports: [ProductService, ProductRepository],
})
export class ProductsModule {}
```

---

## Step-by-Step Guide

### Step 1: Analyze Your Domain

Before implementing, answer these questions:

1. **Complexity**: How many business rules exist?
2. **State Management**: Does the entity have state transitions?
3. **Validation**: Are there complex validation rules?
4. **Invariants**: What conditions must always be true?

**Example - Product Domain Analysis**:
- ✅ Business rules: price >= 0, stock >= 0, stock cannot go negative
- ✅ State management: stock changes over time
- ✅ Validation: name required, price/stock validation
- ✅ Invariants: stock never negative, price never negative
- **Decision**: Use Rich Domain Model ✅

### Step 2: Define Entity Interface

Create the database schema interface:

```typescript
// interfaces/your-entity.interface.ts

export interface IYourEntity {
  id: string;
  // ... your fields (snake_case for DB)
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}
```

### Step 3: Create Domain Model

```typescript
// models/your-entity.model.ts

import { BaseDomainModel } from '@/common/domain';

export class YourEntityModel extends BaseDomainModel<IYourEntity> {
  private constructor(
    // private fields
  ) {
    super();
  }

  static create(data: CreateData): YourEntityModel {
    // Validate business rules
    // Return new instance
  }

  static reconstitute(data: IYourEntity): YourEntityModel {
    return new YourEntityModel(...);
  }

  // Business methods
  update(data: UpdateData): void { }
  someBusinessAction(): void { }

  // Query methods
  isValid(): boolean { }
  canPerformAction(): boolean { }

  toEntity(): IYourEntity {
    return { /* map to entity */ };
  }

  // Getters
  getId(): string { return this.id; }
}
```

### Step 4: Implement Repository

```typescript
// repository/your-entity.repository.ts

@Injectable()
export class YourEntityRepository extends BaseDomainRepository<
  YourEntityModel,
  IYourEntity
> {
  protected tableName = 'your_table';

  constructor(databaseService: DatabaseService) {
    super(databaseService, {
      entityName: 'YourEntity',
      tableName: 'your_table',
      // ... config
    });
  }

  async findById(id: string): Promise<YourEntityModel | null> {
    const row = await this.baseQuery().where('id', id).first();
    if (!row) return null;
    return YourEntityModel.reconstitute(row);
  }

  async findAll(pagination) { /* ... */ }

  protected async insert(entity: IYourEntity) { /* ... */ }
  protected async update(entity: IYourEntity) { /* ... */ }
  protected async exists(id: string) { /* ... */ }
  protected async softDelete(id: string) { /* ... */ }
  protected async hardDelete(id: string) { /* ... */ }
}
```

### Step 5: Create Service

```typescript
// your-entity.service.ts

@Injectable()
export class YourEntityService {
  constructor(
    private readonly repository: YourEntityRepository,
  ) {}

  async create(dto: CreateDto) {
    const model = YourEntityModel.create({ id: uuidv4(), ...dto });
    await this.repository.save(model);
    return model.toEntity();
  }

  async update(id: string, dto: UpdateDto) {
    const model = await this.repository.findByIdOrThrow(id);
    model.update(dto);
    await this.repository.save(model);
    return model.toEntity();
  }

  // Business operations
  async performBusinessAction(id: string, params) {
    const model = await this.repository.findByIdOrThrow(id);
    model.businessAction(params); // Logic in model!
    await this.repository.save(model);
    return model.toEntity();
  }
}
```

### Step 6: Register Module

```typescript
// your-entity.module.ts

@Module({
  imports: [DatabaseModule],
  providers: [YourEntityRepository, YourEntityService],
  controllers: [YourEntityController],
  exports: [YourEntityService],
})
export class YourEntityModule {}
```

---

## Best Practices

### 1. Domain Model Design

✅ **DO**:
- Keep constructors private, use factory methods (`create`, `reconstitute`)
- Validate in `create()`, not in `reconstitute()`
- Use descriptive method names that express business intent
- Keep domain models focused on business logic
- Make fields private, provide getters
- Return copies of arrays/objects, not references

❌ **DON'T**:
- Put database logic in domain models
- Allow models to exist in invalid states
- Use public setters (use update methods instead)
- Leak domain model to API (use `toEntity()`)

### 2. Repository Design

✅ **DO**:
- Use `baseQuery()` for all SELECT operations
- Implement custom query methods for specific needs
- Use transactions for multi-step operations
- Return domain models from query methods
- Handle soft deletes automatically

❌ **DON'T**:
- Expose Knex query builder outside repository
- Put business logic in repositories
- Return raw database rows (use `reconstitute()`)

### 3. Service Design

✅ **DO**:
- Keep services thin (orchestration only)
- Delegate business logic to domain models
- Handle transactions across multiple repositories
- Convert models to entities before returning
- Handle external service integration here

❌ **DON'T**:
- Duplicate business logic from models
- Directly modify model private properties
- Skip validation by using `reconstitute()` incorrectly

### 4. Error Handling

```typescript
// In Domain Model
if (this.price < 0) {
  throw new BadRequestException('Price must be non-negative');
}

// In Service (orchestration errors)
try {
  await this.externalService.notify();
} catch (error) {
  throw new ServiceUnavailableException('Notification failed');
}

// In Repository (data errors)
try {
  await this.knex(this.tableName).insert(entity);
} catch (error) {
  if (error.code === '23505') { // Unique violation
    throw new ConflictException('Entity already exists');
  }
  throw error;
}
```

---

## Common Patterns

### Pattern 1: State Machine

```typescript
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
}

export class OrderModel extends BaseDomainModel<IOrder> {
  confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Can only confirm pending orders');
    }
    this.status = OrderStatus.CONFIRMED;
    this.updatedAt = new Date();
  }

  ship(): void {
    if (this.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('Can only ship confirmed orders');
    }
    this.status = OrderStatus.SHIPPED;
    this.updatedAt = new Date();
  }
}
```

### Pattern 2: Value Objects

```typescript
class Money {
  constructor(
    private readonly amount: number,
    private readonly currency: string = 'USD'
  ) {
    if (amount < 0) throw new Error('Amount cannot be negative');
  }

  add(other: Money): Money {
    if (other.currency !== this.currency) {
      throw new Error('Currency mismatch');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  getAmount(): number { return this.amount; }
}

export class ProductModel {
  private price: Money;

  updatePrice(newPrice: Money): void {
    this.price = newPrice;
    this.updatedAt = new Date();
  }
}
```

### Pattern 3: Domain Events

```typescript
export class OrderModel {
  private domainEvents: any[] = [];

  confirm(): void {
    this.status = OrderStatus.CONFIRMED;
    this.domainEvents.push({
      type: 'OrderConfirmed',
      orderId: this.id,
      timestamp: new Date(),
    });
  }

  getDomainEvents(): any[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}

// In service
async confirmOrder(id: string) {
  const order = await this.repository.findByIdOrThrow(id);
  order.confirm();
  await this.repository.save(order);

  // Handle events
  const events = order.getDomainEvents();
  for (const event of events) {
    await this.eventBus.publish(event);
  }
  order.clearDomainEvents();
}
```

### Pattern 4: Aggregate Root

```typescript
export class OrderModel extends BaseDomainModel<IOrder> {
  private items: OrderItem[] = [];

  addItem(productId: string, quantity: number, price: number): void {
    // Validate business rules
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    this.items.push({ productId, quantity, price });
    this.recalculateTotal();
    this.updatedAt = new Date();
  }

  removeItem(productId: string): void {
    this.items = this.items.filter(item => item.productId !== productId);
    this.recalculateTotal();
    this.updatedAt = new Date();
  }

  private recalculateTotal(): void {
    this.totalAmount = this.items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );
  }
}
```

---

## Testing Strategy

### 1. Domain Model Tests (Unit Tests)

```typescript
// product.model.spec.ts

describe('ProductModel', () => {
  describe('create', () => {
    it('should create valid product', () => {
      const product = ProductModel.create({
        id: 'uuid',
        name: 'iPhone',
        price: 999,
        stock: 50,
      });

      expect(product.getName()).toBe('iPhone');
      expect(product.getPrice()).toBe(999);
    });

    it('should throw if price is negative', () => {
      expect(() => {
        ProductModel.create({
          id: 'uuid',
          name: 'iPhone',
          price: -999,
          stock: 50,
        });
      }).toThrow('Price must be non-negative');
    });
  });

  describe('adjustStock', () => {
    it('should adjust stock correctly', () => {
      const product = ProductModel.create({
        id: 'uuid',
        name: 'iPhone',
        price: 999,
        stock: 50,
      });

      product.adjustStock(-10);
      expect(product.getStockQuantity()).toBe(40);
    });

    it('should throw if insufficient stock', () => {
      const product = ProductModel.create({
        id: 'uuid',
        name: 'iPhone',
        price: 999,
        stock: 5,
      });

      expect(() => {
        product.adjustStock(-10);
      }).toThrow('Insufficient stock');
    });
  });

  describe('applyDiscount', () => {
    it('should apply discount correctly', () => {
      const product = ProductModel.create({
        id: 'uuid',
        name: 'iPhone',
        price: 1000,
        stock: 50,
      });

      product.applyDiscount(20); // 20% off
      expect(product.getPrice()).toBe(800);
    });
  });
});
```

### 2. Repository Tests (Integration Tests)

```typescript
// product.repository.spec.ts

describe('ProductRepository', () => {
  let repository: ProductRepository;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    // Setup test database
    const module = await Test.createTestingModule({
      providers: [ProductRepository, DatabaseService],
    }).compile();

    repository = module.get(ProductRepository);
    databaseService = module.get(DatabaseService);
  });

  it('should save and find product', async () => {
    const product = ProductModel.create({
      id: 'test-uuid',
      name: 'Test Product',
      price: 100,
      stock: 10,
    });

    await repository.save(product);

    const found = await repository.findById('test-uuid');
    expect(found).toBeDefined();
    expect(found!.getName()).toBe('Test Product');
  });

  it('should find low stock products', async () => {
    // Create test data
    const lowStock = ProductModel.create({
      id: 'low-1',
      name: 'Low Stock',
      price: 100,
      stock: 5,
    });

    await repository.save(lowStock);

    const results = await repository.findLowStock(10);
    expect(results.length).toBeGreaterThan(0);
  });
});
```

### 3. Service Tests

```typescript
// product.service.spec.ts

describe('ProductService', () => {
  let service: ProductService;
  let repository: ProductRepository;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: ProductRepository,
          useValue: {
            save: jest.fn(),
            findByIdOrThrow: jest.fn(),
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(ProductService);
    repository = module.get(ProductRepository);
  });

  it('should create product', async () => {
    const dto = {
      name: 'iPhone',
      price: 999,
      stock_quantity: 50,
    };

    const result = await service.create(dto);

    expect(repository.save).toHaveBeenCalled();
    expect(result.name).toBe('iPhone');
  });

  it('should apply discount', async () => {
    const product = ProductModel.create({
      id: 'uuid',
      name: 'iPhone',
      price: 1000,
      stock: 50,
    });

    jest.spyOn(repository, 'findByIdOrThrow').mockResolvedValue(product);

    await service.applyDiscount('uuid', 20);

    expect(repository.save).toHaveBeenCalled();
    expect(product.getPrice()).toBe(800);
  });
});
```

---

## Migration from Anemic Model

### Before (Anemic Model with BaseKnexService)

```typescript
// ❌ Old way - Business logic in service
@Injectable()
export class ProductService extends BaseKnexService {
  async create(data: CreateProductDto) {
    // Validation in service ❌
    if (data.price < 0) {
      return { success: false, message: 'Price cannot be negative' };
    }

    // Direct database operation ❌
    return this.knex('products').insert(data);
  }

  async applyDiscount(id: string, percent: number) {
    const product = await this.findOne(id);

    // Business logic in service ❌
    if (percent < 0 || percent > 100) {
      throw new BadRequestException('Invalid discount');
    }

    const newPrice = product.price * (1 - percent / 100);
    return this.update(id, { price: newPrice });
  }
}
```

### After (Rich Domain Model)

```typescript
// ✅ New way - Business logic in model
export class ProductModel extends BaseDomainModel<IProduct> {
  applyDiscount(percent: number): void {
    if (percent < 0 || percent > 100) {
      throw new BadRequestException('Invalid discount');
    }
    this.price = this.price * (1 - percent / 100);
    this.updatedAt = new Date();
  }
}

@Injectable()
export class ProductService {
  async applyDiscount(id: string, percent: number) {
    const product = await this.repository.findByIdOrThrow(id);
    product.applyDiscount(percent); // ✅ Logic in model
    await this.repository.save(product);
    return product.toEntity();
  }
}
```

### Migration Checklist

- [ ] **Identify business rules** in current service
- [ ] **Extract business logic** to domain model
- [ ] **Create domain model** with factory methods
- [ ] **Implement repository** extending BaseDomainRepository
- [ ] **Update service** to use repository and domain model
- [ ] **Update tests** to test domain logic independently
- [ ] **Refactor controllers** if needed
- [ ] **Update module** to register new providers

---

## Troubleshooting

### Issue: "Model validation not working"

**Problem**: Business rules not enforced

**Solution**: Make sure you're using `create()` not `reconstitute()` for new instances

```typescript
// ❌ Wrong - skips validation
const product = ProductModel.reconstitute({ id: uuid(), price: -100, ... });

// ✅ Correct - validates
const product = ProductModel.create({ id: uuid(), price: -100, ... }); // Throws!
```

### Issue: "Repository save not working"

**Problem**: `save()` doesn't persist changes

**Solution**: Ensure `toEntity()` returns all fields correctly

```typescript
toEntity(): IProduct {
  return {
    id: this.id,
    name: this.name,
    price: this.price,
    stock_quantity: this.stockQuantity, // ✅ Map camelCase to snake_case
    // ... all fields
  };
}
```

### Issue: "Soft delete not working"

**Problem**: Deleted records still appear

**Solution**: Use `baseQuery()` in repository methods

```typescript
// ❌ Wrong - doesn't filter soft deletes
async findById(id: string) {
  const row = await this.knex(this.tableName).where('id', id).first();
}

// ✅ Correct - automatically filters soft deletes
async findById(id: string) {
  const row = await this.baseQuery().where('id', id).first();
}
```

### Issue: "Circular dependency error"

**Problem**: Module imports causing circular dependencies

**Solution**: Use `forwardRef()` or restructure dependencies

```typescript
@Module({
  imports: [forwardRef(() => OtherModule)],
  providers: [YourService],
})
export class YourModule {}
```

---

## FAQ

### Q: When should I use BaseDomainService?

**A**: Use `BaseDomainService` when you want standardized CRUD operations. It's optional - you can create services without extending it for more flexibility.

### Q: Can I use both patterns in the same project?

**A**: Yes! Use Rich Domain Model for complex domains and Anemic Model (BaseKnexService) for simple CRUD. They coexist peacefully.

### Q: How do I handle relationships between models?

**A**: Load related models in the service layer and pass them to domain model methods:

```typescript
async createOrder(dto: CreateOrderDto) {
  const customer = await this.customerRepo.findByIdOrThrow(dto.customerId);
  const items = await this.loadOrderItems(dto.items);

  const order = OrderModel.create({
    id: uuidv4(),
    customer,
    items,
  });

  await this.orderRepo.save(order);
}
```

### Q: Should I expose domain models to controllers?

**A**: No! Always convert to entities using `toEntity()`:

```typescript
// ❌ Wrong
return product; // Exposes domain model

// ✅ Correct
return product.toEntity(); // Returns plain object
```

### Q: How do I handle validation errors?

**A**: Throw `BadRequestException` in domain models for business rule violations:

```typescript
if (data.price < 0) {
  throw new BadRequestException('Price must be non-negative');
}
```

### Q: Can I use TypeORM/Prisma instead of Knex?

**A**: Yes! The pattern is ORM-agnostic. Just adapt the repository implementation to your ORM.

---

## Summary

### Key Takeaways

1. **Business logic belongs in domain models**, not services
2. **Services orchestrate**, they don't implement business rules
3. **Repositories handle data access**, keeping domain models pure
4. **Always use factory methods** (`create`, `reconstitute`)
5. **Never expose domain models** to API (use `toEntity()`)
6. **Test domain logic independently** without databases

### Next Steps

1. ✅ Review the Product example implementation
2. ✅ Identify a domain in your project that needs rich modeling
3. ✅ Follow the step-by-step guide
4. ✅ Write tests for your domain model
5. ✅ Migrate gradually, one domain at a time

### Resources

- 📘 [Domain Model Pattern Blueprint](./DOMAIN_MODEL_PATTERN_BLUEPRINT.md) - Comprehensive architectural guide
- 📁 [Product Implementation](./src/domains/products/) - Complete working example
- 🔧 [Base Infrastructure](./src/common/domain/) - Reusable base classes

---

**Happy Coding! 🚀**

For questions or improvements, please consult the architecture team or refer to the blueprint document.
