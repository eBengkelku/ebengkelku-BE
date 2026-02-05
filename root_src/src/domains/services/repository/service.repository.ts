import { Injectable } from '@nestjs/common';
import { BaseDomainRepository } from '../../../common/domain/base-domain.repository';
import { DatabaseService } from '../../../database/database.service';
import { ServiceModel } from '../models/service.model';
import { IService } from '../interfaces/service.interface';
import { Knex } from 'knex';

/**
 * Service Repository - Data access layer for services.
 */
@Injectable()
export class ServiceRepository extends BaseDomainRepository<
  ServiceModel,
  IService
> {
  protected tableName = 'service.services';

  constructor(databaseService: DatabaseService) {
    super(databaseService, {
      entityName: 'Service',
      tableName: 'service.services',
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

  async findById(id: string | number): Promise<ServiceModel | null> {
    const row = await this.baseQuery().where('id', id).first();
    return row ? ServiceModel.reconstitute(row) : null;
  }

  async findAll(pagination: {
    page: number;
    limit: number;
  }): Promise<{ data: ServiceModel[]; total: number }> {
    const { page = 1, limit = 10 } = pagination;
    const offset = (page - 1) * limit;

    const [{ count }] = await this.baseQuery().count('* as count');
    const total = parseInt(count as string, 10);

    const rows = await this.baseQuery()
      .orderBy(this.config.timestampColumns.created, 'desc')
      .limit(limit)
      .offset(offset);

    const data = rows.map((row: IService) => ServiceModel.reconstitute(row));
    return { data, total };
  }

  protected async insert(entity: IService): Promise<void> {
    await this.knex(this.tableName).insert(entity);
  }

  protected async update(entity: IService): Promise<void> {
    await this.knex(this.tableName)
      .where(this.config.primaryKey, (entity as any)[this.config.primaryKey])
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

  /** Finds services by business ID */
  async findByBusinessId(
    businessId: string,
    trx?: Knex.Transaction,
  ): Promise<ServiceModel[]> {
    const query = trx ? trx(this.tableName) : this.baseQuery();
    const rows = await query
      .where('business_id', businessId)
      .whereNull('deleted_at');
    return rows.map((row: IService) => ServiceModel.reconstitute(row));
  }

  /** Checks if service name exists for a business (case-insensitive) */
  async nameExistsForBusiness(
    name: string,
    businessId: string,
    excludeId?: string,
    trx?: Knex.Transaction,
  ): Promise<boolean> {
    const query = (trx || this.knex)(this.tableName)
      .where('business_id', businessId)
      .whereNull('deleted_at')
      .whereRaw('LOWER(name) = LOWER(?)', [name.trim()]);

    if (excludeId) {
      query.whereNot('id', excludeId);
    }

    const result = await query.count('id as count').first();
    return parseInt(result?.count as string, 10) > 0;
  }

  /** Batch insert services */
  async batchInsert(
    services: ServiceModel[],
    trx?: Knex.Transaction,
  ): Promise<void> {
    if (services.length === 0) return;
    const rows = services.map((s) => s.toEntity());
    await (trx || this.knex)(this.tableName).insert(rows);
  }

  /** Check for existing names in database */
  async findExistingNames(
    names: string[],
    businessId: string,
    trx?: Knex.Transaction,
  ): Promise<string[]> {
    if (names.length === 0) return [];

    const rows = await (trx || this.knex)(this.tableName)
      .where('business_id', businessId)
      .whereNull('deleted_at')
      .whereRaw(
        'LOWER(name) IN (' + names.map(() => 'LOWER(?)').join(',') + ')',
        names,
      )
      .select('name');

    return rows.map((row: { name: string }) => row.name);
  }
}
