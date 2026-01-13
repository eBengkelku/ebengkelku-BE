import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../../database/database.service';
import {
  BaseKnexService,
  BaseKnexServiceConfig,
} from '../../../common/services/base-knex.service';
import { ITag } from '../interfaces/tag.interface';
import { TagModel } from '../models/tag.model';
import { CreateTagDto } from '../dto/create-tag.dto';
import { UpdateTagDto } from '../dto/update-tag.dto';

/**
 * Tag Service
 *
 * Service for tag management using BaseKnexService for Auto CRUD operations.
 * Provides standard CRUD operations (findAll, findOne, create, update, delete, search)
 * with automatic pagination, soft delete support, and i18n integration.
 *
 * @class TagService
 * @extends {BaseKnexService<ITag>}
 * @version 1.0.0
 * @since 2025-01-13
 *
 * @example
 * ```typescript
 * // In controller
 * constructor(private readonly tagService: TagService) {}
 *
 * @Get()
 * async findAll(@Query() pagination: BasePaginationQueryDto) {
 *   return this.tagService.findAll(pagination);
 * }
 * ```
 */
@Injectable()
export class TagService extends BaseKnexService<ITag> {
  constructor(
    protected readonly databaseService: DatabaseService,
    protected readonly i18n: I18nService,
  ) {
    const config: BaseKnexServiceConfig = {
      tableName: 'tags',
      primaryKey: 'id',
      timestampColumns: {
        created: 'created_at',
        updated: 'updated_at',
        deleted: 'deleted_at', // Enable soft deletes
      },
      descColumns: ['name'], // Used for combo/dropdown descriptions
      fillable: ['name', 'color'],
      rules: {
        name: { required: true, type: 'string', maxLength: 20 },
        color: { required: true, type: 'string', maxLength: 7 },
      },
      hasFiles: false,
      multipleFiles: false,
    };

    super(databaseService, i18n, config);
  }

  /**
   * Creates a new tag using Rich Domain Model for validation
   *
   * Overrides base create() to use TagModel for business rule validation
   * before inserting into database.
   *
   * @param {CreateTagDto} data - Tag creation data
   * @returns {Promise<any>} Created tag entity
   */
  async create(data: CreateTagDto): Promise<any> {
    try {
      // Use Rich Domain Model for validation
      const tag = TagModel.create({
        id: uuidv4(),
        name: data.name,
        color: data.color,
      });

      // Convert domain model to entity and insert
      const entity = tag.toEntity();
      const result = await this.knex(this.config.tableName)
        .insert(entity)
        .returning('*');

      const insertedRecord = Array.isArray(result) ? result[0] : result;

      return {
        success: true,
        message: this.i18n.translate('tags.created'),
        data: insertedRecord,
      };
    } catch (error) {
      console.error(`Create error in ${this.config.tableName}:`, error);
      throw error; // Re-throw to let exception filter handle it
    }
  }

  /**
   * Updates a tag using Rich Domain Model for validation
   *
   * Overrides base update() to use TagModel for business rule validation
   * before updating database.
   *
   * @param {string | number} id - Tag ID
   * @param {UpdateTagDto} updateData - Update data
   * @param {string} [userId] - User ID making the update
   * @param {string} [lang] - Language for i18n
   * @returns {Promise<ITag>} Updated tag entity
   */
  async update(
    id: string | number,
    updateData: UpdateTagDto,
    userId?: string,
    lang?: string,
  ): Promise<ITag> {
    // Get existing tag
    const existing = await this.findOne(id, lang);

    // Reconstitute domain model from existing data
    const tag = TagModel.reconstitute(existing);

    // Update using domain model methods (validates business rules)
    if (updateData.name !== undefined) {
      tag.renameWithValidation(updateData.name);
    }

    if (updateData.color !== undefined) {
      tag.updateColor(updateData.color);
    }

    // Convert to entity and update database
    // Domain model already handles updated_at timestamp
    const entity = tag.toEntity();
    const dataToUpdate: any = {
      name: entity.name,
      color: entity.color,
      updated_at: entity.updated_at,
    };

    await this.beforeUpdate(existing, dataToUpdate);

    await this.knex(this.config.tableName)
      .where(this.config.primaryKey, id)
      .update(dataToUpdate);

    const updated = await this.findOne(id, lang);

    await this.afterUpdate(updated);

    return updated;
  }
}
