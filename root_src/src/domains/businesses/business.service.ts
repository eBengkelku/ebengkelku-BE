import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { DatabaseService } from '../../database/database.service';
import { FileService } from '../files/file.service';
import { BusinessRepository } from './repository/business.repository';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import type { IBusiness, IBusinessHours } from './interfaces';
import type { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Knex } from 'knex';

const HH_MM_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

import { BusinessStatus } from './contracts/business-status.enum';

@Injectable()
export class BusinessService {
  constructor(
    private readonly repository: BusinessRepository,
    private readonly databaseService: DatabaseService,
    private readonly i18n: I18nService,
    private readonly fileService: FileService,
  ) {}

  private get knex(): Knex {
    return this.databaseService.getKnex();
  }

  /**
   * Resolve owner_id (core.users.id) from JWT sub (public_id).
   * Prevents spoofing: owner_id is never taken from request body.
   */
  async resolveOwnerIdFromSub(sub: string): Promise<string> {
    if (!sub?.trim()) {
      throw new UnauthorizedException(
        this.i18n.t('businesses.errors.ownerRequired'),
      );
    }
    const userId = await this.repository.findUserIdByPublicId(sub);
    if (!userId) {
      throw new UnauthorizedException(
        this.i18n.t('businesses.errors.ownerRequired'),
      );
    }
    return userId;
  }

  /**
   * Resolve id_creator for audit columns.
   * business.businesses.id_creator references core.users.public_id (UUID).
   * JWT sub is public_id (UUID) -> use it directly.
   */
  async resolveCreatorPublicId(sub: string): Promise<string> {
    if (!sub?.trim()) {
      throw new UnauthorizedException(
        this.i18n.t('businesses.errors.ownerRequired'),
      );
    }
    return sub;
  }

  /**
   * Validate business_hours: day 0-6, HH:MM format, close_time > open_time, no duplicate day_of_week.
   */
  private validateBusinessHours(
    businessHours:
      | CreateBusinessDto['business_hours']
      | UpdateBusinessDto['business_hours'],
    lang?: string,
  ): void {
    if (!businessHours?.length) return;

    const seen = new Set<number>();
    for (const h of businessHours) {
      const day = Number(h.day_of_week);
      if (day < 0 || day > 6) {
        throw new BadRequestException(
          this.i18n.t('businesses.validation.hours.dayRange', { lang }),
        );
      }
      if (seen.has(day)) {
        throw new BadRequestException(
          this.i18n.t('businesses.validation.hours.duplicateDay', {
            args: { day },
            lang,
          }),
        );
      }
      seen.add(day);

      const open = String(h.open_time).trim();
      const close = String(h.close_time).trim();
      if (!HH_MM_REGEX.test(open)) {
        throw new BadRequestException(
          this.i18n.t('businesses.validation.hours.openTimeFormat', { lang }),
        );
      }
      if (!HH_MM_REGEX.test(close)) {
        throw new BadRequestException(
          this.i18n.t('businesses.validation.hours.closeTimeFormat', { lang }),
        );
      }
      if (this.timeToMinutes(close) <= this.timeToMinutes(open)) {
        throw new BadRequestException(
          this.i18n.t('businesses.validation.hours.closeAfterOpen', { lang }),
        );
      }
    }
  }

  private timeToMinutes(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  }

  /**
   * Upload files and track their IDs for cleanup on failure.
   * Returns file paths and IDs.
   */
  private async uploadFiles(files: {
    image?: Express.Multer.File;
    cover_image?: Express.Multer.File;
  }): Promise<{
    imagePath: string | null;
    imageFileId: string | null;
    coverImagePath: string | null;
    coverFileId: string | null;
  }> {
    let imagePath: string | null = null;
    let imageFileId: string | null = null;
    let coverImagePath: string | null = null;
    let coverFileId: string | null = null;

    if (files.image) {
      const fileRecord = await this.fileService.createWithFile(files.image);
      imagePath = fileRecord?.file_path ?? null;
      imageFileId = (fileRecord as any)?.id ?? null;
    }

    if (files.cover_image) {
      const fileRecord = await this.fileService.createWithFile(
        files.cover_image,
      );
      coverImagePath = fileRecord?.file_path ?? null;
      coverFileId = (fileRecord as any)?.id ?? null;
    }

    return { imagePath, imageFileId, coverImagePath, coverFileId };
  }

