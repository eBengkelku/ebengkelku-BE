import { Injectable } from '@nestjs/common';
import { BaseDomainRepository } from '../../../common/domain/base-domain.repository';
import { DatabaseService } from '../../../database/database.service';
import { ProductTypeModel } from '../models/product-type.model';
import { IProductType } from '../interfaces/product-type.interface';
import { DomainConflictException } from '../../../common/domain/exceptions';
import { ProductTypeErrorCodes } from '../constants';
import { Knex } from 'knex';

/**
 * Product Type Repository
 *
 * Repository for managing product type persistence and data access.
 *
 * @class ProductTypeRepository
 * @extends {BaseDomainRepository<ProductTypeModel, IProductType>}
 * @version 1.0.0
 * @since 2026-02-12
 */
@Injectable()
export class ProductTypeRepository extends BaseDomainRepository<
  ProductTypeModel,
  IProductType
> {
  protected tableName = 'product.product_types';

  constructor(databaseService: DatabaseService) {
    super(databaseService, {
      entityName: 'ProductType',
      tableName: 'product.product_types',
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

  async findById(id: string | number): Promise<ProductTypeModel | null> {
    const row = await this.baseQuery().where('id', id).first();
    return row ? ProductTypeModel.reconstitute(row) : null;
  }

  async findAll(pagination: {
    page: number;
    limit: number;
  }): Promise<{ data: ProductTypeModel[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const [{ count }] = await this.baseQuery().count('* as count');
    const total = parseInt(count as string, 10);

    const rows = await this.baseQuery()
      .orderBy(this.config.timestampColumns.created, 'desc')
      .limit(limit)
      .offset(offset);

    const data = rows.map((row: IProductType) =>
      ProductTypeModel.reconstitute(row),
    );
    return { data, total };
  }

  protected async insert(entity: IProductType): Promise<void> {
    try {
      await this.knex(this.tableName).insert(entity);
    } catch (error: any) {
      if (error.code === '23505') {
        this.handleUniqueConstraintError(error);
      }
      throw error;
    }
  }

  protected async update(entity: IProductType): Promise<void> {
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
   * Soft deletes a product type by ID and returns affected rows count
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
   * Checks if a product type has active (non-deleted) categories
   */
  async hasActiveCategories(productTypeId: string): Promise<boolean> {
    const result = await this.knex('product.product_categories')
      .where('product_type_id', productTypeId)
      .whereNull('deleted_at')
      .count('id as count')
      .first();
    return parseInt(result?.count as string, 10) > 0;
  }

  /**
   * Checks if a product type name already exists (case-insensitive)
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
   * Public method to update a product type
   */
  async updateProductType(entity: IProductType): Promise<void> {
    await this.update(entity);
  }

  /**
   * Public method to soft delete a product type
   */
  async deleteProductType(id: string): Promise<void> {
    await this.softDelete(id);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private handleUniqueConstraintError(error: any): void {
    throw new DomainConflictException(
      ProductTypeErrorCodes.PRODUCT_TYPE_NAME_EXISTS,
      { constraint: error.constraint },
    );
  }
}
