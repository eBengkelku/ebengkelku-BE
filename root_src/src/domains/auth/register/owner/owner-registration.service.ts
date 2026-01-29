import { Injectable, ConflictException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { OwnerRegistrationRepository } from './repository/owner-registration.repository';
import { CreateOwnerDto } from './dto';
import { IOwnerWithRoles, IRegistrationResponse } from './interfaces';
import { OwnerRegistrationErrorCodes } from './errors';
import { DomainNotFoundException } from '../../../../common/domain';

/**
 * Owner Registration Service
 *
 * Application service for owner registration operations.
 * Orchestrates the registration flow including validation,
 * password hashing, encryption, and role assignment.
 *
 * @class OwnerRegistrationService
 * @version 1.0.0
 * @since 2026-01-29
 */
@Injectable()
export class OwnerRegistrationService {
  private readonly logger = new Logger(OwnerRegistrationService.name);
  private readonly SALT_ROUNDS = 10;
  private readonly OWNER_ROLE_KEY = 'owner';

  constructor(
    private readonly repository: OwnerRegistrationRepository,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Register a new owner
   *
   * Flow:
   * 1. Validate email uniqueness
   * 2. Hash password
   * 3. Create user in transaction
   * 4. Assign owner role
   * 5. Return user with roles
   */
  async register(
    dto: CreateOwnerDto,
    lang?: string,
  ): Promise<IRegistrationResponse> {
    this.logger.log('Owner registration request received');

    // 1. Validate email uniqueness
    await this.validateEmailUnique(dto.email, lang);

    // 2. Hash password
    const hashedPassword = await this.hashPassword(dto.password);

    // 3. Find owner role
    const ownerRole = await this.findOwnerRoleOrThrow(lang);

    // 4. Start transaction
    const trx = await this.repository.beginTransaction();

    try {
      // 5. Create user
      const user = await this.repository.createUser(
        {
          name: dto.name,
          email: dto.email.toLowerCase().trim(),
          password: hashedPassword,
          phone: dto.phone,
          image: dto.image,
        },
        trx,
      );

      this.logger.log('New owner account created successfully');

      // 6. Assign owner role
      await this.repository.assignRole(user.id, ownerRole.id, trx);

      this.logger.log('Owner role assigned to new account');

      // 7. Commit transaction
      await trx.commit();

      this.logger.log('Owner registration completed successfully');

      // 8. Build response with roles
      const responseData: IOwnerWithRoles = {
        id: user.id,
        public_id: user.public_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        provider: user.provider,
        provider_id: user.provider_id,
        email_verified_at: user.email_verified_at,
        created_at: user.created_at,
        updated_at: user.updated_at,
        deleted_at: user.deleted_at,
        id_creator: user.id_creator,
        id_updater: user.id_updater,
        roles: [ownerRole],
      };

      return {
        success: true,
        message: this.i18n.t('ownerRegistration.success', { lang }),
        data: responseData,
      };
    } catch (error) {
      // Rollback transaction on error
      await trx.rollback();
      this.logger.error(`Registration failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validate that email is not already registered
   */
  private async validateEmailUnique(
    email: string,
    lang?: string,
  ): Promise<void> {
    const existingUser = await this.repository.findByEmail(email);

    if (existingUser) {
      this.logger.warn('Registration attempt with existing email address');
      throw new ConflictException({
        code: OwnerRegistrationErrorCodes.EMAIL_ALREADY_EXISTS,
        message: this.i18n.t('ownerRegistration.errors.emailExists', {
          lang,
        }),
        detail: this.i18n.t('ownerRegistration.errors.emailExistsDetail', {
          lang,
          args: { email },
        }),
      });
    }
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.SALT_ROUNDS);
    } catch (error) {
      this.logger.error(`Password hashing failed: ${error.message}`);
      throw new Error(
        this.i18n.t('ownerRegistration.errors.passwordHashFailed'),
      );
    }
  }

  /**
   * Find owner role or throw error
   */
  private async findOwnerRoleOrThrow(lang?: string) {
    const role = await this.repository.findRoleByKey(this.OWNER_ROLE_KEY);

    if (!role) {
      this.logger.error('Owner role not found in database');
      throw new DomainNotFoundException(
        this.i18n.t('ownerRegistration.errors.roleNotFound', {
          lang,
        }),
        {},
        { code: OwnerRegistrationErrorCodes.ROLE_NOT_FOUND },
      );
    }

    return role;
  }
}
