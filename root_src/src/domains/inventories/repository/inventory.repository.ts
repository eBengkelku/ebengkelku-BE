import { Injectable } from '@nestjs/common';
import { BaseDomainRepository } from '../../../common/domain/base-domain.repository';
import { DatabaseService } from '../../../database/database.service';
import { InventoryModel } from '../models/inventory.model';
import {
  IInventory,
  IInventoryWithProduct,
} from '../interfaces/inventory.interface';
import { Knex } from 'knex';

/**
 * Inventory Repository
 *
 * Repository for managing inventory persistence and data access.
 *
 * @class InventoryRepository
 * @extends {BaseDomainRepository<InventoryModel, IInventory>}
 * @version 1.0.0
 * @since 2026-02-12
 */
@Injectable()
export class InventoryRepository extends BaseDomainRepository<
  InventoryModel,
  IInventory
> {
  protected tableName = 'product.inventories';

  constructor(databaseService: DatabaseService) {
    super(databaseService, {
      entityName: 'Inventory',
      tableName: 'product.inventories',
      primaryKey: 'id',
      timestampColumns: {
        created: 'id', // inventories has no created_at column
        updated: 'updated_at',
        deleted: 'deleted_at',
      },
      softDelete: true,
      descColumns: [],
    });
  }

  // ============================================================================
  // REQUIRED ABSTRACT METHOD IMPLEMENTATIONS
  // ============================================================================

  async findById(id: string | number): Promise<InventoryModel | null> {
    const row = await this.baseQuery()
      .where(`${this.tableName}.id`, id)
      .first();
    return row ? InventoryModel.reconstitute(row) : null;
  }

  async findAll(pagination: {
    page: number;
    limit: number;
  }): Promise<{ data: InventoryModel[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const [{ count }] = await this.baseQuery().count('* as count');
    const total = Number.parseInt(count as string, 10);

    const rows = await this.baseQuery()
      .orderBy(`${this.tableName}.id`, 'desc')
      .limit(limit)
      .offset(offset);

    const data = rows.map((row: IInventory) =>
      InventoryModel.reconstitute(row),
    );
    return { data, total };
  }

  protected async insert(entity: IInventory): Promise<void> {
    await this.knex(this.tableName).insert(entity);
  }

  protected async update(entity: IInventory): Promise<void> {
    await this.knex(this.tableName)
      .where('id', entity.id)
      .update({
        ...entity,
        updated_at: new Date(),
      });
  }

  protected async exists(id: string | number): Promise<boolean> {
    const row = await this.knex(this.tableName).where('id', id).first();
    return !!row;
  }

  protected async softDelete(id: string | number): Promise<void> {
    await this.knex(this.tableName)
      .where('id', id)
      .update({ deleted_at: new Date() });
  }

  protected async hardDelete(id: string | number): Promise<void> {
    await this.knex(this.tableName).where('id', id).delete();
  }

  // ============================================================================
  // CUSTOM METHODS
  // ============================================================================

  /**
   * Find all inventories for a business with LEFT JOIN to products
   * Supports pagination and optional low_stock filter
   */
  async findAllByBusiness(
    businessId: string,
    pagination: { page: number; limit: number },
    filters?: { low_stock?: boolean },
  ): Promise<{ data: IInventoryWithProduct[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    let baseQuery = this.knex(this.tableName)
      .leftJoin('product.products as p', `${this.tableName}.product_id`, 'p.id')
      .where('p.business_id', businessId)
      .whereNull(`${this.tableName}.deleted_at`)
      .whereNull('p.deleted_at');

    if (filters?.low_stock) {
      baseQuery = baseQuery.whereRaw(
        `${this.tableName}.quantity < ${this.tableName}.min_stock`,
      );
    }

    const countResult = await baseQuery.clone().count('* as count');
    const total = Number.parseInt(countResult[0].count as string, 10);

    const rows = await baseQuery
      .select(
        `${this.tableName}.*`,
        'p.id as prod_id',
        'p.name as prod_name',
        'p.description as prod_description',
        'p.price as prod_price',
        'p.unit as prod_unit',
        'p.status as prod_status',
        'p.business_id as prod_business_id',
        'p.category_id as prod_category_id',
      )
      .orderBy(`${this.tableName}.id`, 'desc')
      .limit(limit)
      .offset(offset);

    const data = rows.map((row: any) => this.mapRowToInventoryWithProduct(row));
    return { data, total };
  }

  /**
   * Find an inventory by product_id with LEFT JOIN to base products
   */
  async findByProductIdWithProduct(
    productId: string,
    businessId: string,
  ): Promise<IInventoryWithProduct | null> {
    const row = await this.knex(this.tableName)
      .where(`${this.tableName}.product_id`, productId)
      .whereNull(`${this.tableName}.deleted_at`)
      .leftJoin('product.products as p', `${this.tableName}.product_id`, 'p.id')
      .where('p.business_id', businessId)
      .whereNull('p.deleted_at')
      .select(
        `${this.tableName}.*`,
        'p.id as prod_id',
        'p.name as prod_name',
        'p.description as prod_description',
        'p.price as prod_price',
        'p.unit as prod_unit',
        'p.status as prod_status',
        'p.business_id as prod_business_id',
        'p.category_id as prod_category_id',
      )
      .first();

    if (!row) return null;

    return this.mapRowToInventoryWithProduct(row);
  }

  /**
   * Find inventory by product_id (without joining)
   */
  async findByProductId(productId: string): Promise<InventoryModel | null> {
    const row = await this.baseQuery()
      .where(`${this.tableName}.product_id`, productId)
      .first();
    return row ? InventoryModel.reconstitute(row) : null;
  }

  /**
   * Checks if an inventory already exists for this product_id
   */
  async inventoryExists(productId: string): Promise<boolean> {
    const result = await this.knex(this.tableName)
      .where('product_id', productId)
      .whereNull('deleted_at')
      .first();
    return !!result;
  }

  /**
   * Validates that a product exists and belongs to the specified business
   */
  async findProductByIdAndBusiness(
    productId: string,
    businessId: string,
  ): Promise<any | null> {
    return this.knex('product.products')
      .where('id', productId)
      .where('business_id', businessId)
      .whereNull('deleted_at')
      .first();
  }

  /**
   * Resolves core.users.id from public_id (JWT sub)
   */
  async findUserIdByPublicId(
    publicId: string,
    trx?: Knex | Knex.Transaction,
  ): Promise<string | null> {
    const row = await (trx || this.knex)('core.users')
      .where('public_id', publicId)
      .whereNull('deleted_at')
      .select('id')
      .first();
    return row?.id ?? null;
  }

  /**
   * Insert an inventory (public method for transactional use)
   */
  async insertInventory(
    entity: IInventory,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await (trx || this.knex)(this.tableName).insert(entity);
  }

  /**
   * Public method to update an inventory
   */
  async updateInventory(entity: IInventory): Promise<void> {
    await this.update(entity);
  }

  /**
   * Public method to soft delete an inventory
   */
  async softDeleteInventory(id: string): Promise<void> {
    await this.softDelete(id);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private mapRowToInventoryWithProduct(row: any): IInventoryWithProduct {
    return {
      id: row.id,
      product_id: row.product_id,
      quantity: row.quantity,
      min_stock: row.min_stock,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
      id_creator: row.id_creator,
      id_updater: row.id_updater,
      product: row.prod_id
        ? {
            id: row.prod_id,
            name: row.prod_name,
            description: row.prod_description,
            price: row.prod_price,
            unit: row.prod_unit,
            status: row.prod_status,
            business_id: row.prod_business_id,
            category_id: row.prod_category_id,
          }
        : null,
    };
  }
}
