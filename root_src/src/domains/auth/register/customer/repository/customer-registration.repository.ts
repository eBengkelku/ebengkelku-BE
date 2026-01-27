import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../../../../../database/database.service';
import { EncryptionService } from '../../../../../jobs/user-encryption/services/encryption.service';
import { ICustomer, IRole, ICustomerWithRoles, IUserRow } from '../interfaces';

/**
 * Customer Registration Repository
 *
 * Handles data access operations for customer registration.
 * Manages PII encryption/decryption transparently.
 *
 * @class CustomerRegistrationRepository
 * @version 1.0.0
 * @since 2026-01-27
 */
@Injectable()
export class CustomerRegistrationRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Get Knex instance
   */
  private get knex(): Knex {
    return this.databaseService.getKnex();
  }

  /**
   * Find user by email (case-insensitive)
   * Checks only non-deleted users
   */
  async findByEmail(email: string): Promise<ICustomer | null> {
    // First, encrypt the email to search in database
    // Since emails are stored encrypted, we need to search by encrypted value
    // However, this is complex - instead, we'll search all and decrypt
    // For efficiency, we can use a hash index, but for now, use direct comparison

    const users = await this.knex<IUserRow>('core.users')
      .whereNull('deleted_at')
      .select('*');

    for (const user of users) {
      let decryptedEmail: string;
      try {
        if (user.is_encrypted && user.email) {
          decryptedEmail = this.encryptionService.decryptFromString(user.email);
        } else {
          decryptedEmail = user.email;
        }

        if (decryptedEmail.toLowerCase() === email.toLowerCase()) {
          return this.mapRowToCustomer(user);
        }
      } catch {
        // Skip users with decryption errors
        continue;
      }
    }

    return null;
  }

  /**
   * Find role by key
   */
  async findRoleByKey(key: string): Promise<IRole | null> {
    const role = await this.knex<IRole>('core.roles')
      .where('key', key)
      .whereNull('deleted_at')
      .first();

    return role ?? null;
  }

  /**
   * Create user within transaction
   */
  async createUser(
    userData: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      image?: string;
    },
    trx: Knex.Transaction,
  ): Promise<ICustomer> {
    const id = uuidv4();
    const publicId = uuidv4();

    // Encrypt PII fields
    const encryptedName = this.encryptionService.encryptToString(userData.name);
    const encryptedEmail = this.encryptionService.encryptToString(
      userData.email,
    );
    const encryptedPhone = userData.phone
      ? this.encryptionService.encryptToString(userData.phone)
      : null;

    const now = new Date();

    const insertData = {
      id,
      public_id: publicId,
      name: encryptedName,
      email: encryptedEmail,
      password: userData.password, // Already hashed
      phone: encryptedPhone,
      image: userData.image ?? null,
      provider: null,
      provider_id: null,
      email_verified_at: now,
      created_at: now,
      updated_at: null,
      deleted_at: null,
      id_creator: null,
      id_updater: null,
      is_encrypted: true,
    };

    await trx('core.users').insert(insertData);

    // Return with original (unencrypted) values for response
    return {
      id,
      public_id: publicId,
      name: userData.name, // Return unencrypted for response
      email: userData.email, // Return unencrypted for response
      password: userData.password,
      phone: userData.phone ?? null,
      image: userData.image ?? null,
      provider: null,
      provider_id: null,
      email_verified_at: now,
      created_at: now,
      updated_at: null,
      deleted_at: null,
      id_creator: null,
      id_updater: null,
      is_encrypted: true,
    };
  }

  /**
   * Assign role to user within transaction
   */
  async assignRole(
    userId: string,
    roleId: string,
    trx: Knex.Transaction,
  ): Promise<void> {
    await trx('core.user_roles').insert({
      user_id: userId,
      role_id: roleId,
      created_at: new Date(),
    });
  }

  /**
   * Get user with roles by ID
   */
  async findByIdWithRoles(userId: string): Promise<ICustomerWithRoles | null> {
    const user = await this.knex<IUserRow>('core.users')
      .where('id', userId)
      .whereNull('deleted_at')
      .first();

    if (!user) {
      return null;
    }

    // Get roles
    const roles = await this.knex<IRole>('core.roles')
      .leftJoin('core.user_roles', 'core.roles.id', 'core.user_roles.role_id')
      .where('core.user_roles.user_id', userId)
      .whereNull('core.roles.deleted_at')
      .select(
        'core.roles.id',
        'core.roles.key',
        'core.roles.name',
        'core.roles.description',
      );

    // Decrypt user data
    const decryptedUser = this.decryptUser(user);

    return {
      ...decryptedUser,
      roles,
    };
  }

  /**
   * Decrypt user PII fields
   */
  private decryptUser(
    user: IUserRow,
  ): Omit<ICustomer, 'password' | 'is_encrypted'> {
    let name = user.name;
    let email = user.email;
    let phone = user.phone;

    if (user.is_encrypted) {
      try {
        name = this.encryptionService.decryptFromString(user.name);
        email = this.encryptionService.decryptFromString(user.email);
        if (phone) {
          phone = this.encryptionService.decryptFromString(phone);
        }
      } catch {
        // Return encrypted values if decryption fails
      }
    }

    return {
      id: user.id,
      public_id: user.public_id,
      name,
      email,
      phone,
      image: user.image,
      provider: user.provider,
      provider_id: user.provider_id,
      email_verified_at: user.email_verified_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
      deleted_at: user.deleted_at,
      id_creator: user.id_creator,
      id_updater: user.id_updater,
    };
  }

  /**
   * Map database row to customer interface
   */
  private mapRowToCustomer(row: IUserRow): ICustomer {
    return {
      id: row.id,
      public_id: row.public_id,
      name: row.name,
      email: row.email,
      password: row.password,
      phone: row.phone,
      image: row.image,
      provider: row.provider,
      provider_id: row.provider_id,
      email_verified_at: row.email_verified_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
      id_creator: row.id_creator,
      id_updater: row.id_updater,
      is_encrypted: row.is_encrypted,
    };
  }

  /**
   * Start a new database transaction
   */
  async beginTransaction(): Promise<Knex.Transaction> {
    return this.knex.transaction();
  }
}
