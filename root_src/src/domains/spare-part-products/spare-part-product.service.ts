import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { SparePartProductRepository } from './repository/spare-part-product.repository';
import { SparePartProductModel } from './models/spare-part-product.model';
import { CreateSparePartProductDto, UpdateSparePartProductDto } from './dto';
import { ISparePartProductWithBaseProduct } from './interfaces/spare-part-product.interface';
import { Knex } from 'knex';
import { DatabaseService } from '../../database/database.service';
import { I18nService } from 'nestjs-i18n';

/**
 * Spare Part Product Service
 *
 * Application service for spare-part-product-specific operations.
 * Orchestrates between controllers, domain models, and repositories.
 *
 * @class SparePartProductService
 * @version 1.0.0
 * @since 2026-02-12
 */
@Injectable()
export class SparePartProductService {
  constructor(
    private readonly repository: SparePartProductRepository,
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
   * Finds all spare part products for a business with pagination
   */
  async findAll(
    businessId: string,
    pagination: { page: number; limit: number },
    userPublicId: string,
    lang = 'en',
  ): Promise<{
    data: ISparePartProductWithBaseProduct[];
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
   * Creates a spare part product extension for an existing base product
   */
  async create(
    businessId: string,
    productId: string,
    dto: CreateSparePartProductDto,
    creatorPublicId: string,
    lang = 'en',
  ): Promise<ISparePartProductWithBaseProduct> {
    await this.knex.transaction(async (trx) => {
      await this.validateBusinessAccess(businessId, creatorPublicId, lang, trx);

      // Validate product exists and belongs to business
      await this.validateProductBelongsToBusiness(productId, businessId, lang);

      // Check unique constraint
      const exists = await this.repository.sparePartProductExists(productId);
      if (exists) {
        throw new ConflictException(
          this.i18n.t('sparePartProducts.errors.alreadyExists', { lang }),
        );
      }

      const sparePartProduct = SparePartProductModel.create({
        product_id: productId,
        brand: dto.brand || null,
        grade: dto.grade || null,
        id_creator: creatorPublicId,
      });

      await this.repository.insertSparePartProduct(
        sparePartProduct.toEntity(),
        trx,
      );
    });

    // Read back after transaction commits so the pool connection can see the row
    const result = await this.repository.findByProductIdWithBaseProduct(
      productId,
      businessId,
    );
    return result!;
  }

  /**
   * Finds a spare part product by product ID with base product info
   */
  async findOne(
    businessId: string,
    productId: string,
    userPublicId: string,
    lang = 'en',
  ): Promise<ISparePartProductWithBaseProduct> {
    await this.validateBusinessAccess(
      businessId,
      userPublicId,
      lang,
      this.knex,
    );

    const sparePartProduct =
      await this.repository.findByProductIdWithBaseProduct(
        productId,
        businessId,
      );
    if (!sparePartProduct) {
      throw new NotFoundException(
        this.i18n.t('sparePartProducts.errors.notFound', { lang }),
      );
    }
    return sparePartProduct;
  }

  /**
   * Updates a spare part product
   */
  async update(
    businessId: string,
    productId: string,
    dto: UpdateSparePartProductDto,
    userPublicId: string,
    lang = 'en',
  ): Promise<ISparePartProductWithBaseProduct> {
    return this.knex.transaction(async (trx) => {
      await this.validateBusinessAccess(businessId, userPublicId, lang, trx);

      // Validate product belongs to business
      await this.validateProductBelongsToBusiness(productId, businessId, lang);

      const sparePartProduct = await this.repository.findById(productId);
      if (!sparePartProduct) {
        throw new NotFoundException(
          this.i18n.t('sparePartProducts.errors.notFound', { lang }),
        );
      }

      // Update using domain model
      sparePartProduct.updateDetails({
        brand: dto.brand,
        grade: dto.grade,
        updaterId: userPublicId,
      });

      await this.repository.updateSparePartProduct(sparePartProduct.toEntity());

      // Return with base product info
      const result = await this.repository.findByProductIdWithBaseProduct(
        productId,
        businessId,
      );
      return result!;
    });
  }

  /**
   * Deletes a spare part product (soft delete — only the extension record)
   */
  async delete(
    businessId: string,
    productId: string,
    userPublicId: string,
    lang = 'en',
  ): Promise<void> {
    return this.knex.transaction(async (trx) => {
      await this.validateBusinessAccess(businessId, userPublicId, lang, trx);

      // Validate product belongs to business
      await this.validateProductBelongsToBusiness(productId, businessId, lang);

      const sparePartProduct = await this.repository.findById(productId);
      if (!sparePartProduct) {
        throw new NotFoundException(
          this.i18n.t('sparePartProducts.errors.notFound', { lang }),
        );
      }

      await this.repository.softDeleteSparePartProduct(productId);
    });
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Validates that the product exists and belongs to the specified business
   */
  private async validateProductBelongsToBusiness(
    productId: string,
    businessId: string,
    lang: string,
  ): Promise<void> {
    const product = await this.repository.findProductByIdAndBusiness(
      productId,
      businessId,
    );
    if (!product) {
      throw new NotFoundException(
        this.i18n.t('sparePartProducts.errors.productNotFound', { lang }),
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
        this.i18n.t('sparePartProducts.errors.business.accessDenied', { lang }),
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
        this.i18n.t('sparePartProducts.errors.business.notFound', { lang }),
      );
    }

    if (business.status !== 'active') {
      throw new ForbiddenException(
        this.i18n.t('sparePartProducts.errors.business.inactive', {
          lang,
          args: { status: business.status },
        }),
      );
    }

    // Resolve public_id -> id before comparing with owner_id
    const userId = await this.resolveUserId(userPublicId, lang, trx);

    if (business.owner_id !== userId) {
      throw new ForbiddenException(
        this.i18n.t('sparePartProducts.errors.business.accessDenied', { lang }),
      );
    }
  }
}