  /**
   * Cleanup uploaded files on transaction failure.
   */
  private async cleanupUploadedFiles(
    imageFileId: string | null,
    coverFileId: string | null,
  ): Promise<void> {
    const cleanupPromises: Promise<void>[] = [];

    if (imageFileId) {
      cleanupPromises.push(
        this.fileService.deleteFile(imageFileId).catch(() => {
          // Swallow cleanup errors to not hide original error
        }),
      );
    }

    if (coverFileId) {
      cleanupPromises.push(
        this.fileService.deleteFile(coverFileId).catch(() => {
          // Swallow cleanup errors
        }),
      );
    }

    await Promise.all(cleanupPromises);
  }

  /**
   * Prepare business hours rows for insertion.
   */
  private prepareBusinessHoursRows(
    businessHours: UpdateBusinessDto['business_hours'],
    businessId: string,
    idCreator: string,
  ): { rows: Array<Record<string, unknown>>; entities: IBusinessHours[] } {
    if (!businessHours?.length) {
      return { rows: [], entities: [] };
    }

    const now = new Date();
    const rows: Array<Record<string, unknown>> = [];
    const entities: IBusinessHours[] = [];

    for (const h of businessHours) {
      const hourId = uuidv4();
      const row = {
        id: hourId,
        business_id: businessId,
        day_of_week: Number(h.day_of_week),
        open_time: String(h.open_time).trim(),
        close_time: String(h.close_time).trim(),
        updated_at: now,
        id_creator: idCreator,
        id_updater: idCreator,
      };
      rows.push(row);
      entities.push({ ...row, deleted_at: null } as IBusinessHours);
    }

    return { rows, entities };
  }

  /**
   * Create a business with optional hours and image/cover_image.
   * Uses transaction; owner_id is set from authenticated user (JWT sub -> core.users.id).
   * id_creator references core.users.public_id (UUID).
   */
  async create(
    dto: CreateBusinessDto,
    ownerId: string,
    idCreatorPublicId: string,
    options: {
      image?: Express.Multer.File;
      cover_image?: Express.Multer.File;
      lang?: string;
    } = {},
  ): Promise<{ business: IBusiness; business_hours: IBusinessHours[] }> {
    const { image, cover_image, lang } = options;

    this.validateBusinessHours(dto.business_hours, lang);

    const trx = await this.knex.transaction();
    let imageFileId: string | null = null;
    let coverFileId: string | null = null;

    try {
      // Upload files
      const {
        imagePath,
        imageFileId: uploadedImageFileId,
        coverImagePath,
        coverFileId: uploadedCoverFileId,
      } = await this.uploadFiles({ image, cover_image });
      imageFileId = uploadedImageFileId;
      coverFileId = uploadedCoverFileId;

      // Create business record
      const now = new Date();
      const businessId = uuidv4();
      const businessRow: Record<string, unknown> = {
        id: businessId,
        owner_id: ownerId,
        name: dto.name.trim(),
        tagline: dto.tagline?.trim() || null,
        status: BusinessStatus.ACTIVE,
        phone: dto.phone?.trim() || null,
        image: imagePath,
        cover_image: coverImagePath,
        latitude: dto.latitude != null ? String(dto.latitude) : null,
        longitude: dto.longitude != null ? String(dto.longitude) : null,
        address: dto.address?.trim() || null,
        created_at: now,
        updated_at: now,
        id_creator: idCreatorPublicId,
      };

      await this.repository.insertBusiness(trx, businessRow);

      // Create business hours
      const { rows: hoursToInsert, entities: hoursEntities } =
        this.prepareBusinessHoursRows(
          dto.business_hours,
          businessId,
          idCreatorPublicId,
        );

      if (hoursToInsert.length > 0) {
        await this.repository.insertBusinessHours(trx, hoursToInsert);
      }

      await trx.commit();

      const business: IBusiness = {
        id: businessId,
        owner_id: ownerId,
        name: businessRow.name as string,
        tagline: (businessRow.tagline as string) ?? null,
        status: businessRow.status as BusinessStatus,
        phone: (businessRow.phone as string) ?? null,
        image: imagePath,
        cover_image: coverImagePath,
        latitude: (businessRow.latitude as string) ?? null,
        longitude: (businessRow.longitude as string) ?? null,
        address: (businessRow.address as string) ?? null,
        created_at: now,
        updated_at: now,
        id_creator: idCreatorPublicId,
      };

      return { business, business_hours: hoursEntities };
    } catch (err) {
      await trx.rollback();
      await this.cleanupUploadedFiles(imageFileId, coverFileId);
      throw err;
    }
  }

