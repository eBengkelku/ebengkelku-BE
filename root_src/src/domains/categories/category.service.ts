import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { v4 as uuidv4 } from 'uuid';
import { CategoryRepository } from './repository/category.repository';
import { CategoryModel } from './models/category.model';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { ICategory } from './interfaces/category.interface';

/**
 * Category Service
 *
 * Application service for category-related operations using the Rich Domain Model pattern.
 * This service acts as an orchestrator, coordinating between controllers, domain models,
 * and repositories while keeping business logic in the domain layer.
 *
 * Responsibilities:
 * - Orchestrate use cases and workflows
 * - Convert between DTOs and domain models
 * - Coordinate with repository for data access
 *
 * Business logic should be in CategoryModel, not here.
 *
 * @class CategoryService
 * @version 1.0.0
 * @since 2025-01-13
 *
 * @example
 * ```typescript
 * // In a controller
 * constructor(private readonly categoryService: CategoryService) {}
 *
 * @Post()
 * async create(@Body() dto: CreateCategoryDto) {
 *   return this.categoryService.create(dto);
 * }
 * ```
 */
@Injectable()
export class CategoryService {
  /**
   * Creates an instance of CategoryService
   *
   * @param {CategoryRepository} repository - Repository for category data access
   * @param {I18nService} i18n - I18n service for internationalization
   */
  constructor(
    private readonly repository: CategoryRepository,
    private readonly i18n: I18nService,
  ) {}

  // ============================================================================
  // STANDARD CRUD OPERATIONS
  // ============================================================================

  /**
   * Creates a new category
   *
   * Orchestrates category creation:
   * 1. Creates domain model with validation
   * 2. Persists via repository
   * 3. Returns entity for API response
   *
   * @param {CreateCategoryDto} dto - Category creation data
   * @returns {Promise<any>} Created category entity
   *
   * @example
   * ```typescript
   * const category = await service.create({
   *   name: 'Electronics',
   *   slug: 'electronics',
   *   description: 'Electronic items',
   * });
   * ```
   */
  async create(dto: CreateCategoryDto): Promise<any> {
    // Create domain model (validates business rules)
    const category = CategoryModel.create({
      id: uuidv4(),
      name: dto.name,
      description: dto.description,
      slug: dto.slug, // Optional, will be auto-generated if not provided
    });

    // Persist to database via repository
    await this.repository.save(category);

    // Return entity
    return {
      success: true,
      message: this.i18n.translate('categories.created'),
      data: category.toEntity(),
    };
  }

  /**
   * Finds a category by ID
   *
   * @param {string} id - Category ID
   * @returns {Promise<ICategory>} Category entity
   * @throws {DomainNotFoundException} If category not found
   *
   * @example
   * ```typescript
   * const category = await service.findById('uuid-123');
   * ```
   */
  async findById(id: string): Promise<ICategory> {
    const category = await this.repository.findByIdOrThrow(id);
    return category.toEntity();
  }

  /**
   * Finds all categories with pagination
   *
   * @param {Object} pagination - Pagination parameters
   * @param {number} pagination.page - Page number (1-based)
   * @param {number} pagination.limit - Records per page
   * @returns {Promise<{data: ICategory[], total: number}>} Paginated categories
   *
   * @example
   * ```typescript
   * const result = await service.findAll({ page: 1, limit: 10 });
   * ```
   */
  async findAll(pagination: { page: number; limit: number }): Promise<{
    data: ICategory[];
    total: number;
  }> {
    const result = await this.repository.findAll(pagination);
    const entities = result.data.map((category) => category.toEntity());

    return {
      data: entities,
      total: result.total,
    };
  }

  /**
   * Updates a category
   *
   * Orchestrates category update:
   * 1. Fetches existing category
   * 2. Updates via domain model (validates business rules)
   * 3. Persists changes via repository
   * 4. Returns updated entity
   *
   * @param {string} id - Category ID
   * @param {UpdateCategoryDto} dto - Update data
   * @returns {Promise<ICategory>} Updated category entity
   * @throws {DomainNotFoundException} If category not found
   *
   * @example
   * ```typescript
   * const updated = await service.update('uuid-123', {
   *   name: 'New Name',
   *   description: 'New description',
   * });
   * ```
   */
  async update(id: string, dto: UpdateCategoryDto): Promise<ICategory> {
    // Get existing category from repository
    const category = await this.repository.findByIdOrThrow(id);

    // Update using domain model methods (validates business rules)
    if (dto.name !== undefined || dto.description !== undefined) {
      category.updateDetails(dto.name, dto.description);
    }

    if (dto.slug !== undefined) {
      category.changeSlug(dto.slug);
    }

    // Persist changes via repository
    await this.repository.save(category);

    // Return updated entity
    return this.findById(id);
  }

  /**
   * Deletes a category (soft delete)
   *
   * Validates that the category exists before attempting to delete it.
   *
   * @param {string} id - Category ID
   * @returns {Promise<void>}
   * @throws {DomainNotFoundException} If category not found
   *
   * @example
   * ```typescript
   * await service.delete('uuid-123');
   * ```
   */
  async delete(id: string): Promise<void> {
    // Validate category exists before deleting
    await this.repository.findByIdOrThrow(id);
    await this.repository.delete(id);
  }

  /**
   * Finds a category by ID (alias for findById for compatibility)
   *
   * @param {string | number} id - Category ID
   * @param {string} [lang] - Language for i18n (unused, kept for compatibility)
   * @returns {Promise<ICategory>} Category entity
   */
  async findOne(id: string | number, lang?: string): Promise<ICategory> {
    return this.findById(String(id));
  }

  /**
   * Removes a category (soft delete) - alias for delete
   *
   * @param {string | number} id - Category ID
   * @param {string} [lang] - Language for i18n (unused, kept for compatibility)
   * @returns {Promise<void>}
   */
  async remove(id: string | number, lang?: string): Promise<void> {
    await this.delete(String(id));
  }
}
