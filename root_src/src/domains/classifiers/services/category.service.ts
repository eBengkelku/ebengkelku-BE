import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../../database/database.service';
import {
  BaseKnexService,
  BaseKnexServiceConfig,
} from '../../../common/services/base-knex.service';
import { ICategory } from '../interfaces/category.interface';
import { CategoryModel } from '../models/category.model';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';

/**
 * Category Service
 *
 * Service for category management using BaseKnexService for Auto CRUD operations.
 * Provides standard CRUD operations (findAll, findOne, create, update, delete, search)
 * with automatic pagination, soft delete support, and i18n integration.
 *
 * @class CategoryService
 * @extends {BaseKnexService<ICategory>}
 * @version 1.0.0
 * @since 2025-01-13
 *
 * @example
 * ```typescript
 * // In controller
 * constructor(private readonly categoryService: CategoryService) {}
 *
 * @Get()
 * async findAll(@Query() pagination: BasePaginationQueryDto) {
 *   return this.categoryService.findAll(pagination);
 * }
 * ```
 */
@Injectable()
export class CategoryService extends BaseKnexService<ICategory> {
  constructor(
    protected readonly databaseService: DatabaseService,
    protected readonly i18n: I18nService,
  ) {
    const config: BaseKnexServiceConfig = {
      tableName: 'categories',
      primaryKey: 'id',
      timestampColumns: {
        created: 'created_at',
        updated: 'updated_at',
        deleted: 'deleted_at', // Enable soft deletes
      },
      descColumns: ['name', 'slug'], // Used for combo/dropdown descriptions
      fillable: ['name', 'slug', 'description'],
      rules: {
        name: { required: true, type: 'string', maxLength: 255 },
        slug: { required: true, type: 'string', maxLength: 255 },
        description: { required: false, type: 'string' },
      },
      hasFiles: false,
      multipleFiles: false,
    };

    super(databaseService, i18n, config);
  }

  /**
   * Creates a new category using Rich Domain Model for validation
   *
   * Overrides base create() to use CategoryModel for business rule validation
   * before inserting into database.
   *
   * @param {CreateCategoryDto} data - Category creation data
   * @returns {Promise<any>} Created category entity
   */
  async create(data: CreateCategoryDto): Promise<any> {
    try {
      // Use Rich Domain Model for validation
      const category = CategoryModel.create({
        id: uuidv4(),
        name: data.name,
        description: data.description,
        slug: data.slug, // Optional, will be auto-generated if not provided
      });

      // Convert domain model to entity and insert
      const entity = category.toEntity();
      const result = await this.knex(this.config.tableName)
        .insert(entity)
        .returning('*');

      const insertedRecord = Array.isArray(result) ? result[0] : result;

      return {
        success: true,
        message: this.i18n.translate('categories.created'),
        data: insertedRecord,
      };
    } catch (error) {
      console.error(`Create error in ${this.config.tableName}:`, error);
      throw error; // Re-throw to let exception filter handle it
    }
  }

  /**
   * Updates a category using Rich Domain Model for validation
   *
   * Overrides base update() to use CategoryModel for business rule validation
   * before updating database.
   *
   * @param {string | number} id - Category ID
   * @param {UpdateCategoryDto} updateData - Update data
   * @param {string} [userId] - User ID making the update
   * @param {string} [lang] - Language for i18n
   * @returns {Promise<ICategory>} Updated category entity
   */
  async update(
    id: string | number,
    updateData: UpdateCategoryDto,
    userId?: string,
    lang?: string,
  ): Promise<ICategory> {
    // Get existing category
    const existing = await this.findOne(id, lang);

    // Reconstitute domain model from existing data
    const category = CategoryModel.reconstitute(existing);

    // Update using domain model methods (validates business rules)
    if (updateData.name !== undefined || updateData.description !== undefined) {
      category.updateDetails(updateData.name, updateData.description);
    }

    if (updateData.slug !== undefined) {
      category.changeSlug(updateData.slug);
    }

    // Convert to entity and update database
    // Domain model already handles updated_at timestamp
    const entity = category.toEntity();
    const dataToUpdate: any = {
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
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
