import { Injectable, Logger } from '@nestjs/common';
import { Knex } from 'knex';
import { DatabaseService } from '../../../../database/database.service';
import { EncryptionService } from '../../../../jobs/user-encryption/services/encryption.service';
import { IUserRow } from '../interfaces';
import { UserModel } from '../models';

/**
 * Login Repository
 *
 * Handles data access operations for user login.
 * Manages PII encryption/decryption transparently.
 * Returns UserModel instances for domain logic.
 *
 * @class LoginRepository
 * @version 1.0.0
 * @since 2026-01-28
 */
@Injectable()
export class LoginRepository {
  private readonly logger = new Logger(LoginRepository.name);

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
   * Find user by email (case-insensitive) and return as UserModel
   * Checks only non-deleted users and returns user data including password
   *
   * @param email - Email to search for (will be normalized)
   * @returns UserModel if found, null otherwise
   */
  async findByEmail(email: string): Promise<UserModel | null> {
    const normalizedEmail = email.toLowerCase().trim();

    // Get all non-deleted users
    // We need to iterate because emails are encrypted in database
    const users = await this.knex<IUserRow>('core.users')
      .whereNull('deleted_at')
      .select('*');

    for (const user of users) {
      try {
        let decryptedEmail: string;

        if (user.is_encrypted && user.email) {
          decryptedEmail = this.encryptionService.decryptFromString(user.email);
        } else {
          decryptedEmail = user.email;
        }

        if (decryptedEmail.toLowerCase().trim() === normalizedEmail) {
          // Reconstitute user into domain model
          const userModel = UserModel.reconstitute(user);

          // If encrypted, update with decrypted values
          if (user.is_encrypted) {
            userModel.setDecryptedName(
              this.encryptionService.decryptFromString(user.name),
            );
            userModel.setDecryptedEmail(decryptedEmail);
            if (user.phone) {
              userModel.setDecryptedPhone(
                this.encryptionService.decryptFromString(user.phone),
              );
            }
          }

          return userModel;
        }
      } catch (error) {
        // Skip users with decryption errors - log for debugging
        this.logger.debug(
          `Failed to decrypt email for user ${user.id}: ${error.message}`,
        );
        continue;
      }
    }

    return null;
  }

  /**
   * Update last login timestamp for a user
   *
   * @param publicId - User's public ID
   * @returns Updated count (should be 1 on success)
   */
  async updateLastLogin(publicId: string): Promise<number> {
    return await this.knex<IUserRow>('core.users')
      .where('public_id', publicId)
      .update({
        last_login: this.knex.fn.now(),
      });
  }
}
