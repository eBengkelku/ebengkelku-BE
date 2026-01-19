import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { v4 as uuidv4 } from 'uuid';
import { TagRepository } from './repository/tag.repository';
import { TagModel } from './models/tag.model';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ITag } from './interfaces/tag.interface';

/**
 * Tag Service
 *
 * Application service for tag-related operations using the Rich Domain Model pattern.
 * This service acts as an orchestrator, coordinating between controllers, domain models,
 * and repositories while keeping business logic in the domain layer.
 *
 * Responsibilities:
 * - Orchestrate use cases and workflows
 * - Convert between DTOs and domain models
 * - Coordinate with repository for data access
 *
 * Business logic should be in TagModel, not here.
 *
 * @class TagService
 * @version 1.0.0
 * @since 2025-01-13
 *
 * @example
 * ```typescript
 * // In a controller
 * constructor(private readonly tagService: TagService) {}
 *
 * @Post()
 * async create(@Body() dto: CreateTagDto) {
 *   return this.tagService.create(dto);
 * }
 * ```
 */
@Injectable()
export class TagService {
  /**
   * Creates an instance of TagService
   *
   * @param {TagRepository} repository - Repository for tag data access
   * @param {I18nService} i18n - I18n service for internationalization
   */
  constructor(
    private readonly repository: TagRepository,
    private readonly i18n: I18nService,
  ) {}

  // ============================================================================
  // STANDARD CRUD OPERATIONS
  // ============================================================================

  /**
   * Creates a new tag
   *
   * Orchestrates tag creation:
   * 1. Creates domain model with validation
   * 2. Persists via repository
   * 3. Returns entity for API response
   *
   * @param {CreateTagDto} dto - Tag creation data
   * @returns {Promise<any>} Created tag entity
   *
   * @example
   * ```typescript
   * const tag = await service.create({
   *   name: 'Hot Item',
   *   color: '#FF0000',
   * });
   * ```
   */
  async create(dto: CreateTagDto): Promise<any> {
    // Create domain model (validates business rules)
    const tag = TagModel.create({
      id: uuidv4(),
      name: dto.name,
      color: dto.color,
    });

    // Persist to database via repository
    await this.repository.save(tag);

    // Return entity
    return {
      success: true,
      message: this.i18n.translate('tags.created'),
      data: tag.toEntity(),
    };
  }

  /**
   * Finds a tag by ID
   *
   * @param {string} id - Tag ID
   * @returns {Promise<ITag>} Tag entity
   * @throws {DomainNotFoundException} If tag not found
   *
   * @example
   * ```typescript
   * const tag = await service.findById('uuid-123');
   * ```
   */
  async findById(id: string): Promise<ITag> {
    const tag = await this.repository.findByIdOrThrow(id);
    return tag.toEntity();
  }

  /**
   * Finds all tags with pagination
   *
   * @param {Object} pagination - Pagination parameters
   * @param {number} pagination.page - Page number (1-based)
   * @param {number} pagination.limit - Records per page
   * @returns {Promise<{data: ITag[], total: number}>} Paginated tags
   *
   * @example
   * ```typescript
   * const result = await service.findAll({ page: 1, limit: 10 });
   * ```
   */
  async findAll(pagination: { page: number; limit: number }): Promise<{
    data: ITag[];
    total: number;
  }> {
    const result = await this.repository.findAll(pagination);
    const entities = result.data.map((tag) => tag.toEntity());

    return {
      data: entities,
      total: result.total,
    };
  }

  /**
   * Updates a tag
   *
   * Orchestrates tag update:
   * 1. Fetches existing tag
   * 2. Updates via domain model (validates business rules)
   * 3. Persists changes via repository
   * 4. Returns updated entity
   *
   * @param {string} id - Tag ID
   * @param {UpdateTagDto} dto - Update data
   * @returns {Promise<ITag>} Updated tag entity
   * @throws {DomainNotFoundException} If tag not found
   *
   * @example
   * ```typescript
   * const updated = await service.update('uuid-123', {
   *   name: 'New Tag',
   *   color: '#00FF00',
   * });
   * ```
   */
  async update(id: string, dto: UpdateTagDto): Promise<ITag> {
    // Get existing tag from repository
    const tag = await this.repository.findByIdOrThrow(id);

    // Update using domain model methods (validates business rules)
    if (dto.name !== undefined) {
      tag.renameWithValidation(dto.name);
    }

    if (dto.color !== undefined) {
      tag.updateColor(dto.color);
    }

    // Persist changes via repository
    await this.repository.save(tag);

    // Return updated entity
    return this.findById(id);
  }

  /**
   * Deletes a tag (soft delete)
   *
   * Validates that the tag exists before attempting to delete it.
   *
   * @param {string} id - Tag ID
   * @returns {Promise<void>}
   * @throws {DomainNotFoundException} If tag not found
   *
   * @example
   * ```typescript
   * await service.delete('uuid-123');
   * ```
   */
  async delete(id: string): Promise<void> {
    // Validate tag exists before deleting
    await this.repository.findByIdOrThrow(id);
    await this.repository.delete(id);
  }

  /**
   * Finds a tag by ID (alias for findById for compatibility)
   *
   * @param {string | number} id - Tag ID
   * @param {string} [lang] - Language for i18n (unused, kept for compatibility)
   * @returns {Promise<ITag>} Tag entity
   */
  async findOne(id: string | number, lang?: string): Promise<ITag> {
    return this.findById(String(id));
  }

  /**
   * Removes a tag (soft delete) - alias for delete
   *
   * @param {string | number} id - Tag ID
   * @param {string} [lang] - Language for i18n (unused, kept for compatibility)
   * @returns {Promise<void>}
   */
  async remove(id: string | number, lang?: string): Promise<void> {
    await this.delete(String(id));
  }
}
