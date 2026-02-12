import { Injectable } from '@nestjs/common';
import { BaseDomainRepository } from '../../../common/domain/base-domain.repository';
import { DatabaseService } from '../../../database/database.service';
import { ProductCategoryModel } from '../models/product-category.model';
import {
  IProductCategory,
  IProductCategoryWithType,
} from '../interfaces/product-category.interface';
import { DomainConflictException } from '../../../common/domain/exceptions';
import { ProductCategoryErrorCodes } from '../constants';
import { Knex } from 'knex';

/**
 * Product Category Repository
 *
 * Repository for managing product category persistence and data access.
 *
 * @class ProductCategoryRepository
 * @extends {BaseDomainRepository<ProductCategoryModel, IProductCategory>}
 * @version 1.0.0
 * @since 2026-02-12
 */
@Injectable()
export class ProductCategoryRepository extends BaseDomainRepository<
  ProductCategoryModel,
  IProductCategory
> {
  protected tableName = 'product.product_categories';

  constructor(databaseService: DatabaseService) {
    super(databaseService, {
      entityName: 'ProductCategory',
      tableName: 'product.product_categories',
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

  async findById(id: string | number): Promise<ProductCategoryModel | null> {
    const row = await this.baseQuery()
      .where(`${this.tableName}.id`, id)
      .first();
    return row ? ProductCategoryModel.reconstitute(row) : null;
  }

  async findAll(pagination: {
    page: number;
    limit: number;
  }): Promise<{ data: ProductCategoryModel[]; total: number }> {
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

    const data = rows.map((row: IProductCategory) =>
      ProductCategoryModel.reconstitute(row),
    );
    return { data, total };
  }

  protected async insert(entity: IProductCategory): Promise<void> {
    try {
      await this.knex(this.tableName).insert(entity);
    } catch (error: any) {
      if (error.code === '23505') {
        this.handleUniqueConstraintError(error);
      }
      throw error;
    }
  }

  protected async update(entity: IProductCategory): Promise<void> {
    try {
      await this.knex(this.tableName)
        .where(this.config.primaryKey, entity.id)
        .update({
          ...entity,
          [this.config.timestampColumns.updated]: new Date(),
        });
    } catch (error: any) {
      if (error.code === '23505') {
        this.handleUniqueConstraintError(error);
      }
      throw error;
    }
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
   * Find a product category by ID with LEFT JOIN to product type
   */
  async findByIdWithType(id: string): Promise<IProductCategoryWithType | null> {
    const row = await this.knex(this.tableName)
      .whereNull(`${this.tableName}.deleted_at`)
      .leftJoin(
        'product.product_types as pt',
        `${this.tableName}.product_type_id`,
        'pt.id',
      )
      .where(`${this.tableName}.id`, id)
      .select(`${this.tableName}.*`, 'pt.id as pt_id', 'pt.name as pt_name')
      .first();

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      product_type_id: row.product_type_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
      id_creator: row.id_creator,
      id_updater: row.id_updater,
      product_type: row.pt_id ? { id: row.pt_id, name: row.pt_name } : null,
    };
  }

  /**
   * Find all product categories with LEFT JOIN to product type, optional filter
   */
  async findAllWithType(
    pagination: { page: number; limit: number },
    productTypeId?: string,
  ): Promise<{ data: IProductCategoryWithType[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    let countQuery = this.baseQuery();
    let dataQuery = this.knex(this.tableName)
      .whereNull(`${this.tableName}.deleted_at`)
      .leftJoin(
        'product.product_types as pt',
        `${this.tableName}.product_type_id`,
        'pt.id',
      )
      .select(`${this.tableName}.*`, 'pt.id as pt_id', 'pt.name as pt_name');

    if (productTypeId) {
      countQuery = countQuery.where(
        `${this.tableName}.product_type_id`,
        productTypeId,
      );
      dataQuery = dataQuery.where(
        `${this.tableName}.product_type_id`,
        productTypeId,
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

    const data: IProductCategoryWithType[] = rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      product_type_id: row.product_type_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
      id_creator: row.id_creator,
      id_updater: row.id_updater,
      product_type: row.pt_id ? { id: row.pt_id, name: row.pt_name } : null,
    }));

    return { data, total };
  }

  /**
   * Soft deletes a product category by ID and returns affected rows count
   */
  async deleteById(id: string | number): Promise<number> {
    return await this.knex(this.tableName)
      .where(this.config.primaryKey, id)
      .whereNull(this.config.timestampColumns.deleted!)
      .update({
        [this.config.timestampColumns.deleted!]: new Date(),
      });
  }

  /**
   * Checks if a product category has active (non-deleted) products
   */
  async hasActiveProducts(categoryId: string): Promise<boolean> {
    const result = await this.knex('product.products')
      .where('category_id', categoryId)
      .whereNull('deleted_at')
      .count('id as count')
      .first();
    return parseInt(result?.count as string, 10) > 0;
  }

  /**
   * Checks if a product category name already exists (case-insensitive)
   */
  async nameExists(name: string, excludeId?: string): Promise<boolean> {
    const query = this.baseQuery().whereRaw('LOWER(name) = LOWER(?)', [
      name.trim(),
    ]);

    if (excludeId) {
      query.whereNot('id', excludeId);
    }

    const result = await query.count('id as count').first();
    return parseInt(result?.count as string, 10) > 0;
  }

  /**
   * Checks if a product type exists and is not soft-deleted
   */
  async productTypeExists(productTypeId: string): Promise<boolean> {
    const result = await this.knex('product.product_types')
      .where('id', productTypeId)
      .whereNull('deleted_at')
      .first();
    return !!result;
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
   * Public method to update a product category
   */
  async updateProductCategory(entity: IProductCategory): Promise<void> {
    await this.update(entity);
  }

  /**
   * Public method to soft delete a product category
   */
  async deleteProductCategory(id: string): Promise<void> {
    await this.softDelete(id);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private handleUniqueConstraintError(error: any): void {
    throw new DomainConflictException(
      ProductCategoryErrorCodes.PRODUCT_CATEGORY_NAME_EXISTS,
      { constraint: error.constraint },
    );
  }
}
