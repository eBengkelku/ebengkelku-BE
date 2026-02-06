import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { DatabaseService } from '../../../database/database.service';
import type { IBusiness, IBusinessHours } from '../interfaces';

const BUSINESS_SCHEMA = 'business';

/**
 * Business Repository
 *
 * Centralizes all persistence/data-access for the businesses domain.
 * Keeps Knex queries out of the service layer (DDD-style repository pattern),
 * while allowing services to orchestrate transactions and workflows.
 */
@Injectable()
export class BusinessRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  private get knex(): Knex {
    return this.databaseService.getKnex();
  }

  // ============================================================================
  // core.users lookups (used by auth-derived ownership/creator resolution)
  // ============================================================================

  async findUserIdByPublicId(publicId: string): Promise<string | null> {
    const row = await this.knex('core.users')
      .where('public_id', publicId)
      .whereNull('deleted_at')
      .select('id')
      .first();
    return row?.id ?? null;
  }

  async findUserPublicIdById(id: string): Promise<string | null> {
    const row = await this.knex('core.users')
      .where('id', id)
      .whereNull('deleted_at')
      .select('public_id')
      .first();
    return row?.public_id ?? null;
  }

  // ============================================================================
  // business.businesses + business.business_hours persistence
  // ============================================================================

  async insertBusiness(
    trx: Knex.Transaction,
    row: Record<string, unknown>,
  ): Promise<void> {
    await trx.withSchema(BUSINESS_SCHEMA).table('businesses').insert(row);
  }

  async insertBusinessHours(
    trx: Knex.Transaction,
    rows: Array<Record<string, unknown>>,
  ): Promise<void> {
    await trx.withSchema(BUSINESS_SCHEMA).table('business_hours').insert(rows);
  }

  /**
   * Find business by id with business_hours using LEFT JOIN (single query).
   * Returns null if not found or soft-deleted.
   */
  async findBusinessWithHoursById(id: string): Promise<{
    business: IBusiness;
    business_hours: IBusinessHours[];
  } | null> {
    type JoinedRow = {
      id: string;
      owner_id: string;
      name: string;
      tagline?: string | null;
      status: string;
      phone?: string | null;
      image?: string | null;
      cover_image?: string | null;
      latitude?: string | null;
      longitude?: string | null;
      address?: string | null;
      created_at: Date;
      updated_at?: Date | null;
      deleted_at?: Date | null;
      id_creator?: string | null;
      id_updater?: string | null;
      hour_id?: string | null;
      hour_business_id?: string | null;
      hour_day_of_week?: number | null;
      hour_open_time?: string | null;
      hour_close_time?: string | null;
      hour_created_at?: Date | null;
      hour_updated_at?: Date | null;
      hour_deleted_at?: Date | null;
      hour_id_creator?: string | null;
      hour_id_updater?: string | null;
    };

    const rows = (await this.knex
      .withSchema(BUSINESS_SCHEMA)
      .from('businesses')
      .leftJoin('business_hours', function () {
        this.on('businesses.id', '=', 'business_hours.business_id').andOnNull(
          'business_hours.deleted_at',
        );
      })
      .where('businesses.id', id)
      .whereNull('businesses.deleted_at')
      .orderBy('business_hours.day_of_week')
      .select(
        'businesses.id',
        'businesses.owner_id',
        'businesses.name',
        'businesses.tagline',
        'businesses.status',
        'businesses.phone',
        'businesses.image',
        'businesses.cover_image',
        'businesses.latitude',
        'businesses.longitude',
        'businesses.address',
        'businesses.created_at',
        'businesses.updated_at',
        'businesses.deleted_at',
        'businesses.id_creator',
        'businesses.id_updater',
        'business_hours.id as hour_id',
        'business_hours.business_id as hour_business_id',
        'business_hours.day_of_week as hour_day_of_week',
        'business_hours.open_time as hour_open_time',
        'business_hours.close_time as hour_close_time',
        'business_hours.created_at as hour_created_at',
        'business_hours.updated_at as hour_updated_at',
        'business_hours.deleted_at as hour_deleted_at',
        'business_hours.id_creator as hour_id_creator',
        'business_hours.id_updater as hour_id_updater',
      )) as JoinedRow[];

    if (!rows?.length) return null;

    const first = rows[0];
    const business: IBusiness = {
      id: first.id,
      owner_id: first.owner_id,
      name: first.name,
      tagline: first.tagline ?? null,
      status: first.status,
      phone: first.phone ?? null,
      image: first.image ?? null,
      cover_image: first.cover_image ?? null,
      latitude: first.latitude ?? null,
      longitude: first.longitude ?? null,
      address: first.address ?? null,
      created_at: first.created_at,
      updated_at: first.updated_at ?? null,
      deleted_at: first.deleted_at ?? null,
      id_creator: first.id_creator ?? null,
      id_updater: first.id_updater ?? null,
    };

    const business_hours: IBusinessHours[] = rows
      .filter((r) => r.hour_id != null)
      .map((r) => ({
        id: r.hour_id,
        business_id: r.hour_business_id,
        day_of_week: r.hour_day_of_week,
        open_time: r.hour_open_time,
        close_time: r.hour_close_time,
        created_at: r.hour_created_at ?? null,
        updated_at: r.hour_updated_at ?? null,
        deleted_at: r.hour_deleted_at ?? null,
        id_creator: r.hour_id_creator ?? null,
        id_updater: r.hour_id_updater ?? null,
      })) as IBusinessHours[];

    return { business, business_hours };
  }

  /**
   * Find all businesses by owner_id with business_hours using LEFT JOIN.
   * Returns empty array if not found.
   * Excludes soft-deleted businesses and hours.
   * Orders by business created_at DESC, then hours day_of_week ASC.
   *
   * @param {string} ownerId - The owner's internal user ID (core.users.id)
   * @returns {Promise<Array<{business: IBusiness; business_hours: IBusinessHours[]}>>}
   */
  async findAllByOwnerId(
    ownerId: string,
  ): Promise<Array<{ business: IBusiness; business_hours: IBusinessHours[] }>> {
    type JoinedRow = {
      id: string;
      owner_id: string;
      name: string;
      tagline?: string | null;
      status: string;
      phone?: string | null;
      image?: string | null;
      cover_image?: string | null;
      latitude?: string | null;
      longitude?: string | null;
      address?: string | null;
      created_at: Date;
      updated_at?: Date | null;
      deleted_at?: Date | null;
      id_creator?: string | null;
      id_updater?: string | null;
      hour_id?: number | null;
      hour_business_id?: number | null;
      hour_day_of_week?: number | null;
      hour_open_time?: string | null;
      hour_close_time?: string | null;
    };

    const rows = (await this.knex
      .withSchema(BUSINESS_SCHEMA)
      .from('businesses')
      .leftJoin('business_hours', 'businesses.id', 'business_hours.business_id')
      .where('businesses.owner_id', ownerId)
      .whereNull('businesses.deleted_at')
      .orderBy('businesses.created_at', 'desc')
      .orderBy('business_hours.day_of_week', 'asc')
      .select(
        'businesses.id',
        'businesses.owner_id',
        'businesses.name',
        'businesses.tagline',
        'businesses.status',
        'businesses.phone',
        'businesses.image',
        'businesses.cover_image',
        'businesses.latitude',
        'businesses.longitude',
        'businesses.address',
        'businesses.created_at',
        'businesses.updated_at',
        'businesses.deleted_at',
        'businesses.id_creator',
        'businesses.id_updater',
        'business_hours.id as hour_id',
        'business_hours.business_id as hour_business_id',
        'business_hours.day_of_week as hour_day_of_week',
        'business_hours.open_time as hour_open_time',
        'business_hours.close_time as hour_close_time',
      )) as JoinedRow[];

    if (!rows?.length) return [];

    // Group rows by business.id
    const businessMap = new Map<
      string,
      { business: IBusiness; business_hours: IBusinessHours[] }
    >();

    for (const row of rows) {
      const businessId = row.id;

      // Initialize business if not exists
      if (!businessMap.has(businessId)) {
        businessMap.set(businessId, {
          business: {
            id: row.id,
            owner_id: row.owner_id,
            name: row.name,
            tagline: row.tagline ?? null,
            status: row.status,
            phone: row.phone ?? null,
            image: row.image ?? null,
            cover_image: row.cover_image ?? null,
            latitude: row.latitude ?? null,
            longitude: row.longitude ?? null,
            address: row.address ?? null,
            created_at: row.created_at,
            updated_at: row.updated_at ?? null,
            deleted_at: row.deleted_at ?? null,
            id_creator: row.id_creator ?? null,
            id_updater: row.id_updater ?? null,
          },
          business_hours: [],
        });
      }

      // Add business hour if exists (LEFT JOIN may return null)
      if (row.hour_id && row.hour_business_id) {
        businessMap.get(businessId)!.business_hours.push({
          id: row.hour_id.toString(),
          business_id: row.hour_business_id.toString(),
          day_of_week: row.hour_day_of_week!,
          open_time: row.hour_open_time!,
          close_time: row.hour_close_time!,
          created_at: null,
          updated_at: null,
          deleted_at: null,
          id_creator: null,
          id_updater: null,
        } as IBusinessHours);
      }
    }

    // Convert Map to Array (maintains insertion order = created_at DESC)
    return Array.from(businessMap.values());
  }
}
