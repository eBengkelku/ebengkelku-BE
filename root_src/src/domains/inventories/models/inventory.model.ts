import {
  BaseDomainModel,
  DomainValidationException,
} from '../../../common/domain';
import { InventoryErrorCodes } from '../constants';
import {
  IInventory,
  IInventoryCreate,
} from '../interfaces/inventory.interface';

/**
 * Inventory Domain Model
 *
 * Rich domain model that encapsulates all business logic, validation rules,
 * and state management for inventory data.
 *
 * Business Rules:
 * - quantity must be a non-negative integer (>= 0)
 * - min_stock must be a non-negative integer (>= 0)
 * - Has its own UUID PK (id)
 *
 * @class InventoryModel
 * @extends {BaseDomainModel<IInventory>}
 * @version 1.0.0
 * @since 2026-02-12
 */
export class InventoryModel extends BaseDomainModel<IInventory> {
  private constructor(
    private readonly id: string,
    private readonly productId: string,
    private quantity: number,
    private minStock: number,
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
   * Creates a new Inventory with validation
   */
  static create(data: IInventoryCreate): InventoryModel {
    InventoryModel.validateQuantity(data.quantity);
    InventoryModel.validateMinStock(data.min_stock);

    return new InventoryModel(
      data.id,
      data.product_id,
      data.quantity,
      data.min_stock,
      null,
      null,
      data.id_creator,
      null,
    );
  }

  /**
   * Reconstitutes an Inventory from database data (no validation)
   */
  static reconstitute(data: IInventory): InventoryModel {
    return new InventoryModel(
      data.id,
      data.product_id,
      data.quantity,
      data.min_stock,
      data.updated_at ?? null,
      data.deleted_at ?? null,
      data.id_creator ?? null,
      data.id_updater ?? null,
    );
  }

  // ============================================================================
  // VALIDATION HELPERS
  // ============================================================================

  private static validateQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new DomainValidationException(
        InventoryErrorCodes.INVENTORY_VALIDATION_QUANTITY_NEGATIVE,
        { field: 'quantity', value: quantity },
      );
    }
  }

  private static validateMinStock(minStock: number): void {
    if (!Number.isInteger(minStock) || minStock < 0) {
      throw new DomainValidationException(
        InventoryErrorCodes.INVENTORY_VALIDATION_MIN_STOCK_NEGATIVE,
        { field: 'min_stock', value: minStock },
      );
    }
  }

  // ============================================================================
  // BUSINESS OPERATIONS
  // ============================================================================

  /**
   * Updates inventory details
   */
  updateDetails(data: {
    quantity?: number;
    minStock?: number;
    updaterId: string;
  }): void {
    if (data.quantity !== undefined) {
      InventoryModel.validateQuantity(data.quantity);
      this.quantity = data.quantity;
    }
    if (data.minStock !== undefined) {
      InventoryModel.validateMinStock(data.minStock);
      this.minStock = data.minStock;
    }
    this.idUpdater = data.updaterId;
    this.updatedAt = new Date();
  }

  /**
   * Checks if the current stock is below the minimum stock threshold
   */
  isLowStock(): boolean {
    return this.quantity < this.minStock;
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  getId(): string {
    return this.id;
  }
  getProductId(): string {
    return this.productId;
  }
  getQuantity(): number {
    return this.quantity;
  }
  getMinStock(): number {
    return this.minStock;
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

  toEntity(): IInventory {
    return {
      id: this.id,
      product_id: this.productId,
      quantity: this.quantity,
      min_stock: this.minStock,
      updated_at: this.updatedAt,
      deleted_at: this.deletedAt,
      id_creator: this.idCreator,
      id_updater: this.idUpdater,
    };
  }
}
