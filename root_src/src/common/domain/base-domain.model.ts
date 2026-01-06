/**
 * Base Domain Model
 *
 * Abstract base class for all domain models implementing the Rich Domain Model pattern.
 * This class provides the foundation for domain-driven design (DDD) in the application,
 * encapsulating business logic, validation rules, and state management within domain models.
 *
 * @abstract
 * @template T - The entity interface type that this domain model represents
 *
 * @example
 * ```typescript
 * export class ProductModel extends BaseDomainModel<IProduct> {
 *   private constructor(
 *     private id: string,
 *     private name: string,
 *     private price: number,
 *     private stock: number,
 *     private createdAt: Date,
 *     private updatedAt: Date,
 *   ) {
 *     super();
 *   }
 *
 *   static create(data: CreateProductData): ProductModel {
 *     // Validation logic
 *     if (data.price < 0) {
 *       throw new BadRequestException('Price must be positive');
 *     }
 *     return new ProductModel(...);
 *   }
 *
 *   static reconstitute(data: IProduct): ProductModel {
 *     return new ProductModel(...);
 *   }
 *
 *   toEntity(): IProduct {
 *     return { id: this.id, name: this.name, ... };
 *   }
 * }
 * ```
 *
 * @version 1.0.0
 * @since 2025-10-03
 */
export abstract class BaseDomainModel<T = any> {
  /**
   * Converts the domain model to an entity (plain object).
   *
   * This method is used to transform the rich domain model into a plain entity
   * object that can be persisted to the database or returned via API responses.
   *
   * The entity typically uses database column naming conventions (e.g., snake_case)
   * while the domain model uses TypeScript conventions (camelCase).
   *
   * @returns {T} The entity representation of the domain model
   *
   * @example
   * ```typescript
   * const product = ProductModel.create({ name: 'iPhone', price: 999 });
   * const entity = product.toEntity();
   * // entity = { id: 'uuid', name: 'iPhone', price: 999, created_at: Date, ... }
   * ```
   */
  abstract toEntity(): T;

  /**
   * Factory method for creating new domain model instances.
   *
   * This static method should be implemented in child classes to create new instances
   * with validation and business rule enforcement. It's the primary way to create
   * new domain objects.
   *
   * IMPORTANT: This must be implemented as a static method in the child class.
   *
   * @static
   * @param {any} data - The data required to create the domain model
   * @returns {BaseDomainModel} A new instance of the domain model
   *
   * @example
   * ```typescript
   * static create(data: CreateProductData): ProductModel {
   *   // Validate business rules
   *   if (data.price < 0) {
   *     throw new BadRequestException('Price must be positive');
   *   }
   *   if (!data.name || data.name.trim().length === 0) {
   *     throw new BadRequestException('Name is required');
   *   }
   *
   *   const now = new Date();
   *   return new ProductModel(
   *     uuidv4(),
   *     data.name,
   *     data.price,
   *     data.stock || 0,
   *     now,
   *     now,
   *     null
   *   );
   * }
   * ```
   */
  // static create(data: any): DomainModel { ... }

  /**
   * Factory method for reconstituting domain models from database entities.
   *
   * This static method should be implemented in child classes to recreate domain
   * model instances from database records. Unlike `create()`, this method does NOT
   * perform validation since the data is already validated and stored in the database.
   *
   * IMPORTANT: This must be implemented as a static method in the child class.
   *
   * @static
   * @param {T} data - The entity data from the database
   * @returns {BaseDomainModel} A reconstituted domain model instance
   *
   * @example
   * ```typescript
   * static reconstitute(data: IProduct): ProductModel {
   *   return new ProductModel(
   *     data.id,
   *     data.name,
   *     data.price,
   *     data.stock_quantity,
   *     data.created_at,
   *     data.updated_at,
   *     data.deleted_at || null
   *   );
   * }
   * ```
   */
  // static reconstitute(data: T): DomainModel { ... }
}
