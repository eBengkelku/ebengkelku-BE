import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { ToolProductRepository } from './repository/tool-product.repository';
import { ToolProductModel } from './models/tool-product.model';
import { CreateToolProductDto, UpdateToolProductDto } from './dto';
import { IToolProductWithBaseProduct } from './interfaces/tool-product.interface';
import { Knex } from 'knex';
import { DatabaseService } from '../../database/database.service';
import { I18nService } from 'nestjs-i18n';

/**
 * Tool Product Service
 *
 * Application service for tool-product-specific operations.
 * Orchestrates between controllers, domain models, and repositories.
 *
 * @class ToolProductService
 * @version 1.0.0
 * @since 2026-02-12
 */
@Injectable()
export class ToolProductService {
  constructor(
    private readonly repository: ToolProductRepository,
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
   * Creates a tool product extension for an existing base product
   */
  async create(
    businessId: string,
    productId: string,
    dto: CreateToolProductDto,
    creatorPublicId: string,
    lang = 'en',
  ): Promise<IToolProductWithBaseProduct> {
    return this.knex.transaction(async (trx) => {
      await this.validateBusinessAccess(businessId, creatorPublicId, lang, trx);

      // Validate product exists and belongs to business
      await this.validateProductBelongsToBusiness(productId, businessId, lang);

      // Check unique constraint — product must not already have a tool_product record
      const exists = await this.repository.toolProductExists(productId);
      if (exists) {
        throw new ConflictException(
          this.i18n.t('toolProducts.errors.alreadyExists', { lang }),
        );
      }

      const toolProduct = ToolProductModel.create({
        product_id: productId,
        warranty_months: dto.warranty_months ?? 0,
        id_creator: creatorPublicId,
      });

      await this.repository.insertToolProduct(toolProduct.toEntity(), trx);

      // Return with base product info
      const result = await this.repository.findByProductIdWithBaseProduct(
        productId,
        businessId,
      );
      return result!;
    });
  }

  /**
   * Finds a tool product by product ID with base product info
   */
  async findOne(
    businessId: string,
    productId: string,
    userPublicId: string,
    lang = 'en',
  ): Promise<IToolProductWithBaseProduct> {
    await this.validateBusinessAccess(
      businessId,
      userPublicId,
      lang,
      this.knex,
    );

    const toolProduct = await this.repository.findByProductIdWithBaseProduct(
      productId,
      businessId,
    );
    if (!toolProduct) {
      throw new NotFoundException(
        this.i18n.t('toolProducts.errors.notFound', { lang }),
      );
    }
    return toolProduct;
  }

  /**
   * Updates a tool product
   */
  async update(
    businessId: string,
    productId: string,
    dto: UpdateToolProductDto,
    userPublicId: string,
    lang = 'en',
  ): Promise<IToolProductWithBaseProduct> {
    return this.knex.transaction(async (trx) => {
      await this.validateBusinessAccess(businessId, userPublicId, lang, trx);

      // Validate product belongs to business
      await this.validateProductBelongsToBusiness(productId, businessId, lang);

      const toolProduct = await this.repository.findById(productId);
      if (!toolProduct) {
        throw new NotFoundException(
          this.i18n.t('toolProducts.errors.notFound', { lang }),
        );
      }

      // Update using domain model
      toolProduct.updateDetails({
        warrantyMonths: dto.warranty_months,
        updaterId: userPublicId,
      });

      await this.repository.updateToolProduct(toolProduct.toEntity());

      // Return with base product info
      const result = await this.repository.findByProductIdWithBaseProduct(
        productId,
        businessId,
      );
      return result!;
    });
  }

  /**
   * Deletes a tool product (soft delete — only the extension record)
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

      const toolProduct = await this.repository.findById(productId);
      if (!toolProduct) {
        throw new NotFoundException(
          this.i18n.t('toolProducts.errors.notFound', { lang }),
        );
      }

      await this.repository.softDeleteToolProduct(productId);
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
        this.i18n.t('toolProducts.errors.productNotFound', { lang }),
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
        this.i18n.t('toolProducts.errors.business.accessDenied', { lang }),
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
        this.i18n.t('toolProducts.errors.business.notFound', { lang }),
      );
    }

    if (business.status !== 'active') {
      throw new ForbiddenException(
        this.i18n.t('toolProducts.errors.business.inactive', {
          lang,
          args: { status: business.status },
        }),
      );
    }

    // Resolve public_id -> id before comparing with owner_id
    const userId = await this.resolveUserId(userPublicId, lang, trx);

    if (business.owner_id !== userId) {
      throw new ForbiddenException(
        this.i18n.t('toolProducts.errors.business.accessDenied', { lang }),
      );
    }
  }
}