  /**
   * Find business by id with business_hours using LEFT JOIN (single query).
   */
  async findById(id: string): Promise<{
    business: IBusiness;
    business_hours: IBusinessHours[];
  } | null> {
    return this.repository.findBusinessWithHoursById(id);
  }

  /**
   * Find all businesses owned by the authenticated user with their business_hours.
   * Returns empty array if user has no businesses.
   * Uses LEFT JOIN to include businesses without hours.
   *
   * @param {string} sub - JWT sub claim (public_id from core.users)
   * @param {string} [lang] - Language code for i18n error messages
   * @returns {Promise<Array<{business: IBusiness; business_hours: IBusinessHours[]}>>}
   * @throws {UnauthorizedException} If sub is invalid or user not found
   *
   * @example
   * ```typescript
   * const businesses = await businessService.findAllByOwner(userSub, 'en');
   * // Returns: [
   * //   { business: {...}, business_hours: [...] },
   * //   { business: {...}, business_hours: [] }
   * // ]
   * ```
   */
  async findAllByOwner(
    sub: string,
    lang?: string,
  ): Promise<Array<{ business: IBusiness; business_hours: IBusinessHours[] }>> {
    // Validate input
    if (!sub?.trim()) {
      throw new UnauthorizedException(
        this.i18n.t('businesses.errors.ownerRequired', { lang }),
      );
    }

    // Resolve owner_id from JWT sub (prevents spoofing)
    const ownerId = await this.resolveOwnerIdFromSub(sub);

    // Fetch all businesses with hours via repository
    const businesses = await this.repository.findAllByOwnerId(ownerId);

    return businesses;
  }

  /**
   * Find a specific business by ID, verifying that the authenticated user
   * is the owner of the business. Uses LEFT JOIN to include business_hours.
   *
   * @param {string} businessId - UUID of the business to retrieve
   * @param {string} sub - JWT sub claim (public_id from core.users)
   * @param {string} [lang='en'] - Language code for i18n error messages
   * @returns {Promise<{ business: IBusiness; business_hours: IBusinessHours[] }>}
   * @throws {UnauthorizedException} If sub is invalid or user not found
   * @throws {BadRequestException} If businessId is empty/invalid
   * @throws {NotFoundException} If business not found or soft-deleted
   * @throws {ForbiddenException} If user is not the owner of the business
   *
   * @example
   * ```typescript
   * const result = await businessService.findOneById('biz-uuid', userSub, 'en');
   * // Returns: { business: {...}, business_hours: [...] }
   * ```
   */
  async findOneById(
    businessId: string,
    sub: string,
    lang?: string,
  ): Promise<{ business: IBusiness; business_hours: IBusinessHours[] }> {
    // 1. Validate sub (JWT claim)
    if (!sub?.trim()) {
      throw new UnauthorizedException(
        this.i18n.t('businesses.errors.ownerRequired', { lang }),
      );
    }

    // 2. Validate businessId
    if (!businessId?.trim()) {
      throw new BadRequestException(
        this.i18n.t('businesses.errors.invalidBusinessId', { lang }),
      );
    }

    // 3. Resolve owner_id from JWT sub (prevents spoofing)
    const ownerId = await this.resolveOwnerIdFromSub(sub);

    // 4. Fetch business with hours via repository (LEFT JOIN)
    const result = await this.repository.findBusinessWithHoursById(businessId);

    // 5. Check if business exists
    if (!result) {
      throw new NotFoundException(
        this.i18n.t('businesses.errors.notFound', { lang }),
      );
    }

    // 6. Verify ownership: only the owner can access this business
    if (result.business.owner_id !== ownerId) {
      throw new ForbiddenException(
        this.i18n.t('businesses.errors.accessDenied', { lang }),
      );
    }

    return result;
  }

