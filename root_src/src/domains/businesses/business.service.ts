import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
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

  /** UUID v4 regex (simple check so dev-user-001 is not treated as UUID). */
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  /**
   * Resolve owner_id (core.users.id) from JWT sub (public_id).
   * Prevents spoofing: owner_id is never taken from request body.
   * When sub is not a UUID (e.g. dev bypass with sub 'dev-user-001'), uses
   * DEV_OWNER_ID from env in local/development so dev-user.config.ts can stay unchanged.
   */
  async resolveOwnerIdFromSub(sub: string): Promise<string> {
    if (!sub?.trim()) {
      throw new UnauthorizedException(
        this.i18n.t('businesses.errors.ownerRequired'),
      );
    }
    const isDev =
      process.env.NODE_ENV === 'local' || process.env.NODE_ENV === 'development';
    const devOwnerId = process.env.DEV_OWNER_ID?.trim();
    const subIsNotUuid = !BusinessService.UUID_REGEX.test(sub);
    if (isDev && subIsNotUuid) {
      if (devOwnerId) {
        // DEV_OWNER_ID may be configured as either core.users.id OR core.users.public_id.
        // Prefer treating it as public_id when it matches a user record.
        if (!BusinessService.UUID_REGEX.test(devOwnerId)) {
          throw new UnauthorizedException(
            this.i18n.t('businesses.errors.devOwnerIdRequired'),
          );
        }
        const byPublicId = await this.repository.findUserIdByPublicId(devOwnerId);
        if (byPublicId) return byPublicId;
        // Fallback: assume it's already core.users.id
        return devOwnerId;
      }
      throw new UnauthorizedException(
        this.i18n.t('businesses.errors.devOwnerIdRequired'),
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
   * - In normal flow, JWT sub is public_id (UUID) -> use it directly.
   * - In dev-bypass (sub is not UUID), derive from ownerId (core.users.id).
   */
  async resolveCreatorPublicId(sub: string, ownerId: string): Promise<string> {
    if (BusinessService.UUID_REGEX.test(sub)) return sub;
    const publicId = await this.repository.findUserPublicIdById(ownerId);
    if (!publicId) {
      throw new UnauthorizedException(
        this.i18n.t('businesses.errors.ownerRequired'),
      );
    }
    return publicId;
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

    try {
      let imagePath: string | null = null;
      let coverImagePath: string | null = null;
      if (image) {
        const fileRecord = await this.fileService.createWithFile(image);
        imagePath = fileRecord?.file_path ?? null;
      }
      if (cover_image) {
        const fileRecord = await this.fileService.createWithFile(cover_image);
        coverImagePath = fileRecord?.file_path ?? null;
      }

      const now = new Date();
      const businessId = uuidv4();
      const businessRow: Record<string, unknown> = {
        id: businessId,
        owner_id: ownerId,
        name: dto.name.trim(),
        tagline: dto.tagline?.trim() || null,
        status: 'pending',
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
        const hoursToInsert = dto.business_hours.map((h) => {
          const hourId = uuidv4();
          return {
            id: hourId,
            business_id: businessId,
            day_of_week: Number(h.day_of_week),
            open_time: String(h.open_time).trim(),
            close_time: String(h.close_time).trim(),
            id_creator: idCreatorPublicId,
          };
        });
        await this.repository.insertBusinessHours(trx, hoursToInsert as any[]);
        for (const h of hoursToInsert) {
          hoursRows.push({
            ...h,
            created_at: now,
            updated_at: now,
          } as IBusinessHours);
        }
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
}
