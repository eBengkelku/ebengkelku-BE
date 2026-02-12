import {
  BaseDomainModel,
  DomainValidationException,
} from '../../../common/domain';
import { BusinessProductErrorCodes } from '../constants';
import {
  IBusinessProduct,
  IBusinessProductCreate,
} from '../interfaces/business-product.interface';

/**
 * Business Product Domain Model
 *
 * Rich domain model that encapsulates all business logic, validation rules,
 * and state management for business-scoped products.
 *
 * Business Rules:
 * - Name is required and cannot be empty (max 255 chars)
 * - Price must be a positive integer (>= 1)
 * - Status must be one of: active, draft, archived
 * - Must belong to a valid business and category
 *
 * @class BusinessProductModel
 * @extends {BaseDomainModel<IBusinessProduct>}
 * @version 1.0.0
 * @since 2026-02-12
 */
export class BusinessProductModel extends BaseDomainModel<IBusinessProduct> {
  private static readonly MAX_NAME_LENGTH = 255;
  private static readonly VALID_STATUSES = ['active', 'draft', 'archived'];

  private constructor(
    private readonly id: string,
    private name: string,
    private description: string | null,
    private price: number,
    private unit: string,
    private status: string,
    private readonly businessId: string,
    private categoryId: string,
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
   * Creates a new BusinessProduct with validation
   */
  static create(data: IBusinessProductCreate): BusinessProductModel {
    BusinessProductModel.validateName(data.name);
    BusinessProductModel.validatePrice(data.price);
    BusinessProductModel.validateStatus(data.status);

    return new BusinessProductModel(
      data.id,
      data.name.trim(),
      data.description?.trim() || null,
      data.price,
      data.unit || 'pcs',
      data.status,
      data.business_id,
      data.category_id,
      data.created_at,
      null,
      null,
      data.id_creator,
      null,
    );
  }

  /**
   * Reconstitutes a BusinessProduct from database data (no validation)
   */
  static reconstitute(data: IBusinessProduct): BusinessProductModel {
    return new BusinessProductModel(
      data.id,
      data.name,
      data.description ?? null,
      data.price,
      data.unit,
      data.status,
      data.business_id,
      data.category_id,
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
        BusinessProductErrorCodes.BUSINESS_PRODUCT_VALIDATION_NAME_REQUIRED,
        { field: 'name' },
      );
    }
    if (name.trim().length > BusinessProductModel.MAX_NAME_LENGTH) {
      throw new DomainValidationException(
        BusinessProductErrorCodes.BUSINESS_PRODUCT_VALIDATION_NAME_TOO_LONG,
        { field: 'name', max: BusinessProductModel.MAX_NAME_LENGTH },
      );
    }
  }

  private static validatePrice(price: number): void {
    if (!Number.isInteger(price) || price < 1) {
      throw new DomainValidationException(
        BusinessProductErrorCodes.BUSINESS_PRODUCT_VALIDATION_PRICE_NOT_POSITIVE,
        { field: 'price', value: price },
      );
    }
  }

  private static validateStatus(status: string): void {
    if (!BusinessProductModel.VALID_STATUSES.includes(status)) {
      throw new DomainValidationException(
        BusinessProductErrorCodes.BUSINESS_PRODUCT_VALIDATION_STATUS_INVALID,
        {
          field: 'status',
          value: status,
          allowed: BusinessProductModel.VALID_STATUSES,
        },
      );
    }
  }

  // ============================================================================
  // BUSINESS OPERATIONS
  // ============================================================================

  /**
   * Updates product details
   */
  updateDetails(data: {
    name?: string;
    description?: string | null;
    price?: number;
    unit?: string;
    status?: string;
    categoryId?: string;
    updaterId: string;
  }): void {
    if (data.name !== undefined) {
      BusinessProductModel.validateName(data.name);
      this.name = data.name.trim();
    }
    if (data.description !== undefined) {
      this.description = data.description?.trim() || null;
    }
    if (data.price !== undefined) {
      BusinessProductModel.validatePrice(data.price);
      this.price = data.price;
    }
    if (data.unit !== undefined) {
      this.unit = data.unit;
    }
    if (data.status !== undefined) {
      BusinessProductModel.validateStatus(data.status);
      this.status = data.status;
    }
    if (data.categoryId !== undefined) {
      this.categoryId = data.categoryId;
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
  getPrice(): number {
    return this.price;
  }
  getUnit(): string {
    return this.unit;
  }
  getStatus(): string {
    return this.status;
  }
  getBusinessId(): string {
    return this.businessId;
  }
  getCategoryId(): string {
    return this.categoryId;
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

  toEntity(): IBusinessProduct {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      unit: this.unit,
      status: this.status,
      business_id: this.businessId,
      category_id: this.categoryId,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      deleted_at: this.deletedAt,
      id_creator: this.idCreator,
      id_updater: this.idUpdater,
    };
  }
}