  /**
   * Update a business by ID, verifying that the authenticated user
   * is the owner. Supports partial updates for all fields including business_hours.
   */
  async update(
    businessId: string,
    dto: UpdateBusinessDto,
    sub: string,
    options: {
      image?: Express.Multer.File;
      cover_image?: Express.Multer.File;
      lang?: string;
    } = {},
  ): Promise<{ business: IBusiness; business_hours: IBusinessHours[] }> {
    const { image, cover_image, lang } = options;

    // Validate inputs
    if (!sub?.trim()) {
      throw new UnauthorizedException(
        this.i18n.t('businesses.errors.ownerRequired', { lang }),
      );
    }
    if (!businessId?.trim()) {
      throw new BadRequestException(
        this.i18n.t('businesses.errors.invalidBusinessId', { lang }),
      );
    }
    if (dto.business_hours) {
      this.validateBusinessHours(dto.business_hours, lang);
    }

    // Resolve owner and verify ownership
    const ownerId = await this.resolveOwnerIdFromSub(sub);
    const idUpdaterPublicId = await this.resolveCreatorPublicId(sub);

    const existing =
      await this.repository.findBusinessWithHoursById(businessId);
    if (!existing) {
      throw new NotFoundException(
        this.i18n.t('businesses.errors.notFound', { lang }),
      );
    }
    if (existing.business.owner_id !== ownerId) {
      throw new ForbiddenException(
        this.i18n.t('businesses.errors.accessDenied', { lang }),
      );
    }

    // Start transaction
    const trx = await this.knex.transaction();
    let imageFileId: string | null = null;
    let coverFileId: string | null = null;

    try {
      const now = new Date();

      // Upload files if provided
      const {
        imagePath,
        imageFileId: uploadedImageFileId,
        coverImagePath,
        coverFileId: uploadedCoverFileId,
      } = await this.uploadFiles({ image, cover_image });
      imageFileId = uploadedImageFileId;
      coverFileId = uploadedCoverFileId;

      // Prepare updates object
      const updates = this.buildBusinessUpdates(dto, {
        imagePath,
        coverImagePath,
        now,
        idUpdater: idUpdaterPublicId,
      });

      // Update business record
      await this.repository.updateBusiness(trx, businessId, updates);

      // Handle business_hours update if provided
      let hoursRows = existing.business_hours;
      if (dto.business_hours !== undefined) {
        await this.repository.softDeleteBusinessHours(
          trx,
          businessId,
          idUpdaterPublicId,
        );

        const { rows: hoursToInsert, entities } = this.prepareBusinessHoursRows(
          dto.business_hours,
          businessId,
          idUpdaterPublicId,
        );

        if (hoursToInsert.length > 0) {
          await this.repository.insertBusinessHours(trx, hoursToInsert);
        }
        hoursRows = entities;
      }

      await trx.commit();

      // Build final business object
      const business = this.buildUpdatedBusiness(
        existing.business,
        updates,
        businessId,
        ownerId,
        now,
        idUpdaterPublicId,
      );

      return { business, business_hours: hoursRows };
    } catch (err) {
      await trx.rollback();
      await this.cleanupUploadedFiles(imageFileId, coverFileId);
      throw err;
    }
  }

