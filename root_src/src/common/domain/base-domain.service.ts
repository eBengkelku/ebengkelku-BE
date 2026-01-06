import { BaseDomainModel } from './base-domain.model';
import { BaseDomainRepository } from './base-domain.repository';

/**
 * Base Domain Service
 *
 * Optional abstract base class for domain services implementing common service patterns.
 * This class provides standardized CRUD operations and delegates business logic to
 * domain models while orchestrating repositories and transactions.
 *
 * **Note**: Using this base service is OPTIONAL. Services can be implemented without
 * extending this class if more flexibility is needed.
 *
 * @abstract
 * @template TModel - The domain model type (extends BaseDomainModel)
 * @template TRepository - The repository type (extends BaseDomainRepository)
 * @template TEntity - The entity/database record type
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class ProductService extends BaseDomainService<
 *   ProductModel,
 *   ProductRepository,
 *   IProduct
 * > {
 *   constructor(repository: ProductRepository) {
 *     super(repository);
 *   }
 *
 *   protected buildModel(data: CreateProductDto): ProductModel {
 *     return ProductModel.create({
 *       id: uuidv4(),
 *       ...data,
 *     });
 *   }
 *
 *   protected updateModel(model: ProductModel, data: UpdateProductDto): void {
 *     model.update(data);
 *   }
 *
 *   // Add custom business methods
 *   async applyDiscount(id: string, percent: number): Promise<IProduct> {
 *     const product = await this.repository.findByIdOrThrow(id);
 *     product.applyDiscount(percent);
 *     await this.repository.save(product);
 *     return product.toEntity();
 *   }
 * }
 * ```
 *
 * @version 1.0.0
 * @since 2025-10-03
 */
export abstract class BaseDomainService<
  TModel extends BaseDomainModel<TEntity>,
  TRepository extends BaseDomainRepository<TModel, TEntity>,
  TEntity = any,
> {
  /**
   * Creates an instance of BaseDomainService
   *
   * @param {TRepository} repository - The repository for data access
   *
   * @example
   * ```typescript
   * constructor(repository: ProductRepository) {
   *   super(repository);
   * }
   * ```
   */
  constructor(protected readonly repository: TRepository) {}

  /**
   * Creates a new entity
   *
   * This method orchestrates the creation process:
   * 1. Builds a domain model using `buildModel()` (validates business rules)
   * 2. Persists the model via repository
   * 3. Returns the entity representation
   *
   * @param {any} data - The data for creating the entity
   * @returns {Promise<TEntity>} The created entity
   *
   * @example
   * ```typescript
   * const product = await service.create({
   *   name: 'iPhone 15',
   *   price: 999,
   *   stock_quantity: 50,
   * });
   * ```
   */
  async create(data: any): Promise<TEntity> {
    const model = await this.buildModel(data);
    await this.repository.save(model);
    return model.toEntity();
  }

  /**
   * Finds an entity by ID
   *
   * @param {string | number} id - The primary key value
   * @returns {Promise<TEntity>} The entity
   * @throws {NotFoundException} If entity not found
   *
   * @example
   * ```typescript
   * const product = await service.findById('uuid-123');
   * ```
   */
  async findById(id: string | number): Promise<TEntity> {
    const model = await this.repository.findByIdOrThrow(id);
    return model.toEntity();
  }

  /**
   * Finds all entities with pagination
   *
   * @param {object} pagination - Pagination parameters
   * @param {number} pagination.page - Page number (1-based)
   * @param {number} pagination.limit - Records per page
   * @returns {Promise<{data: TEntity[], total: number}>} Paginated results
   *
   * @example
   * ```typescript
   * const result = await service.findAll({ page: 1, limit: 10 });
   * // result = { data: [...], total: 100 }
   * ```
   */
  async findAll(pagination: {
    page: number;
    limit: number;
  }): Promise<{
    data: TEntity[];
    total: number;
  }> {
    const result = await this.repository.findAll(pagination);
    return {
      data: result.data.map((model) => model.toEntity()),
      total: result.total,
    };
  }

  /**
   * Updates an entity
   *
   * This method orchestrates the update process:
   * 1. Fetches the existing model from repository
   * 2. Updates the model using `updateModel()` (validates business rules)
   * 3. Persists the updated model
   * 4. Returns the updated entity
   *
   * @param {string | number} id - The primary key value
   * @param {any} data - The update data
   * @returns {Promise<TEntity>} The updated entity
   * @throws {NotFoundException} If entity not found
   *
   * @example
   * ```typescript
   * const updated = await service.update('uuid-123', {
   *   price: 899,
   *   stock_quantity: 45,
   * });
   * ```
   */
  async update(id: string | number, data: any): Promise<TEntity> {
    const model = await this.repository.findByIdOrThrow(id);
    await this.updateModel(model, data);
    await this.repository.save(model);
    return model.toEntity();
  }

  /**
   * Deletes an entity
   *
   * Performs soft delete or hard delete based on repository configuration.
   *
   * @param {string | number} id - The primary key value
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * await service.delete('uuid-123');
   * ```
   */
  async delete(id: string | number): Promise<void> {
    await this.repository.delete(id);
  }

  /**
   * Builds a domain model from creation data
   *
   * This abstract method must be implemented by child classes to define
   * how to create a new domain model instance from input data.
   *
   * This is where you call the static `create()` method of your domain model
   * and perform any additional setup (e.g., generating IDs, fetching related data).
   *
   * @protected
   * @abstract
   * @param {any} data - The creation data
   * @returns {Promise<TModel> | TModel} The domain model instance
   *
   * @example
   * ```typescript
   * protected buildModel(data: CreateProductDto): ProductModel {
   *   return ProductModel.create({
   *     id: uuidv4(),
   *     name: data.name,
   *     price: data.price,
   *     stock: data.stock_quantity || 0,
   *   });
   * }
   *
   * // Async example with related data
   * protected async buildModel(data: CreateOrderDto): Promise<OrderModel> {
   *   // Fetch related data
   *   const customer = await this.customerRepo.findByIdOrThrow(data.customerId);
   *   const items = await this.fetchOrderItems(data.items);
   *
   *   return OrderModel.create({
   *     id: uuidv4(),
   *     customer,
   *     items,
   *     totalAmount: data.totalAmount,
   *   });
   * }
   * ```
   */
  protected abstract buildModel(data: any): Promise<TModel> | TModel;

  /**
   * Updates a domain model with new data
   *
   * This abstract method must be implemented by child classes to define
   * how to update an existing domain model with new data.
   *
   * This is where you call the `update()` method of your domain model
   * or invoke specific business methods.
   *
   * @protected
   * @abstract
   * @param {TModel} model - The domain model to update
   * @param {any} data - The update data
   * @returns {Promise<void> | void}
   *
   * @example
   * ```typescript
   * protected updateModel(model: ProductModel, data: UpdateProductDto): void {
   *   model.update({
   *     name: data.name,
   *     price: data.price,
   *     stock: data.stock_quantity,
   *   });
   * }
   *
   * // Async example with validation
   * protected async updateModel(
   *   model: OrderModel,
   *   data: UpdateOrderDto
   * ): Promise<void> {
   *   // Validate external dependencies
   *   if (data.items) {
   *     await this.validateOrderItems(data.items);
   *   }
   *
   *   model.update({
   *     items: data.items,
   *     totalAmount: data.totalAmount,
   *   });
   * }
   * ```
   */
  protected abstract updateModel(model: TModel, data: any): Promise<void> | void;
}
