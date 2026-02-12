import { Injectable } from '@nestjs/common';
import { BaseDomainRepository } from '../../../common/domain/base-domain.repository';
import { DatabaseService } from '../../../database/database.service';
import { ToolProductModel } from '../models/tool-product.model';
import {
  IToolProduct,
  IToolProductWithBaseProduct,
} from '../interfaces/tool-product.interface';
import { Knex } from 'knex';

/**
 * Tool Product Repository
 *
 * Repository for managing tool-product-specific persistence and data access.
 *
 * @class ToolProductRepository
 * @extends {BaseDomainRepository<ToolProductModel, IToolProduct>}
 * @version 1.0.0
 * @since 2026-02-12
 */
@Injectable()
export class ToolProductRepository extends BaseDomainRepository<
  ToolProductModel,
  IToolProduct
> {
  protected tableName = 'product.tool_products';

  constructor(databaseService: DatabaseService) {
    super(databaseService, {
      entityName: 'ToolProduct',
      tableName: 'product.tool_products',
      primaryKey: 'product_id',
      timestampColumns: {
        created: 'product_id', // tool_products has no created_at column
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

  async findById(id: string | number): Promise<ToolProductModel | null> {
    const row = await this.baseQuery()
      .where(`${this.tableName}.product_id`, id)
      .first();
    return row ? ToolProductModel.reconstitute(row) : null;
  }

  async findAll(pagination: {
    page: number;
    limit: number;
  }): Promise<{ data: ToolProductModel[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const [{ count }] = await this.baseQuery().count('* as count');
    const total = parseInt(count as string, 10);

    const rows = await this.baseQuery()
      .orderBy(`${this.tableName}.product_id`, 'desc')
      .limit(limit)
      .offset(offset);

    const data = rows.map((row: IToolProduct) =>
      ToolProductModel.reconstitute(row),
    );
    return { data, total };
  }

  protected async insert(entity: IToolProduct): Promise<void> {
    await this.knex(this.tableName).insert(entity);
  }

  protected async update(entity: IToolProduct): Promise<void> {
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
   * Find a tool product by product_id with LEFT JOIN to base products
   */
  async findByProductIdWithBaseProduct(
    productId: string,
    businessId: string,
  ): Promise<IToolProductWithBaseProduct | null> {
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

    return this.mapRowToToolProductWithBaseProduct(row);
  }

  /**
   * Checks if a tool product already exists for this product_id
   */
  async toolProductExists(productId: string): Promise<boolean> {
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
   * Insert a tool product (public method for transactional use)
   */
  async insertToolProduct(
    entity: IToolProduct,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await (trx || this.knex)(this.tableName).insert(entity);
  }

  /**
   * Public method to update a tool product
   */
  async updateToolProduct(entity: IToolProduct): Promise<void> {
    await this.update(entity);
  }

  /**
   * Public method to soft delete a tool product
   */
  async softDeleteToolProduct(productId: string): Promise<void> {
    await this.softDelete(productId);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private mapRowToToolProductWithBaseProduct(
    row: any,
  ): IToolProductWithBaseProduct {
    return {
      product_id: row.product_id,
      warranty_months: row.warranty_months,
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
