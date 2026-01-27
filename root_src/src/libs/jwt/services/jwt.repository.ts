/**
 * JWT Repository
 *
 * Data access layer for JWT token generation.
 * Handles user, role, and permission lookups with PII decryption.
 *
 * @module Libs/JWT/Services
 * @version 1.0.0
 * @since 2026-01-27
 */

import { Injectable, Logger } from '@nestjs/common';
import { Knex } from 'knex';
import { DatabaseService } from '../../../database/database.service';
import { EncryptionService } from '../../../jobs/user-encryption/services/encryption.service';
import {
  IUserData,
  IRoleData,
  IUserRow,
  IUserRoleRow,
  IPermissionRow,
} from '../interfaces';
import { JWT_DB_TABLES } from '../constants/jwt.constants';

/**
 * Repository for JWT-related database operations
 */
@Injectable()
export class JwtRepository {
  private readonly logger = new Logger(JwtRepository.name);

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
   * Find user by public_id with decrypted PII
   *
   * @param publicId - User's public_id (UUID)
   * @returns User data with decrypted name and email, or null if not found
   */
  async findUserByPublicId(publicId: string): Promise<IUserData | null> {
    try {
      const user = await this.knex<IUserRow>(JWT_DB_TABLES.USERS)
        .where('public_id', publicId)
        .whereNull('deleted_at')
        .first();

      if (!user) {
        return null;
      }

      return this.decryptUserData(user);
    } catch (error) {
      this.logger.error(
        `Failed to find user by public_id: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Find user by internal ID with decrypted PII
   *
   * @param id - User's internal id (UUID)
   * @returns User data with decrypted name and email, or null if not found
   */
  async findUserById(id: string): Promise<IUserData | null> {
    try {
      const user = await this.knex<IUserRow>(JWT_DB_TABLES.USERS)
        .where('id', id)
        .whereNull('deleted_at')
        .first();

      if (!user) {
        return null;
      }

      return this.decryptUserData(user);
    } catch (error) {
      this.logger.error(
        `Failed to find user by id: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get user's role from user_roles table
   *
   * @param userId - Internal user ID (not public_id)
   * @returns Role data or null if not found
   */
  async findUserRole(userId: string): Promise<IRoleData | null> {
    try {
      const result = await this.knex<IUserRoleRow>(JWT_DB_TABLES.USER_ROLES)
        .leftJoin(
          JWT_DB_TABLES.ROLES,
          `${JWT_DB_TABLES.USER_ROLES}.role_id`,
          `${JWT_DB_TABLES.ROLES}.id`,
        )
        .where(`${JWT_DB_TABLES.USER_ROLES}.user_id`, userId)
        .whereNull(`${JWT_DB_TABLES.USER_ROLES}.deleted_at`)
        .whereNull(`${JWT_DB_TABLES.ROLES}.deleted_at`)
        .select(
          `${JWT_DB_TABLES.ROLES}.id as id`,
          `${JWT_DB_TABLES.ROLES}.key as key`,
          `${JWT_DB_TABLES.ROLES}.name as name`,
        )
        .first();

      if (!result) {
        return null;
      }

      return {
        id: result.id,
        key: result.key,
        name: result.name,
      };
    } catch (error) {
      this.logger.error(
        `Failed to find user role: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get permission keys for a role
   *
   * @param roleId - Role UUID
   * @returns Array of permission keys
   */
  async findRolePermissions(roleId: string): Promise<string[]> {
    try {
      const permissions = await this.knex<IPermissionRow>(
        JWT_DB_TABLES.ROLE_PERMISSIONS,
      )
        .leftJoin(
          JWT_DB_TABLES.PERMISSIONS,
          `${JWT_DB_TABLES.ROLE_PERMISSIONS}.permission_id`,
          `${JWT_DB_TABLES.PERMISSIONS}.id`,
        )
        .where(`${JWT_DB_TABLES.ROLE_PERMISSIONS}.role_id`, roleId)
        .whereNull(`${JWT_DB_TABLES.ROLE_PERMISSIONS}.deleted_at`)
        .whereNull(`${JWT_DB_TABLES.PERMISSIONS}.deleted_at`)
        .select(`${JWT_DB_TABLES.PERMISSIONS}.key as key`);

      return permissions.map((p) => p.key).filter(Boolean);
    } catch (error) {
      this.logger.error(
        `Failed to find role permissions: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Decrypt user PII fields
   *
   * @param user - Raw user row from database
   * @returns User data with decrypted fields
   */
  private decryptUserData(user: IUserRow): IUserData {
    let name = user.name;
    let email = user.email;

    if (user.is_encrypted) {
      try {
        if (user.name) {
          name = this.encryptionService.decryptFromString(user.name);
        }
        if (user.email) {
          email = this.encryptionService.decryptFromString(user.email);
        }
      } catch (error) {
        this.logger.warn(
          `Failed to decrypt user PII for user ${user.id}: ${error.message}`,
        );
        // Return encrypted values if decryption fails
      }
    }

    return {
      id: user.id,
      public_id: user.public_id,
      name,
      email,
      is_encrypted: user.is_encrypted,
    };
  }
}