  /**
   * Build updates object from DTO for business update.
   */
  private buildBusinessUpdates(
    dto: UpdateBusinessDto,
    context: {
      imagePath?: string | null;
      coverImagePath?: string | null;
      now: Date;
      idUpdater: string;
    },
  ): Record<string, unknown> {
    const updates: Record<string, unknown> = {
      updated_at: context.now,
      id_updater: context.idUpdater,
    };

    if (dto.name !== undefined) updates.name = dto.name.trim();
    if (dto.tagline !== undefined)
      updates.tagline = dto.tagline ? dto.tagline.trim() : null;
    if (dto.status !== undefined) updates.status = dto.status;
    if (dto.phone !== undefined)
      updates.phone = dto.phone ? dto.phone.trim() : null;
    if (dto.address !== undefined)
      updates.address = dto.address ? dto.address.trim() : null;
    if (dto.latitude !== undefined)
      updates.latitude = dto.latitude != null ? String(dto.latitude) : null;
    if (dto.longitude !== undefined)
      updates.longitude = dto.longitude != null ? String(dto.longitude) : null;
    if (context.imagePath !== undefined) updates.image = context.imagePath;
    if (context.coverImagePath !== undefined)
      updates.cover_image = context.coverImagePath;

    return updates;
  }

  /**
   * Build the final updated business object, merging existing data with updates.
   */
  private buildUpdatedBusiness(
    existing: IBusiness,
    updates: Record<string, unknown>,
    businessId: string,
    ownerId: string,
    updatedAt: Date,
    idUpdater: string,
  ): IBusiness {
    return {
      id: businessId,
      owner_id: ownerId,
      name: (updates.name as string) ?? existing.name,
      tagline:
        updates.tagline !== undefined
          ? (updates.tagline as string | null)
          : existing.tagline,
      status: (updates.status as BusinessStatus) ?? existing.status,
      phone:
        updates.phone !== undefined
          ? (updates.phone as string | null)
          : existing.phone,
      image:
        updates.image !== undefined
          ? (updates.image as string | null)
          : existing.image,
      cover_image:
        updates.cover_image !== undefined
          ? (updates.cover_image as string | null)
          : existing.cover_image,
      latitude:
        updates.latitude !== undefined
          ? (updates.latitude as string | null)
          : existing.latitude,
      longitude:
        updates.longitude !== undefined
          ? (updates.longitude as string | null)
          : existing.longitude,
      address:
        updates.address !== undefined
          ? (updates.address as string | null)
          : existing.address,
      created_at: existing.created_at,
      updated_at: updatedAt,
      deleted_at: existing.deleted_at,
      id_creator: existing.id_creator,
      id_updater: idUpdater,
    };
  }

