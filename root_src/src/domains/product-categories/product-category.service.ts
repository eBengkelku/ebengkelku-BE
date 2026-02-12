import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ProductCategoryRepository } from './repository/product-category.repository';
import { ProductCategoryModel } from './models/product-category.model';
import {
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
  DeleteProductCategoryDto,
} from './dto';
import { IProductCategoryWithType } from './interfaces/product-category.interface';
import { v4 as uuidv4 } from 'uuid';
import { Knex } from 'knex';
import { DatabaseService } from '../../database/database.service';
import { I18nService } from 'nestjs-i18n';

/**
 * Product Category Service
 *
 * Application service for product category operations.
 * Orchestrates between controllers, domain models, and repositories.
 *
 * @class ProductCategoryService
 * @version 1.0.0
 * @since 2026-02-12
 */
@Injectable()
export class ProductCategoryService {
  constructor(
    private readonly repository: ProductCategoryRepository,
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
   * Creates a new product category
   */
  async create(
    dto: CreateProductCategoryDto,
    creatorPublicId: string,
    lang = 'en',
  ): Promise<IProductCategoryWithType> {
    return this.knex.transaction(async (trx) => {
      await this.validateBusinessAccess(
        dto.business_id,
        creatorPublicId,
        lang,
        trx,
      );

      // Validate product type exists
      await this.validateProductTypeExists(dto.product_type_id, lang);

      // Check name uniqueness
      const nameExists = await this.repository.nameExists(dto.name);
      if (nameExists) {
        throw new ConflictException(
          this.i18n.t('productCategories.errors.nameAlreadyExists', {
            lang,
            args: { name: dto.name },
          }),
        );
      }

      const category = ProductCategoryModel.create({
        id: uuidv4(),
        name: dto.name,
        description: dto.description || null,
        product_type_id: dto.product_type_id,
        id_creator: creatorPublicId,
        created_at: new Date(),
      });

      await this.repository.save(category);

      // Return with type info
      const result = await this.repository.findByIdWithType(category.getId());
      return result!;
    });
  }

  /**
   * Finds all product categories with pagination and optional filter
   */
  async findAll(
    pagination: { page: number; limit: number },
    productTypeId?: string,
  ): Promise<{
    data: IProductCategoryWithType[];
    meta: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
    };
  }> {
    const { page = 1, limit = 10 } = pagination;
    const result = await this.repository.findAllWithType(
      pagination,
      productTypeId,
    );

    return {
      data: result.data,
      meta: {
        current_page: page,
        per_page: limit,
        total: result.total,
        last_page: Math.ceil(result.total / limit),
      },
    };
  }

  /**
   * Finds a product category by ID (with type info)
   */
  async findById(id: string, lang = 'en'): Promise<IProductCategoryWithType> {
    const category = await this.repository.findByIdWithType(id);
    if (!category) {
      throw new NotFoundException(
        this.i18n.t('productCategories.errors.notFound', { lang }),
      );
    }
    return category;
  }

  /**
   * Updates a product category
   */
  async update(
    id: string,
    dto: UpdateProductCategoryDto,
    userPublicId: string,
    lang = 'en',
  ): Promise<IProductCategoryWithType> {
    return this.knex.transaction(async (trx) => {
      await this.validateBusinessAccess(
        dto.business_id,
        userPublicId,
        lang,
        trx,
      );

      const category = await this.repository.findById(id);
      if (!category) {
        throw new NotFoundException(
          this.i18n.t('productCategories.errors.notFound', { lang }),
        );
      }

      // Validate product type if being changed
      if (
        dto.product_type_id &&
        dto.product_type_id !== category.getProductTypeId()
      ) {
        await this.validateProductTypeExists(dto.product_type_id, lang);
      }

      // Check name uniqueness if name is being updated
      if (dto.name && dto.name !== category.getName()) {
        const nameExists = await this.repository.nameExists(dto.name, id);
        if (nameExists) {
          throw new ConflictException(
            this.i18n.t('productCategories.errors.nameAlreadyExists', {
              lang,
              args: { name: dto.name },
            }),
          );
        }
      }

      // Update using domain model
      category.updateDetails({
        name: dto.name,
        description: dto.description,
        productTypeId: dto.product_type_id,
        updaterId: userPublicId,
      });

      await this.repository.updateProductCategory(category.toEntity());

      // Return with type info
      const result = await this.repository.findByIdWithType(id);
      return result!;
    });
  }

  /**
   * Deletes a product category (soft delete)
   */
  async delete(
    id: string,
    dto: DeleteProductCategoryDto,
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

      const category = await this.repository.findById(id);
      if (!category) {
        throw new NotFoundException(
          this.i18n.t('productCategories.errors.notFound', { lang }),
        );
      }

      // Check if there are active products using this category
      const hasProducts = await this.repository.hasActiveProducts(id);
      if (hasProducts) {
        throw new BadRequestException(
          this.i18n.t('productCategories.errors.hasProducts', { lang }),
        );
      }

      await this.repository.deleteProductCategory(id);
    });
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Validates that the specified product type exists and is not soft-deleted
   */
  private async validateProductTypeExists(
    productTypeId: string,
    lang: string,
  ): Promise<void> {
    const exists = await this.repository.productTypeExists(productTypeId);
    if (!exists) {
      throw new NotFoundException(
        this.i18n.t('productCategories.errors.typeNotFound', { lang }),
      );
    }
  }

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
        this.i18n.t('productCategories.errors.business.accessDenied', {
          lang,
        }),
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
        this.i18n.t('productCategories.errors.business.notFound', { lang }),
      );
    }

    if (business.status !== 'active') {
      throw new ForbiddenException(
        this.i18n.t('productCategories.errors.business.inactive', {
          lang,
          args: { status: business.status },
        }),
      );
    }

    // Resolve public_id -> id before comparing with owner_id
    const userId = await this.resolveUserId(userPublicId, lang, trx);

    if (business.owner_id !== userId) {
      throw new ForbiddenException(
        this.i18n.t('productCategories.errors.business.accessDenied', {
          lang,
        }),
      );
    }
  }
}
