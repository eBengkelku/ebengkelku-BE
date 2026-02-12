import {
  BaseDomainModel,
  DomainValidationException,
} from '../../../common/domain';
import { ProductTypeErrorCodes } from '../constants';
import {
  IProductType,
  IProductTypeCreate,
} from '../interfaces/product-type.interface';

/**
 * Product Type Domain Model
 *
 * Rich domain model that encapsulates all business logic, validation rules,
 * and state management for product types.
 *
 * Business Rules:
 * - Name is required and cannot be empty
 * - Name max length is 100 characters
 * - Name must be unique (enforced at database level)
 *
 * @class ProductTypeModel
 * @extends {BaseDomainModel<IProductType>}
 * @version 1.0.0
 * @since 2026-02-12
 */
export class ProductTypeModel extends BaseDomainModel<IProductType> {
  private static readonly MAX_NAME_LENGTH = 100;

  private constructor(
    private readonly id: string,
    private name: string,
    private readonly createdAt: Date,
    private updatedAt: Date | null,
    private readonly deletedAt: Date | null,
    private readonly idCreator: string | null,
    private idUpdater: string | null,
  ) {
    super();
  }

  // ============================================================================
  // FACTORY METHODS
  // ============================================================================

  /**
   * Creates a new ProductType with validation
   */
  static create(data: IProductTypeCreate): ProductTypeModel {
    ProductTypeModel.validateName(data.name);

    return new ProductTypeModel(
      data.id,
      data.name.trim(),
      data.created_at,
      null,
      null,
      data.id_creator,
      null,
    );
  }

  /**
   * Reconstitutes a ProductType from database data (no validation)
   */
  static reconstitute(data: IProductType): ProductTypeModel {
    return new ProductTypeModel(
      data.id,
      data.name,
      data.created_at,
      data.updated_at ?? null,
      data.deleted_at ?? null,
      data.id_creator ?? null,
      data.id_updater ?? null,
    );
  }

  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================

  private static validateName(name: string): void {
    if (!name?.trim()) {
      throw new DomainValidationException(
        ProductTypeErrorCodes.PRODUCT_TYPE_VALIDATION_NAME_REQUIRED,
        { field: 'name' },
      );
    }
    if (name.trim().length > ProductTypeModel.MAX_NAME_LENGTH) {
      throw new DomainValidationException(
        ProductTypeErrorCodes.PRODUCT_TYPE_VALIDATION_NAME_TOO_LONG,
        { field: 'name', max: ProductTypeModel.MAX_NAME_LENGTH },
      );
    }
  }

  // ============================================================================
  // BUSINESS OPERATIONS
  // ============================================================================

  /**
   * Updates the product type name
   */
  updateName(name: string, updaterId: string): void {
    ProductTypeModel.validateName(name);
    this.name = name.trim();
    this.idUpdater = updaterId;
    this.updatedAt = new Date();
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  getId(): string {
    return this.id;
  }
  getName(): string {
    return this.name;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date | null {
    return this.updatedAt;
  }
  getDeletedAt(): Date | null {
    return this.deletedAt;
  }
  getCreatorId(): string | null {
    return this.idCreator;
  }
  getUpdaterId(): string | null {
    return this.idUpdater;
  }

  // ============================================================================
  // CONVERSION
  // ============================================================================

  toEntity(): IProductType {
    return {
      id: this.id,
      name: this.name,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      deleted_at: this.deletedAt,
      id_creator: this.idCreator,
      id_updater: this.idUpdater,
    };
  }
}
