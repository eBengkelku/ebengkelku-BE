import {
  BaseDomainModel,
  DomainValidationException,
} from '../../../common/domain';
import { ServiceErrorCodes } from '../constants';
import { IService, IServiceCreate } from '../interfaces/service.interface';

/**
 * Service Domain Model - Rich domain model for workshop services (layanan).
 * Follows DDD pattern with private fields, factory methods, and business logic encapsulation.
 */
export class ServiceModel extends BaseDomainModel<IService> {
  private static readonly MAX_PRICE = 2147483647;
  private static readonly MAX_NAME_LENGTH = 255;

  private constructor(
    private readonly id: string,
    private readonly businessId: string,
    private name: string,
    private description: string | null,
    private price: number,
    private durationMinutes: number | null,
    private dailyQuota: number | null,
    private readonly idCreator: string,
    private readonly createdAt: Date,
    private updatedAt: Date | null,
    private readonly deletedAt: Date | null,
  ) {
    super();
  }

  // ============================================================================
  // FACTORY METHODS
  // ============================================================================

  /** Creates a new Service with validation */
  static create(data: IServiceCreate): ServiceModel {
    ServiceModel.validateName(data.name);
    ServiceModel.validatePrice(data.price);
    ServiceModel.validateOptionalNumber(
      data.duration_minutes,
      'duration_minutes',
    );
    ServiceModel.validateOptionalNumber(data.daily_quota, 'daily_quota');

    return new ServiceModel(
      data.id,
      data.business_id,
      data.name.trim(),
      data.description?.trim() || null,
      data.price,
      data.duration_minutes ?? null,
      data.daily_quota ?? null,
      data.id_creator,
      data.created_at,
      null,
      null,
    );
  }

  /** Reconstitutes a Service from database data (no validation) */
  static reconstitute(data: IService): ServiceModel {
    return new ServiceModel(
      data.id,
      data.business_id,
      data.name,
      data.description ?? null,
      data.price,
      data.duration_minutes ?? null,
      data.daily_quota ?? null,
      data.id_creator,
      data.created_at,
      data.updated_at ?? null,
      data.deleted_at ?? null,
    );
  }

  // ============================================================================
  // VALIDATION HELPERS (static for reuse)
  // ============================================================================

  private static validateName(name: string): void {
    if (!name?.trim()) {
      throw new DomainValidationException(
        ServiceErrorCodes.SERVICE_VALIDATION_NAME_REQUIRED,
        { field: 'name' },
      );
    }
    if (name.trim().length > ServiceModel.MAX_NAME_LENGTH) {
      throw new DomainValidationException(
        ServiceErrorCodes.SERVICE_VALIDATION_NAME_TOO_LONG,
        { field: 'name', max: ServiceModel.MAX_NAME_LENGTH },
      );
    }
  }

  private static validatePrice(price: number): void {
    if (!Number.isInteger(price) || price < 0) {
      throw new DomainValidationException(
        ServiceErrorCodes.SERVICE_VALIDATION_PRICE_INVALID,
        { field: 'price', value: price },
      );
    }
    if (price > ServiceModel.MAX_PRICE) {
      throw new DomainValidationException(
        ServiceErrorCodes.SERVICE_VALIDATION_PRICE_INVALID,
        { field: 'price', value: price, max: ServiceModel.MAX_PRICE },
      );
    }
  }

  private static validateOptionalNumber(
    value: number | null | undefined,
    field: string,
  ): void {
    if (value === null || value === undefined) return;
    if (!Number.isInteger(value) || value < 0) {
      throw new DomainValidationException(
        ServiceErrorCodes.SERVICE_VALIDATION_INVALID_NUMBER,
        { field, value },
      );
    }
  }

  // ============================================================================
  // BUSINESS OPERATIONS
  // ============================================================================

  updateDetails(data: {
    name?: string;
    description?: string | null;
    price?: number;
  }): void {
    if (data.name !== undefined) {
      ServiceModel.validateName(data.name);
      this.name = data.name.trim();
    }
    if (data.description !== undefined) {
      this.description = data.description?.trim() || null;
    }
    if (data.price !== undefined) {
      ServiceModel.validatePrice(data.price);
      this.price = data.price;
    }
    this.updatedAt = new Date();
  }

  updateQuotaSettings(
    durationMinutes?: number | null,
    dailyQuota?: number | null,
  ): void {
    if (durationMinutes !== undefined) {
      ServiceModel.validateOptionalNumber(durationMinutes, 'duration_minutes');
      this.durationMinutes = durationMinutes;
    }
    if (dailyQuota !== undefined) {
      ServiceModel.validateOptionalNumber(dailyQuota, 'daily_quota');
      this.dailyQuota = dailyQuota;
    }
    this.updatedAt = new Date();
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  isFreeService(): boolean {
    return this.price === 0;
  }

  hasTimeLimit(): boolean {
    return this.durationMinutes !== null;
  }

  hasQuotaLimit(): boolean {
    return this.dailyQuota !== null;
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  getId(): string {
    return this.id;
  }
  getBusinessId(): string {
    return this.businessId;
  }
  getName(): string {
    return this.name;
  }
  getDescription(): string | null {
    return this.description;
  }
  getPrice(): number {
    return this.price;
  }
  getDurationMinutes(): number | null {
    return this.durationMinutes;
  }
  getDailyQuota(): number | null {
    return this.dailyQuota;
  }
  getCreatorId(): string {
    return this.idCreator;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date | null {
    return this.updatedAt;
  }

  // ============================================================================
  // CONVERSION
  // ============================================================================

  toEntity(): IService {
    return {
      id: this.id,
      business_id: this.businessId,
      name: this.name,
      description: this.description,
      price: this.price,
      duration_minutes: this.durationMinutes,
      daily_quota: this.dailyQuota,
      id_creator: this.idCreator,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      deleted_at: this.deletedAt,
    };
  }
}
