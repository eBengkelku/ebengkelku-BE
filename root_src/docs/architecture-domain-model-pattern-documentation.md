# Domain Model Pattern Blueprint

**Version**: 1.1
**Last Updated**: 2025-10-03
**Updated**: 2025-10-03 - Added Injectable Error Codes Pattern for i18n
**Author**: System Architecture Team
**Purpose**: Reusable blueprint for implementing Rich Domain Model pattern in nest-starter

---

## Table of Contents

- [Overview](#overview)
- [Architectural Vision](#architectural-vision)
- [Pattern Comparison](#pattern-comparison)
- [Blueprint Architecture](#blueprint-architecture)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Implementation Guide](#implementation-guide)
- [Migration Strategy](#migration-strategy)
- [Template Structure](#template-structure)
- [Best Practices](#best-practices)
- [Testing Strategy](#testing-strategy)
- [Examples](#examples)
- [FAQ](#faq)

---

## Overview

### What is This Blueprint?

This blueprint provides a **standardized, reusable framework** for implementing the **Rich Domain Model pattern** in the nest-starter repository. It allows domains to encapsulate complex business logic within domain models while maintaining backward compatibility with the existing Anemic Model pattern (BaseKnexService).

### Key Goals

✅ **Modular**: Each domain can independently choose to use Rich Domain Model
✅ **Flexible**: Supports both Anemic and Rich patterns in the same codebase
✅ **Reliable**: Type-safe with comprehensive validation
✅ **Maintainable**: Clear separation of concerns
✅ **Extendable**: Easy to add new domains and features
✅ **Scalable**: Handles complex business logic efficiently
✅ **Sustainable**: Future-proof architecture with clear patterns

### When to Use Domain Model Pattern?

| **Use Rich Domain Model** | **Use Anemic Model (BaseKnexService)** |
|---------------------------|----------------------------------------|
| ✅ Complex business rules and validation | ✅ Simple CRUD operations |
| ✅ State management with invariants | ✅ Minimal business logic |
| ✅ Time-based logic or calculations | ✅ Data-centric operations |
| ✅ Multiple interrelated business rules | ✅ Straightforward validation |
| ✅ Need to prevent invalid states | ✅ Rapid prototyping |
| ✅ Domain-driven design approach | ✅ Stateless data transformation |

**Examples**:
- **Rich Model**: Orders (state machine), Bookings (date validation, overlap), Promotion Banners (activation rules)
- **Anemic Model**: Products (basic CRUD), Files (upload/download), Categories (simple hierarchy)

---

## Architectural Vision

### Current State (Anemic Model)

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Request                         │
│              POST /v1/products                          │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Controller (ProductController)             │
│  - Validates DTO                                        │
│  - Delegates to Service                                 │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│           Service (ProductService extends               │
│                BaseKnexService)                         │
│  - ALL BUSINESS LOGIC HERE ⚠️                          │
│  - Validation                                           │
│  - Database Operations                                  │
│  - Business Rules                                       │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Database (Knex)                      │
└─────────────────────────────────────────────────────────┘
```

**Issues**:
- Business logic scattered in services
- No encapsulation of domain behavior
- Hard to test business rules in isolation
- Easy to create invalid states
- Difficult to enforce invariants

### Target State (Rich Domain Model)

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Request                         │
│              POST /v1/orders                            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Controller (OrderController)               │
│  - Validates DTO                                        │
│  - Delegates to Service                                 │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│           Service (OrderService)                        │
│  - Orchestration ONLY                                   │
│  - Transaction Management                               │
│  - Coordinates Domain Models & Repositories             │
└─────────────────────────────────────────────────────────┘
                           │
               ┌───────────┴───────────┐
               ▼                       ▼
┌────────────────────────┐  ┌────────────────────────────┐
│   Domain Model         │  │   Repository               │
│   (OrderModel)         │  │   (OrderRepository)        │
│                        │  │                            │
│ - Business Logic ✅    │  │ - Database Operations      │
│ - Validation Rules ✅  │  │ - Query Building           │
│ - State Management ✅  │  │ - Data Mapping             │
│ - Invariants ✅        │  │ - Returns Domain Models    │
└────────────────────────┘  └────────────────────────────┘
                                       │
                                       ▼
                           ┌────────────────────────────┐
                           │   Database (Knex)          │
                           └────────────────────────────┘
```

**Benefits**:
- Business logic encapsulated in domain models
- Impossible to create invalid objects
- Easy to test domain logic
- Single source of truth for business rules
- Clear separation of concerns

### Hybrid Approach (Both Patterns Coexist)

The blueprint supports **both patterns** in the same codebase:

```
src/domains/
├── products/              # Anemic Model (BaseKnexService)
│   ├── product.service.ts
│   └── product.controller.ts
│
├── orders/                # Rich Domain Model
│   ├── models/
│   │   └── order.model.ts
│   ├── repository/
│   │   └── order.repository.ts
│   ├── order.service.ts
│   └── order.controller.ts
│
└── files/                 # Anemic Model (BaseKnexService)
    ├── file.service.ts
    └── file.controller.ts
```

---

## Pattern Comparison

### Detailed Comparison Table

| **Aspect** | **Anemic Model (Current)** | **Rich Domain Model (Blueprint)** |
|------------|---------------------------|-----------------------------------|
| **Business Logic Location** | In Service Layer | In Domain Model |
| **Validation** | Service methods | Model factory & methods |
| **State Management** | Service handles state | Model encapsulates state |
| **Invariants** | Manual checks in service | Enforced by model |
| **Testability** | Need to mock database | Test model in isolation |
| **Complexity** | Simple, straightforward | More sophisticated |
| **Code Organization** | Service-centric | Domain-centric |
| **Type Safety** | Interface-based | Class-based with methods |
| **Encapsulation** | Low (public properties) | High (private properties, getters) |
| **Reusability** | Logic duplication risk | Business rules centralized |
| **Learning Curve** | Easy (familiar pattern) | Moderate (DDD concepts) |
| **Best For** | CRUD, simple operations | Complex business logic |

### Code Comparison Example

#### Anemic Model (Current)

```typescript
// ❌ Service handles ALL logic
export class ProductService extends BaseKnexService {
  async create(data: CreateProductDto) {
    // Validation in service
    if (data.price < 0) {
      throw new BadRequestException('Price must be positive');
    }
    if (data.stock < 0) {
      throw new BadRequestException('Stock must be positive');
    }
    if (data.discount > data.price) {
      throw new BadRequestException('Discount cannot exceed price');
    }

    // Direct database operation
    return this.knex('products').insert(data);
  }

  async applyDiscount(id: string, discountPercent: number) {
    const product = await this.findOne(id);

    // Business logic in service
    if (discountPercent < 0 || discountPercent > 100) {
      throw new BadRequestException('Invalid discount');
    }

    const discountAmount = product.price * (discountPercent / 100);
    if (discountAmount > product.price) {
      throw new BadRequestException('Discount exceeds price');
    }

    return this.update(id, {
      discount_percent: discountPercent,
      final_price: product.price - discountAmount
    });
  }
}
```

#### Rich Domain Model (Blueprint)

```typescript
// ✅ Model encapsulates business logic
export class ProductModel extends BaseDomainModel<IProduct> {
  private constructor(
    private id: string,
    private name: string,
    private price: number,
    private stock: number,
    private discountPercent: number = 0,
  ) {
    super();
  }

  static create(data: CreateProductData): ProductModel {
    // Validation in model
    if (data.price < 0) {
      throw new BadRequestException('Price must be positive');
    }
    if (data.stock < 0) {
      throw new BadRequestException('Stock must be positive');
    }

    return new ProductModel(
      data.id,
      data.name,
      data.price,
      data.stock,
      0
    );
  }

  applyDiscount(discountPercent: number): void {
    // Business logic in model
    if (discountPercent < 0 || discountPercent > 100) {
      throw new BadRequestException('Invalid discount');
    }

    const discountAmount = this.price * (discountPercent / 100);
    if (discountAmount > this.price) {
      throw new BadRequestException('Discount exceeds price');
    }

    this.discountPercent = discountPercent;
    this.updatedAt = new Date();
  }

  getFinalPrice(): number {
    return this.price - (this.price * (this.discountPercent / 100));
  }

  // Model is self-contained and testable!
}

// ✅ Service is thin, just orchestrates
export class ProductService {
  async create(data: CreateProductDto) {
    const product = ProductModel.create({ ...data, id: uuidv4() });
    await this.repository.save(product);
    return product.toEntity();
  }

  async applyDiscount(id: string, discountPercent: number) {
    const product = await this.repository.findByIdOrThrow(id);
    product.applyDiscount(discountPercent); // Business logic in model!
    await this.repository.save(product);
    return product.toEntity();
  }
}
```

---

## Blueprint Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Layer 1: API                        │
│                   (Controllers)                         │
│  - HTTP Request/Response handling                       │
│  - DTO validation                                       │
│  - Route definitions                                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              Layer 2: Application Services              │
│                   (Services)                            │
│  - Use case orchestration                               │
│  - Transaction management                               │
│  - External service coordination                        │
│  - Domain model → Entity conversion                     │
└─────────────────────────────────────────────────────────┘
                           │
               ┌───────────┴───────────┐
               ▼                       ▼
┌────────────────────────┐  ┌────────────────────────────┐
│   Layer 3a: Domain     │  │  Layer 3b: Persistence     │
│   (Domain Models)      │  │  (Repositories)            │
│                        │  │                            │
│ - Business logic       │  │ - Database queries         │
│ - Validation rules     │  │ - Data mapping             │
│ - State management     │  │ - Transaction support      │
│ - Invariants           │  │ - Query optimization       │
│ - Domain behavior      │  │                            │
└────────────────────────┘  └────────────────────────────┘
                                       │
                                       ▼
                           ┌────────────────────────────┐
                           │   Layer 4: Database        │
                           │   (Knex.js)                │
                           └────────────────────────────┘
```

### Component Interaction Flow

```
┌─────────────────────────────────────────────────────────┐
│                   Client Application                     │
└─────────────────────────────────────────────────────────┘
                           │
                   HTTP Request (JSON/FormData)
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    NestJS Controller                     │
│  @Post('/orders')                                       │
│  create(@Body() dto: CreateOrderDto)                    │
└─────────────────────────────────────────────────────────┘
                           │
                    Validated DTO
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   Application Service                    │
│  async create(dto: CreateOrderDto) {                    │
│    const order = OrderModel.create(...)  ←─────┐       │
│    await repository.save(order)                 │       │
│    return order.toEntity()                      │       │
│  }                                              │       │
└─────────────────────────────────────────────────────────┘
                           │                      │
                           │                      │
         ┌─────────────────┴──────────┐          │
         ▼                            ▼           │
┌──────────────────┐         ┌──────────────────────────┐
│   Repository     │         │   Domain Model           │
│                  │         │                          │
│ save(model) {    │         │ static create(data) {    │
│   entity =       │         │   // Validation          │
│     model        │◄────────│   if (invalid) throw     │
│     .toEntity()  │         │                          │
│   knex.insert(   │         │   return new Model(...)  │
│     entity)      │         │ }                        │
│ }                │         │                          │
│                  │         │ businessMethod() {       │
│ findById(id) {   │         │   // Business logic      │
│   row = await    │         │   this.state = ...       │
│     knex         │         │ }                        │
│     .where(...)  │         │                          │
│   return Model   │─────────│ toEntity() {             │
│     .reconstitute│         │   return { ... }         │
│     (row)        │         │ }                        │
│ }                │         └──────────────────────────┘
└──────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────┐
│              Database (PostgreSQL)                    │
└──────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Base Domain Model (Abstract Class)

**Location**: `src/common/domain/base-domain.model.ts`

```typescript
/**
 * Abstract base class for all domain models
 * Provides common functionality and enforces pattern
 */
export abstract class BaseDomainModel<T = any> {
  /**
   * Convert domain model to entity (for database/API)
   * Must be implemented by each domain model
   */
  abstract toEntity(): T;

  /**
   * Create new instance (factory method)
   * Must be implemented as static method in child class
   *
   * Example:
   * static create(data: CreateOrderData): OrderModel {
   *   // Validation
   *   // Return new instance
   * }
   */
  // static create(data: any): DomainModel

  /**
   * Reconstitute from database (factory method)
   * Must be implemented as static method in child class
   *
   * Example:
   * static reconstitute(data: IOrder): OrderModel {
   *   return new OrderModel(...)
   * }
   */
  // static reconstitute(data: T): DomainModel
}
```

**Purpose**:
- Enforce common interface for all domain models
- Provide type safety
- Standardize factory pattern
- Enable polymorphism

### 2. Base Repository (Abstract Class)

**Location**: `src/common/domain/base-domain.repository.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { DatabaseService } from '../../database/database.service';
import { BaseDomainModel } from './base-domain.model';
import { DomainRepositoryConfig, DEFAULT_DOMAIN_REPOSITORY_CONFIG } from './domain-repository.config';

/**
 * Abstract base repository for domain models
 * Handles common persistence operations
 */
export abstract class BaseDomainRepository<
  TModel extends BaseDomainModel<TEntity>,
  TEntity = any
> {
  protected abstract readonly tableName: string;
  protected config: DomainRepositoryConfig;

  protected get knex(): Knex {
    return this.databaseService.getKnex();
  }

  constructor(
    protected readonly databaseService: DatabaseService,
    config: Partial<DomainRepositoryConfig>
  ) {
    this.config = {
      ...DEFAULT_DOMAIN_REPOSITORY_CONFIG,
      ...config,
    } as DomainRepositoryConfig;
  }

  /**
   * Save model (insert or update)
   * Handles upsert pattern automatically
   */
  async save(model: TModel): Promise<void> {
    const entity = model.toEntity();
    const exists = await this.exists(entity[this.config.primaryKey]);

    if (exists) {
      await this.update(entity);
    } else {
      await this.insert(entity);
    }
  }

  /**
   * Find by ID, return null if not found
   */
  abstract findById(id: string | number): Promise<TModel | null>;

  /**
   * Find by ID, throw if not found
   */
  async findByIdOrThrow(id: string | number): Promise<TModel> {
    const model = await this.findById(id);
    if (!model) {
      throw new NotFoundException(
        `${this.config.entityName} with id ${id} not found`
      );
    }
    return model;
  }

  /**
   * Find all with pagination
   */
  abstract findAll(pagination: { page: number; limit: number }): Promise<{
    data: TModel[];
    total: number;
  }>;

  /**
   * Delete (soft or hard based on configuration)
   */
  async delete(id: string | number): Promise<void> {
    if (this.config.softDelete) {
      await this.softDelete(id);
    } else {
      await this.hardDelete(id);
    }
  }

  // Protected helper methods that must be implemented
  protected abstract insert(entity: TEntity): Promise<void>;
  protected abstract update(entity: TEntity): Promise<void>;
  protected abstract exists(id: string | number): Promise<boolean>;
  protected abstract softDelete(id: string | number): Promise<void>;
  protected abstract hardDelete(id: string | number): Promise<void>;

  /**
   * Helper method to build base query with soft delete check
   */
  protected baseQuery(): Knex.QueryBuilder {
    let query = this.knex(this.tableName);

    if (this.config.softDelete && this.config.timestampColumns?.deleted) {
      query = query.whereNull(this.config.timestampColumns.deleted);
    }

    return query;
  }
}
```

**Purpose**:
- Standardize repository pattern
- Handle common persistence operations
- Support both soft and hard delete
- Type-safe model handling
- Reduce boilerplate code

### 3. Domain Repository Configuration

**Location**: `src/common/domain/domain-repository.config.ts`

```typescript
/**
 * Configuration interface for domain repositories
 */
export interface DomainRepositoryConfig {
  /** Entity name for error messages and logging */
  entityName: string;

  /** Database table name */
  tableName: string;

  /** Primary key column name */
  primaryKey: string;

  /** Timestamp column names */
  timestampColumns: {
    created: string;
    updated: string;
    deleted?: string;
  };

  /** Enable soft delete functionality */
  softDelete: boolean;

  /** Columns used for search/combo queries */
  descColumns: string[];
}

/**
 * Default configuration values
 * Can be overridden per repository
 */
export const DEFAULT_DOMAIN_REPOSITORY_CONFIG: Partial<DomainRepositoryConfig> = {
  primaryKey: 'id',
  timestampColumns: {
    created: 'created_at',
    updated: 'updated_at',
    deleted: 'deleted_at',
  },
  softDelete: true,
  descColumns: ['name'],
};
```

**Purpose**:
- Centralize repository configuration
- Provide sensible defaults
- Enable easy customization
- Type safety for configuration

### 4. Domain Service Base (Optional)

**Location**: `src/common/domain/base-domain.service.ts`

```typescript
import { BaseDomainModel } from './base-domain.model';
import { BaseDomainRepository } from './base-domain.repository';

/**
 * Optional base class for domain services
 * Provides common service patterns
 * Use when you want standardized service methods
 */
export abstract class BaseDomainService<
  TModel extends BaseDomainModel<TEntity>,
  TRepository extends BaseDomainRepository<TModel, TEntity>,
  TEntity = any
> {
  constructor(protected readonly repository: TRepository) {}

  /**
   * Create new entity
   * Delegates to buildModel for domain-specific creation logic
   */
  async create(data: any): Promise<TEntity> {
    const model = await this.buildModel(data);
    await this.repository.save(model);
    return model.toEntity();
  }

  /**
   * Find by ID
   */
  async findById(id: string | number): Promise<TEntity> {
    const model = await this.repository.findByIdOrThrow(id);
    return model.toEntity();
  }

  /**
   * Find all with pagination
   */
  async findAll(pagination: { page: number; limit: number }): Promise<{
    data: TEntity[];
    total: number;
  }> {
    const result = await this.repository.findAll(pagination);
    return {
      data: result.data.map(model => model.toEntity()),
      total: result.total,
    };
  }

  /**
   * Update entity
   */
  async update(id: string | number, data: any): Promise<TEntity> {
    const model = await this.repository.findByIdOrThrow(id);
    await this.updateModel(model, data);
    await this.repository.save(model);
    return model.toEntity();
  }

  /**
   * Delete entity
   */
  async delete(id: string | number): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Build model from data (must be implemented)
   * This is where domain-specific creation logic goes
   */
  protected abstract buildModel(data: any): Promise<TModel> | TModel;

  /**
   * Update model with new data (must be implemented)
   * This is where domain-specific update logic goes
   */
  protected abstract updateModel(model: TModel, data: any): Promise<void> | void;
}
```

**Purpose**:
- Provide common service patterns
- Reduce boilerplate in services
- Standardize CRUD operations
- Optional (can create custom services without extending)

---

## Data Flow

### Creation Flow

```
1. HTTP POST Request
   └─> Controller receives CreateDTO
       └─> Validates DTO (class-validator)
           └─> Calls Service.create(dto)

2. Service Layer
   └─> Fetches dependencies (if needed)
       - Check related entities exist
       - Fetch data for validation
   └─> Calls DomainModel.create(data)

3. Domain Model
   └─> Validates business rules
       - Check invariants
       - Validate relationships
       - Enforce constraints
   └─> Creates model instance
   └─> Returns: DomainModel

4. Service Layer (continued)
   └─> Additional validations (if needed)
       - Check overlaps with existing data
       - Validate against external systems
   └─> Calls Repository.save(model)

5. Repository Layer
   └─> Converts: model.toEntity() → Entity
   └─> Checks if exists
       - Query by ID
   └─> Inserts to database
       - Uses Knex to insert
   └─> Returns: void

6. Service Layer (continued)
   └─> Converts: model.toEntity() → Entity
   └─> Returns to Controller

7. Controller
   └─> Returns HTTP Response (Entity)
```

### Update Flow

```
1. HTTP PUT Request
   └─> Controller receives UpdateDTO + ID
       └─> Validates DTO
           └─> Calls Service.update(id, dto)

2. Service Layer
   └─> Calls Repository.findByIdOrThrow(id)

3. Repository Layer
   └─> Queries database with soft delete check
   └─> Converts: row → DomainModel (reconstitute)
   └─> Throws NotFoundException if not found
   └─> Returns: DomainModel

4. Service Layer (continued)
   └─> Calls model.update(data)

5. Domain Model
   └─> Validates business rules
       - Check new values are valid
       - Maintain invariants
   └─> Updates internal state
       - Only updates provided fields
   └─> Auto-updates timestamps
       - updatedAt = new Date()
   └─> Returns: void

6. Service Layer (continued)
   └─> Additional validations (if needed)
   └─> Calls Repository.save(model)

7. Repository Layer
   └─> Converts: model.toEntity() → Entity
   └─> Updates database (by ID)
   └─> Returns: void

8. Service Layer (continued)
   └─> Returns: model.toEntity()

9. Controller
   └─> Returns HTTP Response
```

### Query Flow

```
1. HTTP GET Request
   └─> Controller receives ID
       └─> Calls Service.findById(id)

2. Service Layer
   └─> Calls Repository.findByIdOrThrow(id)

3. Repository Layer
   └─> Queries database
       - Apply soft delete check
       - WHERE id = ? AND deleted_at IS NULL
   └─> Converts: row → DomainModel (reconstitute)
   └─> Returns: DomainModel

4. Service Layer (continued)
   └─> Can call domain model query methods
       - model.isActive()
       - model.canBeModified()
   └─> Calls model.toEntity()
   └─> Returns: Entity

5. Controller
   └─> Returns HTTP Response (Entity)
```

### Business Method Flow

```
1. HTTP POST /orders/:id/confirm
   └─> Controller calls Service.confirm(id)

2. Service Layer
   └─> Repository.findByIdOrThrow(id)
   └─> Gets: OrderModel

3. Domain Model
   └─> orderModel.confirm()
       - Validates: status must be PENDING
       - Validates: can be confirmed (business rules)
       - Updates: status = CONFIRMED
       - Updates: updatedAt = now
   └─> Returns: void

4. Service Layer
   └─> Repository.save(orderModel)
   └─> Returns: orderModel.toEntity()

5. Controller
   └─> Returns HTTP Response
```

---

## Implementation Guide

### Step-by-Step: Adding Domain Model to New Domain

#### Step 1: Create Domain Model

**File**: `src/domains/orders/models/order.model.ts`

```typescript
import { BadRequestException } from '@nestjs/common';
import { BaseDomainModel } from '../../../common/domain/base-domain.model';
import { Order as IOrder } from '../interfaces/order.interface';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export class OrderModel extends BaseDomainModel<IOrder> {
  // Private constructor prevents direct instantiation
  private constructor(
    private id: string,
    private customerId: string,
    private totalAmount: number,
    private status: OrderStatus,
    private items: OrderItem[],
    private createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null,
  ) {
    super();
  }

  /**
   * Factory method for creating new orders
   * Validates business rules before creation
   */
  static create(data: {
    id: string;
    customerId: string;
    totalAmount: number;
    items: OrderItem[];
  }): OrderModel {
    // Business rule: Total amount must be positive
    if (data.totalAmount <= 0) {
      throw new BadRequestException('Total amount must be positive');
    }

    // Business rule: Must have at least one item
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    // Business rule: Total must match sum of items
    const calculatedTotal = data.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (Math.abs(calculatedTotal - data.totalAmount) > 0.01) {
      throw new BadRequestException(
        `Total amount mismatch. Expected: ${calculatedTotal}, Got: ${data.totalAmount}`
      );
    }

    const now = new Date();
    return new OrderModel(
      data.id,
      data.customerId,
      data.totalAmount,
      OrderStatus.PENDING,
      data.items,
      now,
      now,
      null
    );
  }

  /**
   * Factory method for reconstituting from database
   * No validation needed - data already validated
   */
  static reconstitute(data: IOrder): OrderModel {
    return new OrderModel(
      data.id,
      data.customer_id,
      data.total_amount,
      data.status as OrderStatus,
      data.items || [],
      data.created_at,
      data.updated_at,
      data.deleted_at || null
    );
  }

  /**
   * Business method: Confirm order
   * Can only confirm pending orders
   */
  confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        `Cannot confirm order in ${this.status} status`
      );
    }

    this.status = OrderStatus.CONFIRMED;
    this.updatedAt = new Date();
  }

  /**
   * Business method: Cancel order
   * Cannot cancel delivered orders
   */
  cancel(): void {
    if (this.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel delivered order');
    }

    this.status = OrderStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  /**
   * Business method: Ship order
   * Can only ship confirmed orders
   */
  ship(): void {
    if (this.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException('Can only ship confirmed orders');
    }

    this.status = OrderStatus.SHIPPED;
    this.updatedAt = new Date();
  }

  /**
   * Business method: Mark as delivered
   * Can only deliver shipped orders
   */
  deliver(): void {
    if (this.status !== OrderStatus.SHIPPED) {
      throw new BadRequestException('Can only deliver shipped orders');
    }

    this.status = OrderStatus.DELIVERED;
    this.updatedAt = new Date();
  }

  /**
   * Query method: Check if order can be cancelled
   */
  canBeCancelled(): boolean {
    return this.status !== OrderStatus.DELIVERED;
  }

  /**
   * Query method: Check if order is pending
   */
  isPending(): boolean {
    return this.status === OrderStatus.PENDING;
  }

  /**
   * Query method: Check if order is delivered
   */
  isDelivered(): boolean {
    return this.status === OrderStatus.DELIVERED;
  }

  /**
   * Update method: Update order details
   * Only allows updating certain fields
   */
  update(data: {
    totalAmount?: number;
    items?: OrderItem[];
  }): void {
    // Cannot update delivered orders
    if (this.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot update delivered order');
    }

    if (data.totalAmount !== undefined) {
      if (data.totalAmount <= 0) {
        throw new BadRequestException('Total amount must be positive');
      }
      this.totalAmount = data.totalAmount;
    }

    if (data.items !== undefined) {
      if (data.items.length === 0) {
        throw new BadRequestException('Order must have at least one item');
      }
      this.items = data.items;
    }

    this.updatedAt = new Date();
  }

  /**
   * Convert domain model to entity (for database/API)
   */
  toEntity(): IOrder {
    return {
      id: this.id,
      customer_id: this.customerId,
      total_amount: this.totalAmount,
      status: this.status,
      items: this.items,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      deleted_at: this.deletedAt || undefined,
    };
  }

  // Getters (read-only access to properties)
  getId(): string { return this.id; }
  getCustomerId(): string { return this.customerId; }
  getTotalAmount(): number { return this.totalAmount; }
  getStatus(): OrderStatus { return this.status; }
  getItems(): OrderItem[] { return [...this.items]; } // Return copy
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
  getDeletedAt(): Date | null { return this.deletedAt; }
}
```

#### Step 2: Create Repository

**File**: `src/domains/orders/repository/order.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { BaseDomainRepository } from '../../../common/domain/base-domain.repository';
import { DatabaseService } from '../../../database/database.service';
import { OrderModel } from '../models/order.model';
import { Order as IOrder } from '../interfaces/order.interface';

@Injectable()
export class OrderRepository extends BaseDomainRepository<OrderModel, IOrder> {
  protected tableName = 'orders';

  constructor(databaseService: DatabaseService) {
    super(databaseService, {
      entityName: 'Order',
      tableName: 'orders',
      primaryKey: 'id',
      timestampColumns: {
        created: 'created_at',
        updated: 'updated_at',
        deleted: 'deleted_at',
      },
      softDelete: true,
      descColumns: ['id', 'customer_id'],
    });
  }

  /**
   * Find order by ID
   * Returns null if not found
   */
  async findById(id: string): Promise<OrderModel | null> {
    const row = await this.baseQuery()
      .where('id', id)
      .first();

    if (!row) {
      return null;
    }

    return OrderModel.reconstitute(row);
  }

  /**
   * Find all orders with pagination
   */
  async findAll(pagination: { page: number; limit: number }): Promise<{
    data: OrderModel[];
    total: number;
  }> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    // Count total
    const countQuery = this.baseQuery();
    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count as string, 10);

    // Get data
    const rows = await this.baseQuery()
      .orderBy(this.config.timestampColumns.created, 'desc')
      .limit(limit)
      .offset(offset);

    const data = rows.map(row => OrderModel.reconstitute(row));

    return { data, total };
  }

  /**
   * Custom query: Find orders by customer ID
   */
  async findByCustomerId(customerId: string): Promise<OrderModel[]> {
    const rows = await this.baseQuery()
      .where('customer_id', customerId)
      .orderBy(this.config.timestampColumns.created, 'desc');

    return rows.map(row => OrderModel.reconstitute(row));
  }

  /**
   * Custom query: Find orders by status
   */
  async findByStatus(status: string): Promise<OrderModel[]> {
    const rows = await this.baseQuery()
      .where('status', status)
      .orderBy(this.config.timestampColumns.created, 'desc');

    return rows.map(row => OrderModel.reconstitute(row));
  }

  /**
   * Custom query: Find pending orders
   */
  async findPendingOrders(): Promise<OrderModel[]> {
    return this.findByStatus('pending');
  }

  /**
   * Custom query: Get order statistics
   */
  async getOrderStats(): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  }> {
    const stats = await this.baseQuery()
      .select('status')
      .count('* as count')
      .groupBy('status');

    const result = {
      total: 0,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    stats.forEach(stat => {
      const count = parseInt(stat.count as string, 10);
      result[stat.status] = count;
      result.total += count;
    });

    return result;
  }

  // Protected methods (required by base class)

  protected async insert(entity: IOrder): Promise<void> {
    await this.knex(this.tableName).insert(entity);
  }

  protected async update(entity: IOrder): Promise<void> {
    await this.knex(this.tableName)
      .where(this.config.primaryKey, entity.id)
      .update({
        ...entity,
        [this.config.timestampColumns.updated]: new Date(),
      });
  }

  protected async exists(id: string): Promise<boolean> {
    const row = await this.knex(this.tableName)
      .where(this.config.primaryKey, id)
      .first();
    return !!row;
  }

  protected async softDelete(id: string): Promise<void> {
    await this.knex(this.tableName)
      .where(this.config.primaryKey, id)
      .update({
        [this.config.timestampColumns.deleted]: new Date(),
      });
  }

  protected async hardDelete(id: string): Promise<void> {
    await this.knex(this.tableName)
      .where(this.config.primaryKey, id)
      .delete();
  }
}
```

#### Step 3: Create/Update Service

**File**: `src/domains/orders/order.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { OrderRepository } from './repository/order.repository';
import { OrderModel } from './models/order.model';
import { CreateOrderDto, UpdateOrderDto } from './dto';
import { v4 as uuidv4 } from 'uuid';
import { Knex } from 'knex';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class OrderService {
  private get knex(): Knex {
    return this.databaseService.getKnex();
  }

  constructor(
    private readonly repository: OrderRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Create new order
   */
  async create(dto: CreateOrderDto) {
    // Create domain model with business logic validation
    const order = OrderModel.create({
      id: uuidv4(),
      customerId: dto.customer_id,
      totalAmount: dto.total_amount,
      items: dto.items,
    });

    // Persist to database
    await this.repository.save(order);

    // Return entity (for API response)
    return order.toEntity();
  }

  /**
   * Find order by ID
   */
  async findById(id: string) {
    const order = await this.repository.findByIdOrThrow(id);
    return order.toEntity();
  }

  /**
   * Find all orders with pagination
   */
  async findAll(pagination: { page: number; limit: number }) {
    const result = await this.repository.findAll(pagination);
    return {
      data: result.data.map(order => order.toEntity()),
      total: result.total,
    };
  }

  /**
   * Update order
   */
  async update(id: string, dto: UpdateOrderDto) {
    const order = await this.repository.findByIdOrThrow(id);

    // Business logic in model
    order.update({
      totalAmount: dto.total_amount,
      items: dto.items,
    });

    await this.repository.save(order);
    return order.toEntity();
  }

  /**
   * Confirm order
   */
  async confirmOrder(id: string) {
    const order = await this.repository.findByIdOrThrow(id);

    // Business logic in model
    order.confirm();

    await this.repository.save(order);
    return order.toEntity();
  }

  /**
   * Cancel order
   */
  async cancelOrder(id: string) {
    const order = await this.repository.findByIdOrThrow(id);
    order.cancel();
    await this.repository.save(order);
    return order.toEntity();
  }

  /**
   * Ship order
   */
  async shipOrder(id: string) {
    const order = await this.repository.findByIdOrThrow(id);
    order.ship();
    await this.repository.save(order);
    return order.toEntity();
  }

  /**
   * Deliver order
   */
  async deliverOrder(id: string) {
    const order = await this.repository.findByIdOrThrow(id);
    order.deliver();
    await this.repository.save(order);
    return order.toEntity();
  }

  /**
   * Find orders by customer
   */
  async findByCustomerId(customerId: string) {
    const orders = await this.repository.findByCustomerId(customerId);
    return orders.map(order => order.toEntity());
  }

  /**
   * Get order statistics
   */
  async getOrderStats() {
    return this.repository.getOrderStats();
  }

  /**
   * Delete order (soft delete)
   */
  async delete(id: string) {
    await this.repository.delete(id);
  }
}
```

#### Step 4: Create Controller

**File**: `src/domains/orders/order.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto, UpdateOrderDto } from './dto';

@Controller('v1/orders')
@ApiTags('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @ApiOperation({ summary: 'Create new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid order data' })
  async create(@Body() dto: CreateOrderDto) {
    return this.orderService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.orderService.findAll({ page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findById(@Param('id') id: string) {
    return this.orderService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.orderService.update(id, dto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order confirmed successfully' })
  @ApiResponse({ status: 400, description: 'Cannot confirm order' })
  async confirm(@Param('id') id: string) {
    return this.orderService.confirmOrder(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel order' })
  async cancel(@Param('id') id: string) {
    return this.orderService.cancelOrder(id);
  }

  @Post(':id/ship')
  @ApiOperation({ summary: 'Ship order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order shipped successfully' })
  @ApiResponse({ status: 400, description: 'Cannot ship order' })
  async ship(@Param('id') id: string) {
    return this.orderService.shipOrder(id);
  }

  @Post(':id/deliver')
  @ApiOperation({ summary: 'Mark order as delivered' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order delivered successfully' })
  @ApiResponse({ status: 400, description: 'Cannot deliver order' })
  async deliver(@Param('id') id: string) {
    return this.orderService.deliverOrder(id);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: 'Get orders by customer ID' })
  @ApiParam({ name: 'customerId', description: 'Customer ID' })
  async findByCustomer(@Param('customerId') customerId: string) {
    return this.orderService.findByCustomerId(customerId);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get order statistics' })
  async getStats() {
    return this.orderService.getOrderStats();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully' })
  async delete(@Param('id') id: string) {
    await this.orderService.delete(id);
    return { message: 'Order deleted successfully' };
  }
}
```

#### Step 5: Register in Module

**File**: `src/domains/orders/order.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './repository/order.repository';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository],
  exports: [OrderService, OrderRepository],
})
export class OrderModule {}
```

#### Step 6: Create Interface

**File**: `src/domains/orders/interfaces/order.interface.ts`

```typescript
export interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: string;
  items: OrderItem[];
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}
```

#### Step 7: Create DTOs

**File**: `src/domains/orders/dto/create-order.dto.ts`

```typescript
import { IsNotEmpty, IsNumber, IsString, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OrderItemDto {
  @ApiProperty({ example: 'prod-123' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 99.99 })
  @IsNumber()
  @Min(0)
  price: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'cust-123' })
  @IsString()
  @IsNotEmpty()
  customer_id: string;

  @ApiProperty({ example: 199.98 })
  @IsNumber()
  @Min(0)
  total_amount: number;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
```

**File**: `src/domains/orders/dto/update-order.dto.ts`

```typescript
import { IsOptional, IsNumber, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ example: 299.98 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  total_amount?: number;

  @ApiPropertyOptional({ type: [OrderItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];
}
```

---

## Migration Strategy

### Phase 1: Foundation (Week 1-2)

**Goal**: Establish base infrastructure

**Tasks**:

1. **Create Base Classes**
   - [ ] Create `src/common/domain/base-domain.model.ts`
   - [ ] Create `src/common/domain/base-domain.repository.ts`
   - [ ] Create `src/common/domain/base-domain.service.ts` (optional)
   - [ ] Create `src/common/domain/domain-repository.config.ts`
   - [ ] Create `src/common/domain/index.ts` (barrel export)
   - [ ] Add comprehensive JSDoc documentation

2. **Create Examples**
   - [ ] Implement example domain in `examples/domain-model-orders/`
   - [ ] Document patterns and best practices
   - [ ] Create unit tests for example domain
   - [ ] Create integration tests

3. **Update Documentation**
   - [ ] Finalize this blueprint document
   - [ ] Create quick start guide
   - [ ] Create migration checklist
   - [ ] Create video tutorial (optional)

**Deliverables**:
- ✅ Base classes implemented and tested
- ✅ Example domain working
- ✅ Documentation complete

### Phase 2: Pilot Domain (Week 3-4)

**Goal**: Migrate one complex domain to validate pattern

**Tasks**:

1. **Select Pilot Domain**
   - Criteria: Complex business logic, state management needed
   - Options: Orders, Bookings, Reservations, Workflows
   - Recommended: **Orders** (common, well-understood, complex state machine)

2. **Implement Rich Model**
   - [ ] Analyze existing business rules
   - [ ] Design domain model (state diagram, business rules)
   - [ ] Create domain model class
   - [ ] Create repository
   - [ ] Update service to use repository
   - [ ] Update tests (model tests, repository tests, service tests)
   - [ ] Verify all functionality works

3. **Validate & Refine**
   - Collect team feedback
   - Measure code quality improvements
   - Refine base classes if needed
   - Update documentation based on learnings

**Deliverables**:
- ✅ Pilot domain migrated successfully
- ✅ Team trained on pattern
- ✅ Feedback incorporated

### Phase 3: Gradual Migration (Week 5+)

**Goal**: Migrate additional domains as needed

**Tasks**:

1. **Prioritize Domains**
   - High priority: Complex business logic domains
   - Medium priority: Moderate complexity domains
   - Low priority: Simple CRUD domains (can stay with BaseKnexService)

2. **Migration Checklist** (per domain)
   - [ ] Analyze business rules and complexity
   - [ ] Decide: Rich Model vs Anemic Model
   - [ ] Design domain model (if Rich Model)
   - [ ] Implement model + repository
   - [ ] Update service
   - [ ] Update tests
   - [ ] Code review
   - [ ] Deploy & monitor

3. **Coexistence Strategy**
   - Keep both patterns working in parallel
   - No forced migration of simple domains
   - Teams choose based on domain complexity
   - Document decision criteria

**Deliverables**:
- ✅ Critical domains migrated
- ✅ Both patterns coexisting smoothly
- ✅ Team comfortable with pattern selection

### Migration Decision Matrix

Use this matrix to decide whether to migrate a domain to Rich Model:

| Domain Characteristic | Score | Pattern Recommendation |
|-----------------------|-------|------------------------|
| **Simple CRUD only** | 0 | Anemic Model |
| **1-2 simple business rules** | 1 | Anemic Model |
| **3-5 business rules** | 2 | Consider Rich Model |
| **6+ business rules** | 3 | Rich Model ✅ |
| **State machine (status transitions)** | +2 | Rich Model ✅ |
| **Date/time validations** | +1 | Rich Model ✅ |
| **Overlap/conflict detection** | +2 | Rich Model ✅ |
| **Calculated fields** | +1 | Rich Model ✅ |
| **Complex validation logic** | +2 | Rich Model ✅ |
| **Multiple invariants** | +2 | Rich Model ✅ |

**Scoring**:
- **0-1**: Use Anemic Model (BaseKnexService)
- **2-3**: Either pattern works, prefer Anemic for simplicity
- **4+**: Use Rich Domain Model

**Examples**:
- **Products** (score 1): Anemic Model ✅
- **Files** (score 0): Anemic Model ✅
- **Orders** (score 7): Rich Model ✅
- **Bookings** (score 8): Rich Model ✅
- **Promotion Banners** (score 6): Rich Model ✅

---

## Template Structure

### Directory Structure Template

```
src/domains/{domain-name}/
├── models/
│   └── {entity}.model.ts          # Domain model with business logic
│
├── repository/
│   └── {entity}.repository.ts     # Persistence layer
│
├── dto/
│   ├── create-{entity}.dto.ts     # Create DTO
│   ├── update-{entity}.dto.ts     # Update DTO
│   └── {entity}-filter.dto.ts     # Filter DTO (optional)
│
├── interfaces/
│   └── {entity}.interface.ts      # Entity interface (database schema)
│
├── __tests__/
│   ├── {entity}.model.spec.ts     # Model unit tests
│   ├── {entity}.repository.spec.ts # Repository integration tests
│   ├── {entity}.service.spec.ts   # Service tests
│   └── {entity}.controller.spec.ts # Controller E2E tests
│
├── {entity}.service.ts             # Application service
├── {entity}.controller.ts          # HTTP controller
└── {entity}.module.ts              # NestJS module
```

### File Templates

#### Model Template

```typescript
// src/domains/{domain}/models/{entity}.model.ts

import { BaseDomainModel } from '../../../common/domain/base-domain.model';
import { {Entity} as I{Entity} } from '../interfaces/{entity}.interface';
import { BadRequestException } from '@nestjs/common';

export class {Entity}Model extends BaseDomainModel<I{Entity}> {
  private constructor(
    private id: string,
    // Add your properties here
    private createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null,
  ) {
    super();
  }

  /**
   * Factory method for creating new instances
   * Validates business rules before creation
   */
  static create(data: {
    id: string;
    // Add your creation data properties
  }): {Entity}Model {
    // Validate business rules
    // Example: if (data.price < 0) throw new BadRequestException('Price must be positive');

    const now = new Date();
    return new {Entity}Model(
      data.id,
      // Initialize properties
      now,
      now,
      null
    );
  }

  /**
   * Factory method for reconstituting from database
   * No validation needed - data already validated
   */
  static reconstitute(data: I{Entity}): {Entity}Model {
    return new {Entity}Model(
      data.id,
      // Map properties from database
      data.created_at,
      data.updated_at,
      data.deleted_at || null
    );
  }

  // Business methods
  // Example: confirm(), cancel(), activate(), etc.

  /**
   * Update method
   * Validates business rules before updating
   */
  update(data: {
    // Add updatable properties
  }): void {
    // Validate and update properties
    // Auto-update timestamp
    this.updatedAt = new Date();
  }

  // Query methods
  // Example: isActive(), canBeModified(), etc.

  /**
   * Convert to entity (for database/API)
   */
  toEntity(): I{Entity} {
    return {
      id: this.id,
      // Map all properties
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      deleted_at: this.deletedAt || undefined,
    };
  }

  // Getters
  getId(): string { return this.id; }
  // Add more getters
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
}
```

#### Repository Template

```typescript
// src/domains/{domain}/repository/{entity}.repository.ts

import { Injectable } from '@nestjs/common';
import { BaseDomainRepository } from '../../../common/domain/base-domain.repository';
import { DatabaseService } from '../../../database/database.service';
import { {Entity}Model } from '../models/{entity}.model';
import { {Entity} as I{Entity} } from '../interfaces/{entity}.interface';

@Injectable()
export class {Entity}Repository extends BaseDomainRepository<{Entity}Model, I{Entity}> {
  protected tableName = '{table_name}';

  constructor(databaseService: DatabaseService) {
    super(databaseService, {
      entityName: '{Entity}',
      tableName: '{table_name}',
      primaryKey: 'id',
      timestampColumns: {
        created: 'created_at',
        updated: 'updated_at',
        deleted: 'deleted_at',
      },
      softDelete: true,
      descColumns: ['name'], // Adjust based on your domain
    });
  }

  async findById(id: string): Promise<{Entity}Model | null> {
    const row = await this.baseQuery()
      .where('id', id)
      .first();

    if (!row) return null;

    return {Entity}Model.reconstitute(row);
  }

  async findAll(pagination: { page: number; limit: number }): Promise<{
    data: {Entity}Model[];
    total: number;
  }> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const countQuery = this.baseQuery();
    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count as string, 10);

    const rows = await this.baseQuery()
      .orderBy(this.config.timestampColumns.created, 'desc')
      .limit(limit)
      .offset(offset);

    const data = rows.map(row => {Entity}Model.reconstitute(row));

    return { data, total };
  }

  // Add custom query methods here
  // Example: findByStatus(status: string): Promise<{Entity}Model[]>

  // Protected methods (required by base class)

  protected async insert(entity: I{Entity}): Promise<void> {
    await this.knex(this.tableName).insert(entity);
  }

  protected async update(entity: I{Entity}): Promise<void> {
    await this.knex(this.tableName)
      .where(this.config.primaryKey, entity.id)
      .update(entity);
  }

  protected async exists(id: string): Promise<boolean> {
    const row = await this.knex(this.tableName)
      .where(this.config.primaryKey, id)
      .first();
    return !!row;
  }

  protected async softDelete(id: string): Promise<void> {
    await this.knex(this.tableName)
      .where(this.config.primaryKey, id)
      .update({ [this.config.timestampColumns.deleted]: new Date() });
  }

  protected async hardDelete(id: string): Promise<void> {
    await this.knex(this.tableName)
      .where(this.config.primaryKey, id)
      .delete();
  }
}
```

#### Service Template

```typescript
// src/domains/{domain}/{entity}.service.ts

import { Injectable } from '@nestjs/common';
import { {Entity}Repository } from './repository/{entity}.repository';
import { {Entity}Model } from './models/{entity}.model';
import { Create{Entity}Dto, Update{Entity}Dto } from './dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class {Entity}Service {
  constructor(
    private readonly repository: {Entity}Repository,
  ) {}

  async create(dto: Create{Entity}Dto) {
    const model = {Entity}Model.create({
      id: uuidv4(),
      // Map DTO to model data
    });

    await this.repository.save(model);
    return model.toEntity();
  }

  async findById(id: string) {
    const model = await this.repository.findByIdOrThrow(id);
    return model.toEntity();
  }

  async findAll(pagination: { page: number; limit: number }) {
    const result = await this.repository.findAll(pagination);
    return {
      data: result.data.map(model => model.toEntity()),
      total: result.total,
    };
  }

  async update(id: string, dto: Update{Entity}Dto) {
    const model = await this.repository.findByIdOrThrow(id);

    model.update({
      // Map DTO to update data
    });

    await this.repository.save(model);
    return model.toEntity();
  }

  async delete(id: string) {
    await this.repository.delete(id);
  }

  // Add custom business methods here
}
```

---

## Best Practices

### 1. Domain Model Design

#### ✅ DO

- **Use private constructor** to enforce factory pattern
- **Validate all business rules** in `create()` and business methods
- **Keep properties private**, expose only through getters
- **Use meaningful method names** that reflect domain language (e.g., `confirm()`, `ship()`, `cancel()`)
- **Auto-update timestamps** in business methods (`updatedAt = new Date()`)
- **Throw domain-specific exceptions** with clear messages
- **Return copies of arrays/objects** from getters to prevent external modification
- **Document business rules** in JSDoc comments

#### ❌ DON'T

- Don't allow direct instantiation (`new Model()`)
- Don't expose setters for properties
- Don't put database logic in models
- Don't create models with invalid state
- Don't bypass validation in factory methods
- Don't return mutable internal state from getters

#### Examples

**✅ Good**:

```typescript
export class OrderModel extends BaseDomainModel<IOrder> {
  private constructor(
    private id: string,
    private items: OrderItem[],
    // ...
  ) {
    super();
  }

  static create(data: CreateOrderData): OrderModel {
    // Validate business rules
    if (data.items.length === 0) {
      throw new BadRequestException('Order must have at least one item');
    }

    return new OrderModel(data.id, data.items);
  }

  // Return copy to prevent external modification
  getItems(): OrderItem[] {
    return [...this.items];
  }

  // Meaningful business method
  confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Can only confirm pending orders');
    }
    this.status = OrderStatus.CONFIRMED;
    this.updatedAt = new Date();
  }
}
```

**❌ Bad**:

```typescript
export class OrderModel {
  // ❌ Public constructor
  constructor(
    public id: string,       // ❌ Public properties
    public items: OrderItem[],
    // ...
  ) {}

  // ❌ Setter exposes internal state
  setStatus(status: string) {
    this.status = status;
  }

  // ❌ Returns mutable internal state
  getItems(): OrderItem[] {
    return this.items;
  }

  // ❌ No validation
  confirm(): void {
    this.status = 'confirmed';
  }
}
```

### 2. Repository Design

#### ✅ DO

- **Return domain models**, not plain objects
- **Use `reconstitute()`** to convert DB rows to models
- **Implement custom query methods** for domain-specific needs
- **Handle soft delete consistently** using `baseQuery()`
- **Use transactions** for complex operations
- **Document query methods** with JSDoc

#### ❌ DON'T

- Don't return `any` or plain objects
- Don't put business logic in repository
- Don't expose Knex query builder directly to services
- Don't mix persistence and domain logic

#### Examples

**✅ Good**:

```typescript
@Injectable()
export class OrderRepository extends BaseDomainRepository<OrderModel, IOrder> {
  async findById(id: string): Promise<OrderModel | null> {
    const row = await this.baseQuery()  // ✅ Uses baseQuery for soft delete
      .where('id', id)
      .first();

    if (!row) return null;

    return OrderModel.reconstitute(row);  // ✅ Returns domain model
  }

  // ✅ Domain-specific query method
  async findPendingOrdersForCustomer(customerId: string): Promise<OrderModel[]> {
    const rows = await this.baseQuery()
      .where('customer_id', customerId)
      .where('status', 'pending')
      .orderBy('created_at', 'desc');

    return rows.map(row => OrderModel.reconstitute(row));
  }
}
```

**❌ Bad**:

```typescript
@Injectable()
export class OrderRepository {
  async findById(id: string): Promise<any> {  // ❌ Returns any
    const row = await this.knex('orders')  // ❌ No soft delete check
      .where('id', id)
      .first();

    return row;  // ❌ Returns plain object, not domain model
  }

  // ❌ Business logic in repository
  async confirmOrder(id: string): Promise<void> {
    const order = await this.findById(id);
    if (order.status !== 'pending') {
      throw new Error('Cannot confirm');
    }
    await this.knex('orders')
      .where('id', id)
      .update({ status: 'confirmed' });
  }
}
```

### 3. Service Design

#### ✅ DO

- **Keep services thin** (orchestration only)
- **Use models for business logic**
- **Convert models to entities** for API responses
- **Handle transactions at service level**
- **Coordinate between multiple repositories**
- **Use meaningful method names**

#### ❌ DON'T

- Don't duplicate business logic in services
- Don't bypass domain models
- Don't manipulate model state directly
- Don't return models to controllers (use entities)
- Don't mix orchestration and business logic

#### Examples

**✅ Good**:

```typescript
@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly inventoryRepository: InventoryRepository,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    // ✅ Use domain model for business logic
    const order = OrderModel.create({
      id: uuidv4(),
      customerId: dto.customer_id,
      items: dto.items,
      totalAmount: dto.total_amount,
    });

    // ✅ Service orchestrates transaction
    const transaction = await this.knex.transaction();
    try {
      await this.orderRepository.save(order);

      // ✅ Coordinate with other repositories
      await this.inventoryRepository.decreaseStock(dto.items, transaction);

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    // ✅ Return entity for API response
    return order.toEntity();
  }
}
```

**❌ Bad**:

```typescript
@Injectable()
export class OrderService {
  async createOrder(dto: CreateOrderDto) {
    // ❌ Business logic in service
    if (dto.total_amount <= 0) {
      throw new BadRequestException('Total must be positive');
    }

    if (dto.items.length === 0) {
      throw new BadRequestException('Must have items');
    }

    // ❌ Bypass domain model
    const order = {
      id: uuidv4(),
      customer_id: dto.customer_id,
      items: dto.items,
      total_amount: dto.total_amount,
      status: 'pending',
      created_at: new Date(),
    };

    await this.knex('orders').insert(order);
    return order;  // ❌ Return plain object
  }
}
```

### 4. Testing

#### ✅ DO

- **Unit test domain models** in isolation
- **Test business rules thoroughly**
- **Mock repositories in service tests**
- **Use integration tests for repositories**
- **Test edge cases and error scenarios**
- **Use descriptive test names**

#### ❌ DON'T

- Don't skip model tests
- Don't test only happy paths
- Don't mock domain models in tests
- Don't test implementation details
- Don't write tests without clear assertions

---

## Testing Strategy

### Unit Testing Domain Models

**File**: `src/domains/orders/__tests__/order.model.spec.ts`

```typescript
import { OrderModel, OrderStatus } from '../models/order.model';
import { BadRequestException } from '@nestjs/common';

describe('OrderModel', () => {
  describe('create', () => {
    it('should create a new order with valid data', () => {
      const order = OrderModel.create({
        id: '123',
        customerId: 'cust-1',
        totalAmount: 100,
        items: [{ productId: 'p1', quantity: 1, price: 100 }],
      });

      expect(order.getId()).toBe('123');
      expect(order.getStatus()).toBe(OrderStatus.PENDING);
      expect(order.getTotalAmount()).toBe(100);
    });

    it('should throw error when total amount is negative', () => {
      expect(() => {
        OrderModel.create({
          id: '123',
          customerId: 'cust-1',
          totalAmount: -10,
          items: [{ productId: 'p1', quantity: 1, price: 100 }],
        });
      }).toThrow('Total amount must be positive');
    });

    it('should throw error when no items provided', () => {
      expect(() => {
        OrderModel.create({
          id: '123',
          customerId: 'cust-1',
          totalAmount: 100,
          items: [],
        });
      }).toThrow('Order must have at least one item');
    });

    it('should throw error when total amount mismatch', () => {
      expect(() => {
        OrderModel.create({
          id: '123',
          customerId: 'cust-1',
          totalAmount: 100,
          items: [{ productId: 'p1', quantity: 1, price: 50 }], // Should be 100
        });
      }).toThrow('Total amount mismatch');
    });
  });

  describe('confirm', () => {
    it('should confirm pending order', () => {
      const order = OrderModel.create({
        id: '123',
        customerId: 'cust-1',
        totalAmount: 100,
        items: [{ productId: 'p1', quantity: 1, price: 100 }],
      });

      order.confirm();

      expect(order.getStatus()).toBe(OrderStatus.CONFIRMED);
    });

    it('should throw error when confirming non-pending order', () => {
      const order = OrderModel.create({
        id: '123',
        customerId: 'cust-1',
        totalAmount: 100,
        items: [{ productId: 'p1', quantity: 1, price: 100 }],
      });

      order.confirm(); // First confirmation

      expect(() => {
        order.confirm(); // Second confirmation
      }).toThrow('Cannot confirm order in confirmed status');
    });
  });

  describe('cancel', () => {
    it('should cancel pending order', () => {
      const order = OrderModel.create({
        id: '123',
        customerId: 'cust-1',
        totalAmount: 100,
        items: [{ productId: 'p1', quantity: 1, price: 100 }],
      });

      order.cancel();

      expect(order.getStatus()).toBe(OrderStatus.CANCELLED);
    });

    it('should not cancel delivered order', () => {
      const order = OrderModel.reconstitute({
        id: '123',
        customer_id: 'cust-1',
        total_amount: 100,
        status: 'delivered',
        items: [],
        created_at: new Date(),
        updated_at: new Date(),
      });

      expect(() => {
        order.cancel();
      }).toThrow('Cannot cancel delivered order');
    });
  });

  describe('state transitions', () => {
    it('should follow valid state transition flow', () => {
      const order = OrderModel.create({
        id: '123',
        customerId: 'cust-1',
        totalAmount: 100,
        items: [{ productId: 'p1', quantity: 1, price: 100 }],
      });

      // pending → confirmed → shipped → delivered
      expect(order.getStatus()).toBe(OrderStatus.PENDING);

      order.confirm();
      expect(order.getStatus()).toBe(OrderStatus.CONFIRMED);

      order.ship();
      expect(order.getStatus()).toBe(OrderStatus.SHIPPED);

      order.deliver();
      expect(order.getStatus()).toBe(OrderStatus.DELIVERED);
    });

    it('should not allow skipping states', () => {
      const order = OrderModel.create({
        id: '123',
        customerId: 'cust-1',
        totalAmount: 100,
        items: [{ productId: 'p1', quantity: 1, price: 100 }],
      });

      // Cannot ship pending order (must confirm first)
      expect(() => {
        order.ship();
      }).toThrow('Can only ship confirmed orders');
    });
  });
});
```

### Integration Testing Repository

**File**: `src/domains/orders/__tests__/order.repository.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { OrderRepository } from '../repository/order.repository';
import { OrderModel } from '../models/order.model';
import { DatabaseService } from '../../../database/database.service';

describe('OrderRepository', () => {
  let repository: OrderRepository;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderRepository,
        {
          provide: DatabaseService,
          useValue: {
            getKnex: jest.fn(() => knexInstance), // Mock knex
          },
        },
      ],
    }).compile();

    repository = module.get<OrderRepository>(OrderRepository);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  describe('save', () => {
    it('should insert new order', async () => {
      const order = OrderModel.create({
        id: '123',
        customerId: 'cust-1',
        totalAmount: 100,
        items: [{ productId: 'p1', quantity: 1, price: 100 }],
      });

      await repository.save(order);

      // Verify inserted
      const found = await repository.findById('123');
      expect(found).not.toBeNull();
      expect(found.getId()).toBe('123');
    });

    it('should update existing order', async () => {
      // Create order first
      const order = OrderModel.create({
        id: '123',
        customerId: 'cust-1',
        totalAmount: 100,
        items: [{ productId: 'p1', quantity: 1, price: 100 }],
      });
      await repository.save(order);

      // Update order
      order.confirm();
      await repository.save(order);

      // Verify updated
      const found = await repository.findById('123');
      expect(found.getStatus()).toBe(OrderStatus.CONFIRMED);
    });
  });

  describe('findById', () => {
    it('should return null if not found', async () => {
      const found = await repository.findById('non-existent');
      expect(found).toBeNull();
    });

    it('should return domain model if found', async () => {
      // Setup: create order
      const order = OrderModel.create({
        id: '123',
        customerId: 'cust-1',
        totalAmount: 100,
        items: [{ productId: 'p1', quantity: 1, price: 100 }],
      });
      await repository.save(order);

      // Test
      const found = await repository.findById('123');

      expect(found).toBeInstanceOf(OrderModel);
      expect(found.getId()).toBe('123');
    });

    it('should not return soft-deleted orders', async () => {
      // Create and delete order
      const order = OrderModel.create({
        id: '123',
        customerId: 'cust-1',
        totalAmount: 100,
        items: [{ productId: 'p1', quantity: 1, price: 100 }],
      });
      await repository.save(order);
      await repository.delete('123');

      // Should not find deleted order
      const found = await repository.findById('123');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated results', async () => {
      // Create multiple orders
      for (let i = 1; i <= 15; i++) {
        const order = OrderModel.create({
          id: `order-${i}`,
          customerId: 'cust-1',
          totalAmount: i * 10,
          items: [{ productId: 'p1', quantity: 1, price: i * 10 }],
        });
        await repository.save(order);
      }

      // Get page 1
      const page1 = await repository.findAll({ page: 1, limit: 10 });
      expect(page1.data.length).toBe(10);
      expect(page1.total).toBe(15);

      // Get page 2
      const page2 = await repository.findAll({ page: 2, limit: 10 });
      expect(page2.data.length).toBe(5);
      expect(page2.total).toBe(15);
    });
  });
});
```

---

## Examples

### Example 1: Booking System with Date Validation

```typescript
export class BookingModel extends BaseDomainModel<IBooking> {
  private constructor(
    private id: string,
    private resourceId: string,
    private userId: string,
    private startDate: Date,
    private endDate: Date,
    private status: BookingStatus,
    private createdAt: Date,
    private updatedAt: Date,
  ) {
    super();
  }

  static create(data: {
    id: string;
    resourceId: string;
    userId: string;
    startDate: Date;
    endDate: Date;
  }): BookingModel {
    // Business rule: End date must be after start date
    if (data.endDate <= data.startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Business rule: Cannot book in the past
    if (data.startDate < new Date()) {
      throw new BadRequestException('Cannot book in the past');
    }

    // Business rule: Booking must be at least 1 hour
    const duration = data.endDate.getTime() - data.startDate.getTime();
    const oneHour = 60 * 60 * 1000;
    if (duration < oneHour) {
      throw new BadRequestException('Booking must be at least 1 hour');
    }

    const now = new Date();
    return new BookingModel(
      data.id,
      data.resourceId,
      data.userId,
      data.startDate,
      data.endDate,
      BookingStatus.PENDING,
      now,
      now
    );
  }

  static reconstitute(data: IBooking): BookingModel {
    return new BookingModel(
      data.id,
      data.resource_id,
      data.user_id,
      data.start_date,
      data.end_date,
      data.status as BookingStatus,
      data.created_at,
      data.updated_at
    );
  }

  /**
   * Validate that this booking doesn't overlap with existing bookings
   */
  validateNoOverlap(existingBookings: BookingModel[]): void {
    const overlapping = existingBookings.filter(booking => {
      if (booking.id === this.id) return false;
      if (booking.status === BookingStatus.CANCELLED) return false;

      return (
        (this.startDate >= booking.startDate && this.startDate < booking.endDate) ||
        (this.endDate > booking.startDate && this.endDate <= booking.endDate) ||
        (this.startDate <= booking.startDate && this.endDate >= booking.endDate)
      );
    });

    if (overlapping.length > 0) {
      throw new ConflictException(
        `Booking overlaps with ${overlapping.length} existing booking(s)`
      );
    }
  }

  confirm(): void {
    if (this.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Can only confirm pending bookings');
    }

    if (this.startDate < new Date()) {
      throw new BadRequestException('Cannot confirm past bookings');
    }

    this.status = BookingStatus.CONFIRMED;
    this.updatedAt = new Date();
  }

  cancel(): void {
    if (this.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed bookings');
    }

    // Business rule: Cannot cancel within 24 hours of start
    const now = new Date();
    const hoursUntilStart = (this.startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilStart < 24) {
      throw new BadRequestException('Cannot cancel within 24 hours of start time');
    }

    this.status = BookingStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  complete(): void {
    if (this.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Can only complete confirmed bookings');
    }

    if (this.endDate > new Date()) {
      throw new BadRequestException('Cannot complete future bookings');
    }

    this.status = BookingStatus.COMPLETED;
    this.updatedAt = new Date();
  }

  isActive(): boolean {
    const now = new Date();
    return this.status === BookingStatus.CONFIRMED &&
           this.startDate <= now &&
           this.endDate >= now;
  }

  isFuture(): boolean {
    return this.startDate > new Date();
  }

  isPast(): boolean {
    return this.endDate < new Date();
  }

  getDurationInHours(): number {
    const duration = this.endDate.getTime() - this.startDate.getTime();
    return duration / (1000 * 60 * 60);
  }

  toEntity(): IBooking {
    return {
      id: this.id,
      resource_id: this.resourceId,
      user_id: this.userId,
      start_date: this.startDate,
      end_date: this.endDate,
      status: this.status,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }
}

enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
```

### Example 2: Product with Inventory Management

```typescript
export class ProductModel extends BaseDomainModel<IProduct> {
  private constructor(
    private id: string,
    private name: string,
    private sku: string,
    private price: number,
    private stock: number,
    private lowStockThreshold: number,
    private isActive: boolean,
    private createdAt: Date,
    private updatedAt: Date,
  ) {
    super();
  }

  static create(data: {
    id: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
    lowStockThreshold?: number;
  }): ProductModel {
    // Business rules
    if (data.price <= 0) {
      throw new BadRequestException('Price must be positive');
    }

    if (data.stock < 0) {
      throw new BadRequestException('Stock cannot be negative');
    }

    // Validate SKU format (example: PRD-XXXXX)
    if (!/^PRD-[A-Z0-9]{5}$/.test(data.sku)) {
      throw new BadRequestException('Invalid SKU format. Expected: PRD-XXXXX');
    }

    const now = new Date();
    return new ProductModel(
      data.id,
      data.name,
      data.sku,
      data.price,
      data.stock,
      data.lowStockThreshold || 10,
      true,
      now,
      now
    );
  }

  static reconstitute(data: IProduct): ProductModel {
    return new ProductModel(
      data.id,
      data.name,
      data.sku,
      data.price,
      data.stock,
      data.low_stock_threshold,
      data.is_active,
      data.created_at,
      data.updated_at
    );
  }

  decreaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    if (this.stock < quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${this.stock}, Requested: ${quantity}`
      );
    }

    this.stock -= quantity;
    this.updatedAt = new Date();
  }

  increaseStock(quantity: number): void {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    this.stock += quantity;
    this.updatedAt = new Date();
  }

  setPrice(newPrice: number): void {
    if (newPrice <= 0) {
      throw new BadRequestException('Price must be positive');
    }

    this.price = newPrice;
    this.updatedAt = new Date();
  }

  activate(): void {
    if (this.stock === 0) {
      throw new BadRequestException('Cannot activate product with zero stock');
    }

    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }

  isLowStock(): boolean {
    return this.stock <= this.lowStockThreshold && this.stock > 0;
  }

  isOutOfStock(): boolean {
    return this.stock === 0;
  }

  canFulfillOrder(quantity: number): boolean {
    return this.stock >= quantity && this.isActive;
  }

  calculateRevenue(soldQuantity: number): number {
    return this.price * soldQuantity;
  }

  toEntity(): IProduct {
    return {
      id: this.id,
      name: this.name,
      sku: this.sku,
      price: this.price,
      stock: this.stock,
      low_stock_threshold: this.lowStockThreshold,
      is_active: this.isActive,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
    };
  }

  getId(): string { return this.id; }
  getName(): string { return this.name; }
  getSku(): string { return this.sku; }
  getPrice(): number { return this.price; }
  getStock(): number { return this.stock; }
  getIsActive(): boolean { return this.isActive; }
}
```

---

## FAQ

### Q1: Should I migrate all existing domains to Rich Model?

**A**: No. Only migrate domains with complex business logic. Simple CRUD domains can continue using BaseKnexService (Anemic Model). Use the Migration Decision Matrix to decide.

### Q2: Can I mix both patterns in the same project?

**A**: Yes! This is actually recommended. Use Rich Domain Model for complex domains and Anemic Model for simple ones. Both patterns coexist peacefully.

### Q3: What's the performance impact of Domain Model pattern?

**A**: Minimal. The overhead is mainly in object creation, which is negligible. The benefits (better testing, clearer code, fewer bugs) far outweigh the tiny performance cost.

### Q4: How do I handle validation - in DTO or in Domain Model?

**A**: Both!
- **DTO**: Basic validation (required fields, data types, format)
- **Domain Model**: Business rules and invariants

Example:
- DTO validates: "price is a number"
- Model validates: "price must be positive AND less than max allowed price"

### Q5: Should I create separate interfaces for create/update data?

**A**: Yes, for type safety:

```typescript
// For create factory
interface CreateOrderData {
  id: string;
  customerId: string;
  totalAmount: number;
  items: OrderItem[];
}

// For update method
interface UpdateOrderData {
  totalAmount?: number;
  items?: OrderItem[];
}
```

### Q6: How do I test domain models with dates?

**A**: Use fake timers or pass dates as parameters:

```typescript
// Option 1: Pass date as parameter
isCurrentlyActive(currentDate: Date = new Date()): boolean {
  if (!this.isActive) return false;
  return currentDate >= this.startDate && currentDate <= this.endDate;
}

// Test
it('should be active when within date range', () => {
  const testDate = new Date('2025-06-15');
  expect(banner.isCurrentlyActive(testDate)).toBe(true);
});
```

### Q7: How do I handle relationships between models?

**A**: Store IDs, not model references. Load related models in service:

```typescript
// ❌ Bad: Store model reference
class Order {
  private customer: Customer; // Don't do this
}

// ✅ Good: Store ID
class Order {
  private customerId: string;
}

// Service loads related data
async getOrderWithCustomer(orderId: string) {
  const order = await this.orderRepository.findByIdOrThrow(orderId);
  const customer = await this.customerRepository.findByIdOrThrow(
    order.getCustomerId()
  );

  return {
    order: order.toEntity(),
    customer: customer.toEntity(),
  };
}
```

### Q8: Should I use BaseDomainService or create custom services?

**A**: Either works. Use BaseDomainService for standard CRUD. Create custom services for complex orchestration.

### Q9: How do I handle soft deletes in domain models?

**A**: Handle in repository, not model:

```typescript
// Repository handles soft delete
class OrderRepository {
  protected async softDelete(id: string): Promise<void> {
    await this.knex(this.tableName)
      .where('id', id)
      .update({ deleted_at: new Date() });
  }
}

// Model doesn't need to know about soft delete
class OrderModel {
  // No delete-related methods needed
}
```

### Q10: What if I need to query database in domain model?

**A**: Don't! Domain models should not access database. Use services or repositories:

```typescript
// ❌ Bad: Query in model
class OrderModel {
  async validate() {
    const customer = await knex('customers').where('id', this.customerId).first();
    // ...
  }
}

// ✅ Good: Pass data from service
class OrderService {
  async create(dto: CreateOrderDto) {
    // Fetch dependencies
    const customer = await this.customerRepository.findByIdOrThrow(dto.customer_id);

    // Pass to model if needed for validation
    const order = OrderModel.create({
      // ...
    });

    // Or validate in service
    if (!customer.isActive()) {
      throw new BadRequestException('Customer is not active');
    }
  }
}
```

---

## Internationalization (i18n) Support

### Overview

The Domain Model pattern now includes built-in **i18n support** through **Domain Exceptions** and an **Injectable Error Codes pattern**. This allows error messages to be translated without violating the clean architecture principle of keeping domain models pure.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Domain Layer (Pure - No i18n dependency)               │
│                                                         │
│  if (price < 0) {                                       │
│    throw new DomainValidationException(                 │
│      ProductErrorCodes.PRODUCT_VALIDATION_PRICE_NEGATIVE│
│      { price }                                          │
│    );                                                   │
│  }                                                      │
└─────────────────────────────────────────────────────────┘
                       │
                       │ throws DomainException
                       ▼
┌─────────────────────────────────────────────────────────┐
│  HTTP Layer (DomainExceptionFilter)                     │
│  - Catches exception                                    │
│  - Gets user's language (x-lang header)                 │
│  - Translates using I18nService                         │
│  - Returns translated error response                    │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│  HTTP Response (Translated)                             │
│  EN: { message: "Price must be non-negative" }          │
│  ID: { message: "Harga harus tidak negatif" }           │
└─────────────────────────────────────────────────────────┘
```

### Injectable Error Codes Pattern

Each domain creates its own error codes by extending default common error codes:

**Common Error Codes (Reusable)**
```typescript
// src/common/domain/exceptions/constants/domain-error-codes.default.ts
export const DomainErrorCodesDefault = {
  COMMON_VALIDATION_REQUIRED: 'domain.common.validation.required',
  COMMON_NOT_FOUND_BY_ID: 'domain.common.not_found_by_id',
  // ... other common errors
} as const;
```

**Domain-Specific Error Codes (Injectable)**
```typescript
// src/domains/products/constants/product-error-codes.ts
import { DomainErrorCodesDefault } from '@/common/domain';

export const ProductErrorCodes = {
  ...DomainErrorCodesDefault, // Inherit common errors
  
  // Add product-specific errors
  PRODUCT_VALIDATION_PRICE_NEGATIVE: 'domain.products.validation.price_negative',
  PRODUCT_INSUFFICIENT_STOCK: 'domain.products.insufficient_stock',
} as const;
```

### Usage Example

**In Domain Model:**
```typescript
import { DomainValidationException } from '@/common/domain';
import { ProductErrorCodes } from '../constants';

export class ProductModel extends BaseDomainModel<IProduct> {
  static create(data: CreateProductData): ProductModel {
    if (data.price < 0) {
      throw new DomainValidationException(
        ProductErrorCodes.PRODUCT_VALIDATION_PRICE_NEGATIVE,
        { price: data.price }
      );
    }
    // ...
  }
}
```

**User with `x-lang: en`:**
```json
{ "message": "Price must be non-negative", "statusCode": 400 }
```

**User with `x-lang: id`:**
```json
{ "message": "Harga harus tidak negatif", "statusCode": 400 }
```

### Adding New Error Codes

#### For Existing Domains:
1. Add to domain error codes: `src/domains/products/constants/product-error-codes.ts`
2. Add translations to `src/i18n/en/domain.json` and `src/i18n/id/domain.json`
3. Use in domain models with type safety

#### For New Domains:
1. Create `src/domains/{domain}/constants/` directory
2. Create error codes file extending `DomainErrorCodesDefault`
3. Create barrel export `index.ts`
4. Add translations to i18n files
5. Use in domain models

### Benefits

✅ **Modular**: Each domain owns its error codes  
✅ **Flexible**: Can use common or domain-specific errors  
✅ **Scalable**: New domains don't affect core infrastructure  
✅ **Maintainable**: No centralized file that grows endlessly  
✅ **Type-Safe**: Autocomplete and type checking for error codes  
✅ **Pure Domain**: No I18nService dependency in models  

### Documentation

See **`DOMAIN_I18N_GUIDE.md`** for complete implementation guide.

---

## Summary

### Key Takeaways

1. **Blueprint Purpose**
   - Standardized Rich Domain Model pattern for nest-starter
   - Reusable across all domains
   - Coexists with Anemic Model (BaseKnexService)
   - Choose pattern based on domain complexity

2. **Core Principles**
   - **Encapsulate business logic** in domain models
   - **Use repositories** for persistence
   - **Keep services thin** (orchestration only)
   - **Enforce invariants** through factory methods
   - **Type-safe** throughout the stack

3. **When to Use**
   - **Rich Domain Model**: Complex business rules, state management, time-based logic
   - **Anemic Model**: Simple CRUD, minimal logic, rapid prototyping
   - **Decision**: Let domain complexity guide the choice

4. **Implementation Path**
   - Phase 1: Create base infrastructure
   - Phase 2: Implement pilot domain
   - Phase 3: Migrate incrementally
   - Both patterns coexist peacefully

5. **Benefits**
   - ✅ Better testability (unit test models)
   - ✅ Clearer code organization
   - ✅ Enforced business rules
   - ✅ Impossible invalid states
   - ✅ Single source of truth
   - ✅ Maintainable and scalable

### Next Steps

1. **Review & Approve**: Get team feedback on blueprint
2. **Implement Base Classes**: Create foundation in `src/common/domain/`
3. **Create Example**: Implement reference domain (orders/bookings)
4. **Pilot Migration**: Migrate one real domain
5. **Document & Train**: Create guides and train team
6. **Gradual Adoption**: Migrate domains based on complexity

---

**Blueprint Status**: ✅ Design Complete - Ready for Implementation

**Version**: 1.1
**Last Updated**: 2025-10-03
**Maintainer**: System Architecture Team

For questions or feedback, please contact the architecture team or create an issue in the repository.
