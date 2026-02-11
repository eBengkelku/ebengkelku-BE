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
import type { IBusiness, IBusinessHours } from './interfaces';
import type { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Knex } from 'knex';

const HH_MM_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

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
    businessHours: CreateBusinessDto['business_hours'],
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
      let imagePath: string | null = null;
      let coverImagePath: string | null = null;
      if (image) {
        const fileRecord = await this.fileService.createWithFile(image);
        imagePath = fileRecord?.file_path ?? null;
        imageFileId = (fileRecord as any)?.id ?? null;
      }
      if (cover_image) {
        const fileRecord = await this.fileService.createWithFile(cover_image);
        coverImagePath = fileRecord?.file_path ?? null;
        coverFileId = (fileRecord as any)?.id ?? null;
      }

      const now = new Date();
      const businessId = uuidv4();
      const businessRow: Record<string, unknown> = {
        id: businessId,
        owner_id: ownerId,
        name: dto.name.trim(),
        tagline: dto.tagline?.trim() || null,
        status: 'active',
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

      const hoursRows: IBusinessHours[] = [];
      if (dto.business_hours?.length) {
        const hoursToInsert: Array<Record<string, unknown>> =
          dto.business_hours.map((h) => {
            const hourId = uuidv4();
            const row = {
              id: hourId,
              business_id: businessId,
              day_of_week: Number(h.day_of_week),
              open_time: String(h.open_time).trim(),
              close_time: String(h.close_time).trim(),
              id_creator: idCreatorPublicId,
            };
            hoursRows.push({
              ...(row as {
                id: string;
                business_id: string;
                day_of_week: number;
                open_time: string;
                close_time: string;
                id_creator: string;
              }),
              updated_at: now,
            } as IBusinessHours);
            return row;
          });
        await this.repository.insertBusinessHours(trx, hoursToInsert);
      }

      await trx.commit();

      const business: IBusiness = {
        id: businessId,
        owner_id: ownerId,
        name: businessRow.name as string,
        tagline: (businessRow.tagline as string) ?? null,
        status: 'pending',
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

      return { business, business_hours: hoursRows };
    } catch (err) {
      // Compensating cleanup for uploaded files if transaction failed
      if (imageFileId) {
        try {
          await this.fileService.deleteFile(imageFileId);
        } catch {
          // swallow cleanup errors to not hide original error
        }
      }
      if (coverFileId) {
        try {
          await this.fileService.deleteFile(coverFileId);
        } catch {
          // swallow cleanup errors
        }
      }
      await trx.rollback();
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
}
