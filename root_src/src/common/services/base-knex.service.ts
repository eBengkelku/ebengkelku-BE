import { Injectable, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { I18nService } from 'nestjs-i18n';
import { DatabaseService } from '../../database/database.service';
import { PaginationHelper, PaginatedResponse } from '../dto/pagination.dto';

export interface SearchFilter {
  field: string;
  operator:
    | 'like'
    | '='
    | '!='
    | '>'
    | '<'
    | '>='
    | '<='
    | 'in'
    | 'notnull'
    | 'null';
  value: any;
}

export interface SearchDto {
  filters?: [string, string, any][]; // [field, operator, value]
  sort?: [string, 'asc' | 'desc'][];
}

export interface BaseKnexServiceConfig {
  tableName: string;
  primaryKey: string;
  timestampColumns: {
    created: string;
    updated: string;
    deleted?: string;
  };
  descColumns: string[];
  fillable: string[];
  rules: Record<string, any>;
  hasFiles?: boolean;
  multipleFiles?: boolean;
}

@Injectable()
export abstract class BaseKnexService<T = any> {
  protected config: BaseKnexServiceConfig;

  constructor(
    protected readonly databaseService: DatabaseService,
    protected readonly i18n: I18nService,
    config: BaseKnexServiceConfig,
  ) {
    this.config = {
      ...config,
      primaryKey: config.primaryKey || 'id',
      timestampColumns: {
        created: config.timestampColumns?.created || 'created_at',
        updated: config.timestampColumns?.updated || 'updated_at',
        deleted: config.timestampColumns?.deleted || 'deleted_at',
      },
      descColumns: config.descColumns || ['name'],
      fillable: config.fillable || [],
      rules: config.rules || {},
      hasFiles: config.hasFiles || false,
      multipleFiles: config.multipleFiles || false,
    };
  }

  // Lazy getter for knex instance to avoid initialization timing issues
  protected get knex(): Knex {
    return this.databaseService.getKnex();
  }

  // Equivalent to Laravel's getList()
  async findAll(
    pagination: { page?: number; limit?: number },
    lang?: string,
  ): Promise<PaginatedResponse<T>> {
    const { page = 1, limit = 10 } = pagination;
    const offset = PaginationHelper.calculateOffset(page, limit);

    const query = this.baseListQuery();
    const countQuery = this.baseListQuery();

    // Get total count
    const [{ count }] = await countQuery.count('* as count');
    const totalItems = parseInt(count as string, 10);

    // Get data with pagination
    const data = await query
      .orderBy(
        `${this.config.tableName}.${this.config.timestampColumns.created}`,
        'desc',
      )
      .limit(limit)
      .offset(offset);

    const paginationMeta = PaginationHelper.calculatePagination(
      page,
      limit,
      totalItems,
    );

    return {
      data,
      pagination: paginationMeta,
      message: this.i18n.t('common.listed', { lang }),
    };
  }

  // Equivalent to Laravel's getById()
  async findOne(id: string | number, lang?: string): Promise<T> {
    const query = this.baseListQuery();
    const result = await query
      .where(`${this.config.tableName}.${this.config.primaryKey}`, id)
      .first();

    if (!result) {
      throw new NotFoundException(
        this.i18n.t('common.errors.notFound', { lang }),
      );
    }

    return result;
  }

  // Equivalent to Laravel's searchByKeywords()
  async search(
    searchDto: SearchDto,
    pagination: { page?: number; limit?: number },
    lang?: string,
  ): Promise<PaginatedResponse<T>> {
    const { filters, sort } = searchDto;
    const { page = 1, limit = 10 } = pagination;
    const offset = PaginationHelper.calculateOffset(page, limit);

    let query = this.baseListQuery();
    let countQuery = this.baseListQuery();

    // Apply filters
    if (filters && filters.length > 0) {
      filters.forEach(([field, operator, value]) => {
        query = this.applyFilter(query, field, operator, value);
        countQuery = this.applyFilter(countQuery, field, operator, value);
      });
    }

    // Get total count
    const [{ count }] = await countQuery.count('* as count');
    const totalItems = parseInt(count as string, 10);

    // Apply sorting
    if (sort && sort.length > 0) {
      sort.forEach(([field, direction]) => {
        query = query.orderBy(field, direction);
      });
    } else {
      query = query.orderBy(
        `${this.config.tableName}.${this.config.timestampColumns.created}`,
        'desc',
      );
    }

    const data = await query.limit(limit).offset(offset);
    const paginationMeta = PaginationHelper.calculatePagination(
      page,
      limit,
      totalItems,
    );

    return {
      data,
      pagination: paginationMeta,
      message: this.i18n.t('common.searched', { lang }),
    };
  }

  // Equivalent to Laravel's doInsert()
  async create(data: any): Promise<any> {
    try {
      // Use insertAndFetch to return the inserted record
      const result = await this.knex(this.config.tableName)
        .insert(data)
        .returning('*');

      // Handle different return formats based on database type
      const insertedRecord = Array.isArray(result) ? result[0] : result;

      return {
        success: true,
        message: this.i18n.translate('common.created'),
        data: insertedRecord,
      };
    } catch (error) {
      console.error(`Create error in ${this.config.tableName}:`, error);
      return {
        success: false,
        message: this.i18n.translate('common.error'),
        error: error.message,
      };
    }
  }

  // Equivalent to Laravel's doUpdate()
  async update(
    id: string | number,
    updateData: Partial<T>,
    userId?: string,
    lang?: string,
  ): Promise<T> {
    const existing = await this.findOne(id, lang);
    const dataToUpdate = this.prepareUpdateData(updateData, userId);

    await this.beforeUpdate(existing, dataToUpdate);

    await this.knex(this.config.tableName)
      .where(this.config.primaryKey, id)
      .update(dataToUpdate);

    const updated = await this.findOne(id, lang);

    await this.afterUpdate(updated);

    return updated;
  }

  // Equivalent to Laravel's doDelete() (soft delete)
  async remove(id: string | number, lang?: string): Promise<void> {
    const existing = await this.findOne(id, lang);

    await this.beforeDelete(existing);

    if (this.config.timestampColumns.deleted) {
      // Soft delete
      await this.knex(this.config.tableName)
        .where(this.config.primaryKey, id)
        .update({ [this.config.timestampColumns.deleted]: new Date() });
    } else {
      // Hard delete
      await this.knex(this.config.tableName)
        .where(this.config.primaryKey, id)
        .delete();
    }

    await this.afterDelete(existing);
  }

  // Equivalent to Laravel's combo() methods
  async getCombo(
    keyword?: string,
    _lang?: string,
  ): Promise<Array<{ id: any; text: string }>> {
    let query = this.knex(this.config.tableName).select([
      this.config.primaryKey,
      ...this.config.descColumns,
    ]);

    // Apply soft delete check if configured
    if (this.config.timestampColumns.deleted) {
      query = query.whereNull(this.config.timestampColumns.deleted);
    }

    if (keyword) {
      query = query.where((builder) => {
        this.config.descColumns.forEach((col, index) => {
          if (index === 0) {
            builder.where(col, 'ilike', `%${keyword}%`);
          } else {
            builder.orWhere(col, 'ilike', `%${keyword}%`);
          }
        });
      });
    }

    const results = await query.limit(50);

    return results.map((item) => ({
      id: item[this.config.primaryKey],
      text: this.config.descColumns.map((col) => item[col]).join(' - '),
    }));
  }

  // Get validation rules (equivalent to Laravel rules)
  getValidationRules(): Record<string, any> {
    return this.config.rules;
  }

  // Base query for list operations - can be overridden by child classes
  protected baseListQuery(): Knex.QueryBuilder {
    let query = this.knex(this.config.tableName);

    // Apply soft delete check if configured
    if (this.config.timestampColumns.deleted) {
      query = query.whereNull(this.config.timestampColumns.deleted);
    }

    return query;
  }

  // Helper method to apply filters
  private applyFilter(
    query: Knex.QueryBuilder,
    field: string,
    operator: string,
    value: any,
  ): Knex.QueryBuilder {
    switch (operator.toLowerCase()) {
      case 'like':
        return query.where(field, 'ilike', `%${value}%`);
      case 'in':
        return query.whereIn(field, Array.isArray(value) ? value : [value]);
      case 'notnull':
        return query.whereNotNull(field);
      case 'null':
        return query.whereNull(field);
      case '!=':
      case '<>':
        return query.where(field, '!=', value);
      default:
        return query.where(field, operator, value);
    }
  }

  // Prepare data for insertion
  private prepareCreateData(data: Partial<T>, userId?: string): any {
    const prepared: any = { ...data };

    // Add timestamps
    if (this.config.timestampColumns.created) {
      prepared[this.config.timestampColumns.created] = new Date();
    }
    if (this.config.timestampColumns.updated) {
      prepared[this.config.timestampColumns.updated] = new Date();
    }

    // Add user tracking if available
    if (userId) {
      prepared['created_by'] = userId;
      prepared['updated_by'] = userId;
    }

    return prepared;
  }

  // Prepare data for update
  private prepareUpdateData(data: Partial<T>, userId?: string): any {
    const prepared: any = { ...data };

    // Add updated timestamp
    if (this.config.timestampColumns.updated) {
      prepared[this.config.timestampColumns.updated] = new Date();
    }

    // Add user tracking if available
    if (userId) {
      prepared['updated_by'] = userId;
    }

    return prepared;
  }

  // Hooks for custom logic - can be overridden by child classes
  protected async beforeCreate(_data: any): Promise<void> {}
  protected async afterCreate(_data: T): Promise<void> {}
  protected async beforeUpdate(_existing: T, _updateData: any): Promise<void> {}
  protected async afterUpdate(_data: T): Promise<void> {}
  protected async beforeDelete(_data: T): Promise<void> {}
  protected async afterDelete(_data: T): Promise<void> {}
}
