import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ProductTypeRepository } from './repository/product-type.repository';
import { ProductTypeModel } from './models/product-type.model';
import {
  CreateProductTypeDto,
  UpdateProductTypeDto,
  DeleteProductTypeDto,
} from './dto';
import { IProductType } from './interfaces/product-type.interface';
import { v4 as uuidv4 } from 'uuid';
import { Knex } from 'knex';
import { DatabaseService } from '../../database/database.service';
import { I18nService } from 'nestjs-i18n';

/**
 * Product Type Service
 *
 * Application service for product type operations.
 * Orchestrates between controllers, domain models, and repositories.
 *
 * @class ProductTypeService
 * @version 1.0.0
 * @since 2026-02-12
 */
@Injectable()
export class ProductTypeService {
  constructor(
    private readonly repository: ProductTypeRepository,
    private readonly databaseService: DatabaseService,
    private readonly i18n: I18nService,
  ) {}

  private get knex(): Knex {
    return this.databaseService.getKnex();
  }

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  /**
   * Creates a new product type
   */
  async create(
    dto: CreateProductTypeDto,
    creatorPublicId: string,
    lang = 'en',
  ): Promise<IProductType> {
    return this.knex.transaction(async (trx) => {
      await this.validateBusinessAccess(
        dto.business_id,
        creatorPublicId,
        lang,
        trx,
      );

      // Check name uniqueness
      const nameExists = await this.repository.nameExists(dto.name);
      if (nameExists) {
        throw new ConflictException(
          this.i18n.t('productTypes.errors.nameAlreadyExists', {
            lang,
            args: { name: dto.name },
          }),
        );
      }

      const productType = ProductTypeModel.create({
        id: uuidv4(),
        name: dto.name,
        id_creator: creatorPublicId,
        created_at: new Date(),
      });

      await this.repository.save(productType);
      return productType.toEntity();
    });
  }

  /**
   * Finds all product types with pagination
   */
  async findAll(pagination: { page: number; limit: number }): Promise<{
    data: IProductType[];
    meta: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
    };
  }> {
    const { page = 1, limit = 10 } = pagination;
    const result = await this.repository.findAll(pagination);
    const entities = result.data.map((model) => model.toEntity());

    return {
      data: entities,
      meta: {
        current_page: page,
        per_page: limit,
        total: result.total,
        last_page: Math.ceil(result.total / limit),
      },
    };
  }

  /**
   * Finds a product type by ID
   */
  async findById(id: string, lang = 'en'): Promise<IProductType> {
    const productType = await this.repository.findById(id);
    if (!productType) {
      throw new NotFoundException(
        this.i18n.t('productTypes.errors.notFound', { lang }),
      );
    }
    return productType.toEntity();
  }

  /**
   * Updates a product type
   */
  async update(
    id: string,
    dto: UpdateProductTypeDto,
    userPublicId: string,
    lang = 'en',
  ): Promise<IProductType> {
    return this.knex.transaction(async (trx) => {
      await this.validateBusinessAccess(
        dto.business_id,
        userPublicId,
        lang,
        trx,
      );

      const productType = await this.repository.findById(id);
      if (!productType) {
        throw new NotFoundException(
          this.i18n.t('productTypes.errors.notFound', { lang }),
        );
      }

      // Check name uniqueness if name is being updated
      if (dto.name && dto.name !== productType.getName()) {
        const nameExists = await this.repository.nameExists(dto.name, id);
        if (nameExists) {
          throw new ConflictException(
            this.i18n.t('productTypes.errors.nameAlreadyExists', {
              lang,
              args: { name: dto.name },
            }),
          );
        }
      }

      // Update using domain model
      if (dto.name !== undefined) {
        productType.updateName(dto.name, userPublicId);
      }

      await this.repository.updateProductType(productType.toEntity());
      return productType.toEntity();
    });
  }

  /**
   * Deletes a product type (soft delete)
   */
  async delete(
    id: string,
    dto: DeleteProductTypeDto,
    userPublicId: string,
    lang = 'en',
  ): Promise<void> {
    return this.knex.transaction(async (trx) => {
      await this.validateBusinessAccess(
        dto.business_id,
        userPublicId,
        lang,
        trx,
      );

      const productType = await this.repository.findById(id);
      if (!productType) {
        throw new NotFoundException(
          this.i18n.t('productTypes.errors.notFound', { lang }),
        );
      }

      // Check if there are active categories using this product type
      const hasCategories = await this.repository.hasActiveCategories(id);
      if (hasCategories) {
        throw new BadRequestException(
          this.i18n.t('productTypes.errors.hasCategories', { lang }),
        );
      }

      await this.repository.deleteProductType(id);
    });
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Resolve core.users.id from JWT sub (public_id).
   */
  private async resolveUserId(
    publicId: string,
    lang: string,
    trx: Knex | Knex.Transaction,
  ): Promise<string> {
    const userId = await this.repository.findUserIdByPublicId(publicId, trx);
    if (!userId) {
      throw new UnauthorizedException(
        this.i18n.t('productTypes.errors.business.accessDenied', { lang }),
      );
    }
    return userId;
  }

  /**
   * Validates that the user has access to the specified business
   */
  private async validateBusinessAccess(
    businessId: string,
    userPublicId: string,
    lang: string,
    trx: Knex | Knex.Transaction,
  ): Promise<void> {
    const business = await trx('business.businesses')
      .where({ id: businessId })
      .whereNull('deleted_at')
      .first();

    if (!business) {
      throw new NotFoundException(
        this.i18n.t('productTypes.errors.business.notFound', { lang }),
      );
    }

    if (business.status !== 'active') {
      throw new ForbiddenException(
        this.i18n.t('productTypes.errors.business.inactive', {
          lang,
          args: { status: business.status },
        }),
      );
    }

    // Resolve public_id -> id before comparing with owner_id
    const userId = await this.resolveUserId(userPublicId, lang, trx);

    if (business.owner_id !== userId) {
      throw new ForbiddenException(
        this.i18n.t('productTypes.errors.business.accessDenied', { lang }),
      );
    }
  }
}
