import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InventoryRepository } from './repository/inventory.repository';
import { InventoryModel } from './models/inventory.model';
import { CreateInventoryDto, UpdateInventoryDto } from './dto';
import { IInventoryWithProduct } from './interfaces/inventory.interface';
import { Knex } from 'knex';
import { DatabaseService } from '../../database/database.service';
import { I18nService } from 'nestjs-i18n';
import { v4 as uuidv4 } from 'uuid';

/**
 * Inventory Service
 *
 * Application service for inventory-specific operations.
 * Orchestrates between controllers, domain models, and repositories.
 *
 * @class InventoryService
 * @version 1.0.0
 * @since 2026-02-12
 */
@Injectable()
export class InventoryService {
  constructor(
    private readonly repository: InventoryRepository,
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
   * Creates an inventory record for an existing base product
   */
  async create(
    businessId: string,
    productId: string,
    dto: CreateInventoryDto,
    creatorPublicId: string,
    lang = 'en',
  ): Promise<IInventoryWithProduct> {
    await this.knex.transaction(async (trx) => {
      await this.validateBusinessAccess(businessId, creatorPublicId, lang, trx);

      // Validate product exists and belongs to business
      await this.validateProductBelongsToBusiness(productId, businessId, lang);

      // Check unique constraint — product must not already have an inventory record
      const exists = await this.repository.inventoryExists(productId);
      if (exists) {
        throw new ConflictException(
          this.i18n.t('inventories.errors.alreadyExists', { lang }),
        );
      }

      const inventory = InventoryModel.create({
        id: uuidv4(),
        product_id: productId,
        quantity: dto.quantity ?? 0,
        min_stock: dto.min_stock ?? 0,
        id_creator: creatorPublicId,
      });

      await this.repository.insertInventory(inventory.toEntity(), trx);
    });

    // Read back after transaction commits so the pool connection can see the row
    const result = await this.repository.findByProductIdWithProduct(
      productId,
      businessId,
    );
    return result!;
  }

  /**
   * Finds all inventories for a business with pagination and optional low_stock filter
   */
  async findAll(
    businessId: string,
    userPublicId: string,
    pagination: { page: number; limit: number },
    filters?: { low_stock?: boolean },
    lang = 'en',
  ): Promise<{
    data: IInventoryWithProduct[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> {
    await this.validateBusinessAccess(
      businessId,
      userPublicId,
      lang,
      this.knex,
    );

    const { data, total } = await this.repository.findAllByBusiness(
      businessId,
      pagination,
      filters,
    );

    return {
      data,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  /**
   * Finds an inventory by product ID with base product info
   */
  async findOne(
    businessId: string,
    productId: string,
    userPublicId: string,
    lang = 'en',
  ): Promise<IInventoryWithProduct> {
    await this.validateBusinessAccess(
      businessId,
      userPublicId,
      lang,
      this.knex,
    );

    const inventory = await this.repository.findByProductIdWithProduct(
      productId,
      businessId,
    );
    if (!inventory) {
      throw new NotFoundException(
        this.i18n.t('inventories.errors.notFound', { lang }),
      );
    }
    return inventory;
  }

  /**
   * Updates an inventory
   */
  async update(
    businessId: string,
    productId: string,
    dto: UpdateInventoryDto,
    userPublicId: string,
    lang = 'en',
  ): Promise<IInventoryWithProduct> {
    return this.knex.transaction(async (trx) => {
      await this.validateBusinessAccess(businessId, userPublicId, lang, trx);

      // Validate product belongs to business
      await this.validateProductBelongsToBusiness(productId, businessId, lang);

      const inventory = await this.repository.findByProductId(productId);
      if (!inventory) {
        throw new NotFoundException(
          this.i18n.t('inventories.errors.notFound', { lang }),
        );
      }

      // Update using domain model
      inventory.updateDetails({
        quantity: dto.quantity,
        minStock: dto.min_stock,
        updaterId: userPublicId,
      });

      await this.repository.updateInventory(inventory.toEntity());

      // Return with base product info
      const result = await this.repository.findByProductIdWithProduct(
        productId,
        businessId,
      );
      return result!;
    });
  }

  /**
   * Deletes an inventory (soft delete — only the inventory record)
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

      const inventory = await this.repository.findByProductId(productId);
      if (!inventory) {
        throw new NotFoundException(
          this.i18n.t('inventories.errors.notFound', { lang }),
        );
      }

      await this.repository.softDeleteInventory(inventory.getId());
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
        this.i18n.t('inventories.errors.productNotFound', { lang }),
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
        this.i18n.t('inventories.errors.business.accessDenied', { lang }),
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
        this.i18n.t('inventories.errors.business.notFound', { lang }),
      );
    }

    if (business.status !== 'active') {
      throw new ForbiddenException(
        this.i18n.t('inventories.errors.business.inactive', {
          lang,
          args: { status: business.status },
        }),
      );
    }

    // Resolve public_id -> id before comparing with owner_id
    const userId = await this.resolveUserId(userPublicId, lang, trx);

    if (business.owner_id !== userId) {
      throw new ForbiddenException(
        this.i18n.t('inventories.errors.business.accessDenied', { lang }),
      );
    }
  }
}