  /**
   * Soft delete a business by ID with cascade to related tables.
   * Only the owner can delete their business.
   * Idempotent: returns success if already soft-deleted and requester is owner.
   *
   * @param {string} businessId - UUID of the business
   * @param {string} sub - JWT sub claim (public_id from core.users)
   * @param {string} lang - Language for i18n messages
   * @returns {Promise<void>}
   * @throws {UnauthorizedException} If sub is invalid or user not found
   * @throws {BadRequestException} If businessId is empty/invalid
   * @throws {NotFoundException} If business not found
   * @throws {ForbiddenException} If user is not the owner of the business
   */
  async remove(businessId: string, sub: string, lang?: string): Promise<void> {
    // 1. Validate sub (JWT claim)
    if (!sub?.trim()) {
      throw new UnauthorizedException(
        this.i18n.t('businesses.errors.ownerRequired', { lang }),
      );
    }

    // 2. Validate businessId
    if (!businessId?.trim()) {
      throw new BadRequestException(
        this.i18n.t('businesses.errors.invalidBusinessId', { lang }),
      );
    }

    // 3. Resolve owner_id from JWT sub (prevents spoofing) and validate user existence
    const ownerId = await this.resolveOwnerIdFromSub(sub);
    const idUpdater = sub;

    // 4. Fetch business INCLUDING soft-deleted for idempotency check
    const result =
      await this.repository.findBusinessByIdIncludingDeleted(businessId);

    // 5. Check if business exists (404 if never existed)
    if (!result) {
      throw new NotFoundException(
        this.i18n.t('businesses.errors.notFound', { lang }),
      );
    }

    // 6. Verify ownership (403 if not owner, even if already deleted)
    if (result.business.owner_id !== ownerId) {
      throw new ForbiddenException(
        this.i18n.t('businesses.errors.accessDenied', { lang }),
      );
    }

    // 7. Store file paths for cleanup after DB commit
    const imagePath = result.business.image ?? null;
    const coverImagePath = result.business.cover_image ?? null;

    // 8. Start transaction for cascade soft-delete
    const trx = await this.knex.transaction();

    try {
      // Re-fetch business row inside the transaction with a row-level lock
      // to prevent race conditions in concurrent delete scenarios.
      const lockedBusiness = await trx<IBusiness>('businesses')
        .where('id', businessId)
        .forUpdate()
        .first();

      // If the business was hard-deleted between the initial check and now
      if (!lockedBusiness) {
        throw new NotFoundException(
          this.i18n.t('businesses.errors.notFound', { lang }),
        );
      }

      // Idempotent: if already soft-deleted, do nothing
      if (lockedBusiness.deleted_at !== null) {
        await trx.commit();
        return;
      }

      // Cascade soft delete: children first, then parent
      await this.repository.softDeleteBusinessHours(trx, businessId, idUpdater);
      await this.repository.softDeleteBusinessReviews(
        trx,
        businessId,
        idUpdater,
      );
      await this.repository.softDeleteServices(trx, businessId, idUpdater);
      await this.repository.softDeleteBusiness(trx, businessId, idUpdater);

      await trx.commit();
    } catch (err) {
      await trx.rollback();
      throw err;
    }

    // 9. Delete physical files after DB commit (log errors, don't throw)
    await this.cleanupPhysicalFiles(imagePath, coverImagePath, businessId);
  }

  /**
   * Delete physical image files from storage.
   * Finds file records by path, then deletes them via FileService.
   * Logs errors but does not throw to prevent breaking the delete operation.
   *
   * @param {string | null} imagePath - Path to image file
   * @param {string | null} coverImagePath - Path to cover image file
   * @param {string} businessId - Business ID for error context
   */
  private async cleanupPhysicalFiles(
    imagePath: string | null,
    coverImagePath: string | null,
    businessId: string,
  ): Promise<void> {
    const filesToDelete: string[] = [];

    // Find file IDs by path
    if (imagePath && imagePath.trim()) {
      try {
        const fileRecord = await this.knex('files.files')
          .where('file_path', imagePath)
          .whereNull('deleted_at')
          .select('id')
          .first();

        if (fileRecord?.id) {
          filesToDelete.push(fileRecord.id);
        }
      } catch (error) {
        console.error(
          `Failed to find image file record for business ${businessId}:`,
          imagePath,
          error,
        );
      }
    }

    if (coverImagePath && coverImagePath.trim()) {
      try {
        const fileRecord = await this.knex('files.files')
          .where('file_path', coverImagePath)
          .whereNull('deleted_at')
          .select('id')
          .first();

        if (fileRecord?.id) {
          filesToDelete.push(fileRecord.id);
        }
      } catch (error) {
        console.error(
          `Failed to find cover image file record for business ${businessId}:`,
          coverImagePath,
          error,
        );
      }
    }

    // Delete files via FileService
    for (const fileId of filesToDelete) {
      try {
        await this.fileService.deleteFile(fileId);
      } catch (error) {
        console.error(
          `Failed to delete file ${fileId} for business ${businessId}:`,
          error,
        );
      }
    }
  }
}
