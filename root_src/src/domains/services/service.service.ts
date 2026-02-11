import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ServiceRepository } from './repository/service.repository';
import { ServiceModel } from './models/service.model';
import {
  CreateServiceDto,
  BatchCreateServicesDto,
  UpdateServiceDto,
  DeleteServiceDto,
} from './dto';
import { IService } from './interfaces/service.interface';
import { v4 as uuidv4 } from 'uuid';
import { Knex } from 'knex';
import { DatabaseService } from '../../database/database.service';
import { I18nService } from 'nestjs-i18n';

/**
 * Service Business Logic - Orchestrates service operations.
 */
@Injectable()
export class ServiceService {
  private readonly MAX_BATCH_SIZE = 20;

  constructor(
    private readonly repository: ServiceRepository,
    private readonly databaseService: DatabaseService,
    private readonly i18n: I18nService,
  ) {}

  private get knex(): Knex {
    return this.databaseService.getKnex();
  }

  /** Creates a single service */
  async createSingle(
    dto: CreateServiceDto,
    creatorId: string,
    lang = 'en',
  ): Promise<IService> {
    return this.knex.transaction(async (trx) => {
      await this.validateBusinessAccess(dto.business_id, creatorId, lang, trx);
      await this.validateNameUniqueness(dto.name, dto.business_id, lang, trx);

      const service = ServiceModel.create({
        id: uuidv4(),
        business_id: dto.business_id,
        name: dto.name,
        description: dto.description ?? null,
        price: dto.price,
        duration_minutes: dto.duration_minutes ?? null,
        daily_quota: dto.daily_quota ?? null,
        id_creator: creatorId,
        created_at: new Date(),
      });

      await this.repository.batchInsert([service], trx);
      return service.toEntity();
    });
  }

  /** Creates multiple services in batch (max 20) */
  async createBatch(
    dto: BatchCreateServicesDto,
    creatorId: string,
    lang = 'en',
  ): Promise<IService[]> {
    const { business_id: businessId, services: serviceDtos } = dto;

    if (serviceDtos.length > this.MAX_BATCH_SIZE) {
      throw new BadRequestException(
        this.i18n.t('services.errors.batch.tooLarge', {
          lang,
          args: { max: this.MAX_BATCH_SIZE },
        }),
      );
    }

    return this.knex.transaction(async (trx) => {
      await this.validateBusinessAccess(businessId, creatorId, lang, trx);

      // Check for duplicate names within batch
      const names = serviceDtos.map((d) => d.name.trim().toLowerCase());
      const duplicatesInBatch = names.filter((n, i) => names.indexOf(n) !== i);
      if (duplicatesInBatch.length > 0) {
        throw new ConflictException(
          this.i18n.t('services.errors.batch.duplicateNames', {
            lang,
            args: { names: [...new Set(duplicatesInBatch)].join(', ') },
          }),
        );
      }

      // Check for existing names in database
      const existingNames = await this.repository.findExistingNames(
        serviceDtos.map((d) => d.name.trim()),
        businessId,
        trx,
      );
      if (existingNames.length > 0) {
        throw new ConflictException(
          this.i18n.t('services.errors.batch.nameAlreadyExists', {
            lang,
            args: { names: existingNames.join(', ') },
          }),
        );
      }

      // Create domain models
      const services = serviceDtos.map((d) =>
        ServiceModel.create({
          id: uuidv4(),
          business_id: businessId,
          name: d.name,
          description: d.description ?? null,
          price: d.price,
          duration_minutes: d.duration_minutes ?? null,
          daily_quota: d.daily_quota ?? null,
          id_creator: creatorId,
          created_at: new Date(),
        }),
      );

      await this.repository.batchInsert(services, trx);
      return services.map((s) => s.toEntity());
    });
  }

  /** Finds service by ID */
  async findById(id: string, lang = 'en'): Promise<IService> {
    const service = await this.repository.findById(id);
    if (!service) {
      throw new NotFoundException(
        this.i18n.t('services.errors.notFound', { lang }),
      );
    }
    return service.toEntity();
  }

