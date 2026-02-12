import {
  BaseDomainModel,
  DomainValidationException,
} from '../../../common/domain';
import { ToolProductErrorCodes } from '../constants';
import {
  IToolProduct,
  IToolProductCreate,
} from '../interfaces/tool-product.interface';

/**
 * Tool Product Domain Model
 *
 * Rich domain model that encapsulates all business logic, validation rules,
 * and state management for tool-specific product data.
 *
 * Business Rules:
 * - warranty_months must be a non-negative integer (>= 0)
 * - Uses product_id as PK (1:1 with base product)
 *
 * @class ToolProductModel
 * @extends {BaseDomainModel<IToolProduct>}
 * @version 1.0.0
 * @since 2026-02-12
 */
export class ToolProductModel extends BaseDomainModel<IToolProduct> {
  private constructor(
    private readonly productId: string,
    private warrantyMonths: number,
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
   * Creates a new ToolProduct with validation
   */
  static create(data: IToolProductCreate): ToolProductModel {
    ToolProductModel.validateWarrantyMonths(data.warranty_months);

    return new ToolProductModel(
      data.product_id,
      data.warranty_months,
      null,
      null,
      data.id_creator,
      null,
    );
  }

  /**
   * Reconstitutes a ToolProduct from database data (no validation)
   */
  static reconstitute(data: IToolProduct): ToolProductModel {
    return new ToolProductModel(
      data.product_id,
      data.warranty_months,
      data.updated_at ?? null,
      data.deleted_at ?? null,
      data.id_creator ?? null,
      data.id_updater ?? null,
    );
  }

  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================

  private static validateWarrantyMonths(months: number): void {
    if (!Number.isInteger(months) || months < 0) {
      throw new DomainValidationException(
        ToolProductErrorCodes.TOOL_PRODUCT_VALIDATION_WARRANTY_MONTHS_NEGATIVE,
        { field: 'warranty_months', value: months },
      );
    }
  }

  // ============================================================================
  // BUSINESS OPERATIONS
  // ============================================================================

  /**
   * Updates tool product details
   */
  updateDetails(data: { warrantyMonths?: number; updaterId: string }): void {
    if (data.warrantyMonths !== undefined) {
      ToolProductModel.validateWarrantyMonths(data.warrantyMonths);
      this.warrantyMonths = data.warrantyMonths;
    }
    this.idUpdater = data.updaterId;
    this.updatedAt = new Date();
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  getProductId(): string {
    return this.productId;
  }
  getWarrantyMonths(): number {
    return this.warrantyMonths;
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

  toEntity(): IToolProduct {
    return {
      product_id: this.productId,
      warranty_months: this.warrantyMonths,
      updated_at: this.updatedAt,
      deleted_at: this.deletedAt,
      id_creator: this.idCreator,
      id_updater: this.idUpdater,
    };
  }
}
