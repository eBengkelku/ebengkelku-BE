import { Injectable } from '@nestjs/common';
import { BaseDomainRepository } from '../../../common/domain/base-domain.repository';
import { DatabaseService } from '../../../database/database.service';
import { SparePartProductModel } from '../models/spare-part-product.model';
import {
  ISparePartProduct,
  ISparePartProductWithBaseProduct,
} from '../interfaces/spare-part-product.interface';
import { Knex } from 'knex';

/**
 * Spare Part Product Repository
 *
 * Repository for managing spare-part-product-specific persistence and data access.
 *
 * @class SparePartProductRepository
 * @extends {BaseDomainRepository<SparePartProductModel, ISparePartProduct>}
 * @version 1.0.0
 * @since 2026-02-12
 */
@Injectable()
export class SparePartProductRepository extends BaseDomainRepository<
  SparePartProductModel,
  ISparePartProduct
> {
  protected tableName = 'product.spare_part_products';

  constructor(databaseService: DatabaseService) {
    super(databaseService, {
      entityName: 'SparePartProduct',
      tableName: 'product.spare_part_products',
      primaryKey: 'product_id',
      timestampColumns: {
        created: 'product_id', // spare_part_products has no created_at column
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

  async findById(id: string | number): Promise<SparePartProductModel | null> {
    const row = await this.baseQuery()
      .where(`${this.tableName}.product_id`, id)
      .first();
    return row ? SparePartProductModel.reconstitute(row) : null;
  }

  async findAll(pagination: {
    page: number;
    limit: number;
  }): Promise<{ data: SparePartProductModel[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const [{ count }] = await this.baseQuery().count('* as count');
    const total = parseInt(count as string, 10);

    const rows = await this.baseQuery()
      .orderBy(`${this.tableName}.product_id`, 'desc')
      .limit(limit)
      .offset(offset);

    const data = rows.map((row: ISparePartProduct) =>
      SparePartProductModel.reconstitute(row),
    );
    return { data, total };
  }

  protected async insert(entity: ISparePartProduct): Promise<void> {
    await this.knex(this.tableName).insert(entity);
  }

  protected async update(entity: ISparePartProduct): Promise<void> {
    await this.knex(this.tableName)
      .where('product_id', entity.product_id)
      .update({
        ...entity,
        updated_at: new Date(),
      });
  }

  protected async exists(id: string | number): Promise<boolean> {
    const row = await this.knex(this.tableName).where('product_id', id).first();
    return !!row;
  }

  protected async softDelete(id: string | number): Promise<void> {
    await this.knex(this.tableName)
      .where('product_id', id)
      .update({ deleted_at: new Date() });
  }

  protected async hardDelete(id: string | number): Promise<void> {
    await this.knex(this.tableName).where('product_id', id).delete();
  }

  // ============================================================================
  // CUSTOM METHODS
  // ============================================================================

  /**
   * Find all spare part products for a business with LEFT JOIN to base products
   */
  async findAllByBusiness(
    businessId: string,
    pagination: { page: number; limit: number },
  ): Promise<{ data: ISparePartProductWithBaseProduct[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    // Count query
    const [{ count }] = await this.knex(this.tableName)
      .leftJoin('product.products as p', `${this.tableName}.product_id`, 'p.id')
      .where('p.business_id', businessId)
      .whereNull(`${this.tableName}.deleted_at`)
      .whereNull('p.deleted_at')
      .count('* as count');

    const total = parseInt(count as string, 10);

    // Data query with LEFT JOIN
    const rows = await this.knex(this.tableName)
      .leftJoin('product.products as p', `${this.tableName}.product_id`, 'p.id')
      .where('p.business_id', businessId)
      .whereNull(`${this.tableName}.deleted_at`)
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
      .orderBy(`${this.tableName}.product_id`, 'desc')
      .limit(limit)
      .offset(offset);

    const data: ISparePartProductWithBaseProduct[] = rows.map((row: any) =>
      this.mapRowToSparePartProductWithBaseProduct(row),
    );

    return { data, total };
  }

  /**
   * Find a spare part product by product_id with LEFT JOIN to base products
   */
  async findByProductIdWithBaseProduct(
    productId: string,
    businessId: string,
  ): Promise<ISparePartProductWithBaseProduct | null> {
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

    return this.mapRowToSparePartProductWithBaseProduct(row);
  }

  /**
   * Checks if a spare part product already exists for this product_id
   */
  async sparePartProductExists(productId: string): Promise<boolean> {
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
   * Insert a spare part product (public method for transactional use)
   */
  async insertSparePartProduct(
    entity: ISparePartProduct,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await (trx || this.knex)(this.tableName).insert(entity);
  }

  /**
   * Public method to update a spare part product
   */
  async updateSparePartProduct(entity: ISparePartProduct): Promise<void> {
    await this.update(entity);
  }

  /**
   * Public method to soft delete a spare part product
   */
  async softDeleteSparePartProduct(productId: string): Promise<void> {
    await this.softDelete(productId);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private mapRowToSparePartProductWithBaseProduct(
    row: any,
  ): ISparePartProductWithBaseProduct {
    return {
      product_id: row.product_id,
      brand: row.brand,
      grade: row.grade,
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
