import { Injectable } from '@nestjs/common';
import { BaseDomainRepository } from '../../../common/domain/base-domain.repository';
import { DatabaseService } from '../../../database/database.service';
import { BusinessProductModel } from '../models/business-product.model';
import {
  IBusinessProduct,
  IBusinessProductWithCategory,
} from '../interfaces/business-product.interface';
import { Knex } from 'knex';

/**
 * Business Product Repository
 *
 * Repository for managing business-scoped product persistence and data access.
 *
 * @class BusinessProductRepository
 * @extends {BaseDomainRepository<BusinessProductModel, IBusinessProduct>}
 * @version 1.0.0
 * @since 2026-02-12
 */
@Injectable()
export class BusinessProductRepository extends BaseDomainRepository<
  BusinessProductModel,
  IBusinessProduct
> {
  protected tableName = 'product.products';

  constructor(databaseService: DatabaseService) {
    super(databaseService, {
      entityName: 'BusinessProduct',
      tableName: 'product.products',
      primaryKey: 'id',
      timestampColumns: {
        created: 'created_at',
        updated: 'updated_at',
        deleted: 'deleted_at',
      },
      softDelete: true,
      descColumns: ['name'],
    });
  }

  // ============================================================================
  // REQUIRED ABSTRACT METHOD IMPLEMENTATIONS
  // ============================================================================

  async findById(id: string | number): Promise<BusinessProductModel | null> {
    const row = await this.baseQuery()
      .where(`${this.tableName}.id`, id)
      .first();
    return row ? BusinessProductModel.reconstitute(row) : null;
  }

  async findAll(pagination: {
    page: number;
    limit: number;
  }): Promise<{ data: BusinessProductModel[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const [{ count }] = await this.baseQuery().count('* as count');
    const total = parseInt(count as string, 10);

    const rows = await this.baseQuery()
      .orderBy(
        `${this.tableName}.${this.config.timestampColumns.created}`,
        'desc',
      )
      .limit(limit)
      .offset(offset);

    const data = rows.map((row: IBusinessProduct) =>
      BusinessProductModel.reconstitute(row),
    );
    return { data, total };
  }

  protected async insert(entity: IBusinessProduct): Promise<void> {
    await this.knex(this.tableName).insert(entity);
  }

  protected async update(entity: IBusinessProduct): Promise<void> {
    await this.knex(this.tableName)
      .where(this.config.primaryKey, entity.id)
      .update({
        ...entity,
        [this.config.timestampColumns.updated]: new Date(),
      });
  }

  protected async exists(id: string | number): Promise<boolean> {
    const row = await this.knex(this.tableName)
      .where(this.config.primaryKey, id)
      .first();
    return !!row;
  }

  protected async softDelete(id: string | number): Promise<void> {
    await this.knex(this.tableName)
      .where(this.config.primaryKey, id)
      .update({ [this.config.timestampColumns.deleted!]: new Date() });
  }

  protected async hardDelete(id: string | number): Promise<void> {
    await this.knex(this.tableName).where(this.config.primaryKey, id).delete();
  }

  // ============================================================================
  // CUSTOM METHODS
  // ============================================================================

  /**
   * Find a product by ID with LEFT JOIN to product category, scoped to a business
   */
  async findByIdWithCategory(
    id: string,
    businessId: string,
  ): Promise<IBusinessProductWithCategory | null> {
    const row = await this.knex(this.tableName)
      .where(`${this.tableName}.id`, id)
      .where(`${this.tableName}.business_id`, businessId)
      .whereNull(`${this.tableName}.deleted_at`)
      .leftJoin(
        'product.product_categories as pc',
        `${this.tableName}.category_id`,
        'pc.id',
      )
      .select(`${this.tableName}.*`, 'pc.id as cat_id', 'pc.name as cat_name')
      .first();

    if (!row) return null;

    return this.mapRowToProductWithCategory(row);
  }

  /**
   * Find all products for a business with pagination, filters, and LEFT JOIN to category
   */
  async findAllByBusiness(
    businessId: string,
    pagination: { page: number; limit: number },
    filters?: { status?: string; category_id?: string },
  ): Promise<{ data: IBusinessProductWithCategory[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    // Count query
    let countQuery = this.baseQuery().where(
      `${this.tableName}.business_id`,
      businessId,
    );

    // Data query with LEFT JOIN
    let dataQuery = this.knex(this.tableName)
      .where(`${this.tableName}.business_id`, businessId)
      .whereNull(`${this.tableName}.deleted_at`)
      .leftJoin(
        'product.product_categories as pc',
        `${this.tableName}.category_id`,
        'pc.id',
      )
      .select(`${this.tableName}.*`, 'pc.id as cat_id', 'pc.name as cat_name');

    // Apply filters
    if (filters?.status) {
      countQuery = countQuery.where(`${this.tableName}.status`, filters.status);
      dataQuery = dataQuery.where(`${this.tableName}.status`, filters.status);
    }
    if (filters?.category_id) {
      countQuery = countQuery.where(
        `${this.tableName}.category_id`,
        filters.category_id,
      );
      dataQuery = dataQuery.where(
        `${this.tableName}.category_id`,
        filters.category_id,
      );
    }

    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count as string, 10);

    const rows = await dataQuery
      .orderBy(
        `${this.tableName}.${this.config.timestampColumns.created}`,
        'desc',
      )
      .limit(limit)
      .offset(offset);

    const data: IBusinessProductWithCategory[] = rows.map((row: any) =>
      this.mapRowToProductWithCategory(row),
    );

    return { data, total };
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
   * Checks if a product category exists and is not soft-deleted
   */
  async categoryExistsAndActive(categoryId: string): Promise<boolean> {
    const result = await this.knex('product.product_categories')
      .where('id', categoryId)
      .whereNull('deleted_at')
      .first();
    return !!result;
  }

  /**
   * Insert a product (public method for transactional use)
   */
  async insertProduct(
    entity: IBusinessProduct,
    trx?: Knex.Transaction,
  ): Promise<void> {
    await (trx || this.knex)(this.tableName).insert(entity);
  }

  /**
   * Public method to update a product
   */
  async updateProduct(entity: IBusinessProduct): Promise<void> {
    await this.update(entity);
  }

  /**
   * Public method to soft delete a product
   */
  async softDeleteProduct(id: string): Promise<void> {
    await this.softDelete(id);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private mapRowToProductWithCategory(row: any): IBusinessProductWithCategory {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: row.price,
      unit: row.unit,
      status: row.status,
      business_id: row.business_id,
      category_id: row.category_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
      id_creator: row.id_creator,
      id_updater: row.id_updater,
      category: row.cat_id ? { id: row.cat_id, name: row.cat_name } : null,
    };
  }
}