  /** Finds services by business ID */
  async findByBusinessId(
    businessId: string,
    userId: string,
    lang = 'en',
  ): Promise<IService[]> {
    await this.validateBusinessAccess(businessId, userId, lang, this.knex);
    const services = await this.repository.findByBusinessId(businessId);
    return services.map((s) => s.toEntity());
  }

  /** Updates a service */
  async update(
    serviceId: string,
    dto: UpdateServiceDto,
    userId: string,
    lang = 'en',
  ): Promise<IService> {
    return this.knex.transaction(async (trx) => {
      // Validate business access first
      await this.validateBusinessAccess(dto.business_id, userId, lang, trx);

      // Find the service
      const service = await this.repository.findById(serviceId);
      if (!service) {
        throw new NotFoundException(
          this.i18n.t('services.errors.notFound', { lang }),
        );
      }

      // Verify service belongs to the business
      if (service.getBusinessId() !== dto.business_id) {
        throw new ForbiddenException(
          this.i18n.t('services.errors.business.accessDenied', { lang }),
        );
      }

      // Check name uniqueness if name is being updated
      if (dto.name && dto.name !== service.getName()) {
        await this.validateNameUniqueness(
          dto.name,
          dto.business_id,
          lang,
          trx,
          serviceId,
        );
      }

      // Update service details
      if (
        dto.name !== undefined ||
        dto.description !== undefined ||
        dto.price !== undefined
      ) {
        service.updateDetails({
          name: dto.name,
          description: dto.description,
          price: dto.price,
        });
      }

      // Update quota settings
      if (dto.duration_minutes !== undefined || dto.daily_quota !== undefined) {
        service.updateQuotaSettings(dto.duration_minutes, dto.daily_quota);
      }

      // Save to database
      await this.repository.updateService(service.toEntity());

      return service.toEntity();
    });
  }

  /** Deletes a service (soft delete) */
  async delete(
    serviceId: string,
    dto: DeleteServiceDto,
    userId: string,
    lang = 'en',
  ): Promise<void> {
    return this.knex.transaction(async (trx) => {
      // Validate business access first
      await this.validateBusinessAccess(dto.business_id, userId, lang, trx);

      // Find the service
      const service = await this.repository.findById(serviceId);
      if (!service) {
        throw new NotFoundException(
          this.i18n.t('services.errors.notFound', { lang }),
        );
      }

      // Verify service belongs to the business
      if (service.getBusinessId() !== dto.business_id) {
        throw new ForbiddenException(
          this.i18n.t('services.errors.business.accessDenied', { lang }),
        );
      }

      // Soft delete the service
      await this.repository.deleteService(serviceId);
    });
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Resolve core.users.id from JWT sub (public_id).
   * owner_id in business.businesses references core.users.id,
   * while JWT sub contains core.users.public_id.
   */
  private async resolveUserId(
    publicId: string,
    lang: string,
    trx: Knex | Knex.Transaction,
  ): Promise<string> {
    const userId = await this.repository.findUserIdByPublicId(publicId, trx);
    if (!userId) {
      throw new UnauthorizedException(
        this.i18n.t('services.errors.business.accessDenied', { lang }),
      );
    }
    return userId;
  }

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
        this.i18n.t('services.errors.business.notFound', { lang }),
      );
    }

    if (business.status !== 'active') {
      throw new ForbiddenException(
        this.i18n.t('services.errors.business.inactive', {
          lang,
          args: { status: business.status },
        }),
      );
    }

    // Resolve public_id -> id before comparing with owner_id
    const userId = await this.resolveUserId(userPublicId, lang, trx);

    if (business.owner_id !== userId) {
      throw new ForbiddenException(
        this.i18n.t('services.errors.business.accessDenied', { lang }),
      );
    }
  }

  private async validateNameUniqueness(
    name: string,
    businessId: string,
    lang: string,
    trx: Knex.Transaction,
    excludeId?: string,
  ): Promise<void> {
    const exists = await this.repository.nameExistsForBusiness(
      name,
      businessId,
      excludeId,
      trx,
    );
    if (exists) {
      throw new ConflictException(
        this.i18n.t('services.errors.nameAlreadyExists', {
          lang,
          args: { name: name.trim() },
        }),
      );
    }
  }
}
