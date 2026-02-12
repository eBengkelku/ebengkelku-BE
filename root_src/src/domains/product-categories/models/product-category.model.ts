import {
  BaseDomainModel,
  DomainValidationException,
} from '../../../common/domain';
import { ProductCategoryErrorCodes } from '../constants';
import {
  IProductCategory,
  IProductCategoryCreate,
} from '../interfaces/product-category.interface';

/**
 * Product Category Domain Model
 *
 * Rich domain model that encapsulates all business logic, validation rules,
 * and state management for product categories.
 *
 * Business Rules:
 * - Name is required and cannot be empty
 * - Name max length is 255 characters
 * - Must belong to a valid product type
 *
 * @class ProductCategoryModel
 * @extends {BaseDomainModel<IProductCategory>}
 * @version 1.0.0
 * @since 2026-02-12
 */
export class ProductCategoryModel extends BaseDomainModel<IProductCategory> {
  private static readonly MAX_NAME_LENGTH = 255;

  private constructor(
    private readonly id: string,
    private name: string,
    private description: string | null,
    private productTypeId: string,
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
   * Creates a new ProductCategory with validation
   */
  static create(data: IProductCategoryCreate): ProductCategoryModel {
    ProductCategoryModel.validateName(data.name);

    return new ProductCategoryModel(
      data.id,
      data.name.trim(),
      data.description?.trim() || null,
      data.product_type_id,
      data.created_at,
      null,
      null,
      data.id_creator,
      null,
    );
  }

  /**
   * Reconstitutes a ProductCategory from database data (no validation)
   */
  static reconstitute(data: IProductCategory): ProductCategoryModel {
    return new ProductCategoryModel(
      data.id,
      data.name,
      data.description ?? null,
      data.product_type_id,
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
        ProductCategoryErrorCodes.PRODUCT_CATEGORY_VALIDATION_NAME_REQUIRED,
        { field: 'name' },
      );
    }
    if (name.trim().length > ProductCategoryModel.MAX_NAME_LENGTH) {
      throw new DomainValidationException(
        ProductCategoryErrorCodes.PRODUCT_CATEGORY_VALIDATION_NAME_TOO_LONG,
        { field: 'name', max: ProductCategoryModel.MAX_NAME_LENGTH },
      );
    }
  }

  // ============================================================================
  // BUSINESS OPERATIONS
  // ============================================================================

  /**
   * Updates product category details
   */
  updateDetails(data: {
    name?: string;
    description?: string | null;
    productTypeId?: string;
    updaterId: string;
  }): void {
    if (data.name !== undefined) {
      ProductCategoryModel.validateName(data.name);
      this.name = data.name.trim();
    }
    if (data.description !== undefined) {
      this.description = data.description?.trim() || null;
    }
    if (data.productTypeId !== undefined) {
      this.productTypeId = data.productTypeId;
    }
    this.idUpdater = data.updaterId;
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
  getDescription(): string | null {
    return this.description;
  }
  getProductTypeId(): string {
    return this.productTypeId;
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

  toEntity(): IProductCategory {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      product_type_id: this.productTypeId,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      deleted_at: this.deletedAt,
      id_creator: this.idCreator,
      id_updater: this.idUpdater,
    };
  }
}
