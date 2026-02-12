import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { BusinessProductRepository } from './repository/business-product.repository';
import { BusinessProductModel } from './models/business-product.model';
import { CreateBusinessProductDto, UpdateBusinessProductDto } from './dto';
import { IBusinessProductWithCategory } from './interfaces/business-product.interface';
import { v4 as uuidv4 } from 'uuid';
import { Knex } from 'knex';
import { DatabaseService } from '../../database/database.service';
import { I18nService } from 'nestjs-i18n';

/**
 * Business Product Service
 *
 * Application service for business-scoped product operations.
 * Orchestrates between controllers, domain models, and repositories.
 *
 * @class BusinessProductService
 * @version 1.0.0
 * @since 2026-02-12
 */
@Injectable()
export class BusinessProductService {
  constructor(
    private readonly repository: BusinessProductRepository,
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
   * Creates a new product for a business
   */
  async create(
    businessId: string,
    dto: CreateBusinessProductDto,
    creatorPublicId: string,
    lang = 'en',
  ): Promise<IBusinessProductWithCategory> {
    return this.knex.transaction(async (trx) => {
      await this.validateBusinessAccess(businessId, creatorPublicId, lang, trx);

      // Validate category exists and is active
      await this.validateCategoryExists(dto.category_id, lang);

      const product = BusinessProductModel.create({
        id: uuidv4(),
        name: dto.name,
        description: dto.description || null,
        price: dto.price,
        unit: dto.unit || 'pcs',
        status: 'active',
        business_id: businessId,
        category_id: dto.category_id,
        id_creator: creatorPublicId,
        created_at: new Date(),
      });

      await this.repository.insertProduct(product.toEntity(), trx);

      // Return with category info
      const result = await this.repository.findByIdWithCategory(
        product.getId(),
        businessId,
      );
      return result!;
    });
  }

  /**
   * Finds all products for a business with pagination and filters
   */
  async findAll(
    businessId: string,
    pagination: { page: number; limit: number },
    filters: { status?: string; category_id?: string },
    userPublicId: string,
    lang = 'en',
  ): Promise<{
    data: IBusinessProductWithCategory[];
    meta: {
      current_page: number;
      per_page: number;
      total: number;
      last_page: number;
    };
  }> {
    await this.validateBusinessAccess(
      businessId,
      userPublicId,
      lang,
      this.knex,
    );

    const { page = 1, limit = 10 } = pagination;
    const result = await this.repository.findAllByBusiness(
      businessId,
      pagination,
      filters,
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
   * Finds a product by ID within a business
   */
  async findById(
    businessId: string,
    productId: string,
    userPublicId: string,
    lang = 'en',
  ): Promise<IBusinessProductWithCategory> {
    await this.validateBusinessAccess(
      businessId,
      userPublicId,
      lang,
      this.knex,
    );

    const product = await this.repository.findByIdWithCategory(
      productId,
      businessId,
    );
    if (!product) {
      throw new NotFoundException(
        this.i18n.t('businessProducts.errors.notFound', { lang }),
      );
    }
    return product;
  }

  /**
   * Updates a product within a business
   */
  async update(
    businessId: string,
    productId: string,
    dto: UpdateBusinessProductDto,
    userPublicId: string,
    lang = 'en',
  ): Promise<IBusinessProductWithCategory> {
    return this.knex.transaction(async (trx) => {
      await this.validateBusinessAccess(businessId, userPublicId, lang, trx);

      const product = await this.repository.findById(productId);
      if (!product) {
        throw new NotFoundException(
          this.i18n.t('businessProducts.errors.notFound', { lang }),
        );
      }

      // Verify product belongs to this business
      if (product.getBusinessId() !== businessId) {
        throw new ForbiddenException(
          this.i18n.t('businessProducts.errors.notBelongToBusiness', { lang }),
        );
      }

      // Validate category if being changed
      if (dto.category_id && dto.category_id !== product.getCategoryId()) {
        await this.validateCategoryExists(dto.category_id, lang);
      }

      // Update using domain model
      product.updateDetails({
        name: dto.name,
        description: dto.description,
        price: dto.price,
        unit: dto.unit,
        status: dto.status,
        categoryId: dto.category_id,
        updaterId: userPublicId,
      });

      await this.repository.updateProduct(product.toEntity());

      // Return with category info
      const result = await this.repository.findByIdWithCategory(
        productId,
        businessId,
      );
      return result!;
    });
  }

  /**
   * Deletes a product (soft delete)
   *
   * Cascade to tool_products, spare_part_products, inventories handled by DB FK ON DELETE CASCADE
   */
  async delete(
    businessId: string,
    productId: string,
    userPublicId: string,
    lang = 'en',
  ): Promise<void> {
    return this.knex.transaction(async (trx) => {
      await this.validateBusinessAccess(businessId, userPublicId, lang, trx);

      const product = await this.repository.findById(productId);
      if (!product) {
        throw new NotFoundException(
          this.i18n.t('businessProducts.errors.notFound', { lang }),
        );
      }

      // Verify product belongs to this business
      if (product.getBusinessId() !== businessId) {
        throw new ForbiddenException(
          this.i18n.t('businessProducts.errors.notBelongToBusiness', { lang }),
        );
      }

      await this.repository.softDeleteProduct(productId);
    });
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Validates that the specified category exists and is not soft-deleted
   */
  private async validateCategoryExists(
    categoryId: string,
    lang: string,
  ): Promise<void> {
    const exists = await this.repository.categoryExistsAndActive(categoryId);
    if (!exists) {
      throw new NotFoundException(
        this.i18n.t('businessProducts.errors.categoryNotFound', { lang }),
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
        this.i18n.t('businessProducts.errors.business.accessDenied', { lang }),
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
        this.i18n.t('businessProducts.errors.business.notFound', { lang }),
      );
    }

    if (business.status !== 'active') {
      throw new ForbiddenException(
        this.i18n.t('businessProducts.errors.business.inactive', {
          lang,
          args: { status: business.status },
        }),
      );
    }

    // Resolve public_id -> id before comparing with owner_id
    const userId = await this.resolveUserId(userPublicId, lang, trx);

    if (business.owner_id !== userId) {
      throw new ForbiddenException(
        this.i18n.t('businessProducts.errors.business.accessDenied', { lang }),
      );
    }
  }
}
