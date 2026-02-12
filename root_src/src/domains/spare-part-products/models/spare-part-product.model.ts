import {
  BaseDomainModel,
  DomainValidationException,
} from '../../../common/domain';
import { SparePartProductErrorCodes } from '../constants';
import {
  ISparePartProduct,
  ISparePartProductCreate,
} from '../interfaces/spare-part-product.interface';

/**
 * Spare Part Product Domain Model
 *
 * Rich domain model that encapsulates all business logic, validation rules,
 * and state management for spare-part-specific product data.
 *
 * Business Rules:
 * - brand is optional (max 255 chars)
 * - grade must be one of: genuine, aftermarket (if provided)
 * - Uses product_id as PK (1:1 with base product)
 *
 * @class SparePartProductModel
 * @extends {BaseDomainModel<ISparePartProduct>}
 * @version 1.0.0
 * @since 2026-02-12
 */
export class SparePartProductModel extends BaseDomainModel<ISparePartProduct> {
  private static readonly MAX_BRAND_LENGTH = 255;
  private static readonly VALID_GRADES = ['genuine', 'aftermarket'];

  private constructor(
    private readonly productId: string,
    private brand: string | null,
    private grade: string | null,
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
   * Creates a new SparePartProduct with validation
   */
  static create(data: ISparePartProductCreate): SparePartProductModel {
    if (data.brand !== undefined && data.brand !== null) {
      SparePartProductModel.validateBrand(data.brand);
    }
    if (data.grade !== undefined && data.grade !== null) {
      SparePartProductModel.validateGrade(data.grade);
    }

    return new SparePartProductModel(
      data.product_id,
      data.brand?.trim() || null,
      data.grade || null,
      null,
      null,
      data.id_creator,
      null,
    );
  }

  /**
   * Reconstitutes a SparePartProduct from database data (no validation)
   */
  static reconstitute(data: ISparePartProduct): SparePartProductModel {
    return new SparePartProductModel(
      data.product_id,
      data.brand ?? null,
      data.grade ?? null,
      data.updated_at ?? null,
      data.deleted_at ?? null,
      data.id_creator ?? null,
      data.id_updater ?? null,
    );
  }

  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================

  private static validateBrand(brand: string): void {
    if (brand.trim().length > SparePartProductModel.MAX_BRAND_LENGTH) {
      throw new DomainValidationException(
        SparePartProductErrorCodes.SPARE_PART_PRODUCT_VALIDATION_BRAND_TOO_LONG,
        { field: 'brand', max: SparePartProductModel.MAX_BRAND_LENGTH },
      );
    }
  }

  private static validateGrade(grade: string): void {
    if (!SparePartProductModel.VALID_GRADES.includes(grade)) {
      throw new DomainValidationException(
        SparePartProductErrorCodes.SPARE_PART_PRODUCT_VALIDATION_GRADE_INVALID,
        {
          field: 'grade',
          value: grade,
          allowed: SparePartProductModel.VALID_GRADES,
        },
      );
    }
  }

  // ============================================================================
  // BUSINESS OPERATIONS
  // ============================================================================

  /**
   * Updates spare part product details
   */
  updateDetails(data: {
    brand?: string | null;
    grade?: string | null;
    updaterId: string;
  }): void {
    if (data.brand !== undefined) {
      if (data.brand !== null) {
        SparePartProductModel.validateBrand(data.brand);
        this.brand = data.brand.trim();
      } else {
        this.brand = null;
      }
    }
    if (data.grade !== undefined) {
      if (data.grade !== null) {
        SparePartProductModel.validateGrade(data.grade);
        this.grade = data.grade;
      } else {
        this.grade = null;
      }
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
  getBrand(): string | null {
    return this.brand;
  }
  getGrade(): string | null {
    return this.grade;
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

  toEntity(): ISparePartProduct {
    return {
      product_id: this.productId,
      brand: this.brand,
      grade: this.grade,
      updated_at: this.updatedAt,
      deleted_at: this.deletedAt,
      id_creator: this.idCreator,
      id_updater: this.idUpdater,
    };
  }
}
