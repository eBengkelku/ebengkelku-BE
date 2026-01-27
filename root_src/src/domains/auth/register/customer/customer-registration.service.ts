import { Injectable, ConflictException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { I18nService } from 'nestjs-i18n';
import { CustomerRegistrationRepository } from './repository/customer-registration.repository';
import { CreateCustomerDto } from './dto';
import { ICustomerWithRoles, IRegistrationResponse } from './interfaces';
import { CustomerRegistrationErrorCodes } from './errors';
import { DomainNotFoundException } from '../../../../common/domain';

/**
 * Customer Registration Service
 *
 * Application service for customer registration operations.
 * Orchestrates the registration flow including validation,
 * password hashing, encryption, and role assignment.
 *
 * @class CustomerRegistrationService
 * @version 1.0.0
 * @since 2026-01-27
 */
@Injectable()
export class CustomerRegistrationService {
  private readonly logger = new Logger(CustomerRegistrationService.name);
  private readonly SALT_ROUNDS = 10;
  private readonly CUSTOMER_ROLE_KEY = 'customer';

  constructor(
    private readonly repository: CustomerRegistrationRepository,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Register a new customer
   *
   * Flow:
   * 1. Validate email uniqueness
   * 2. Hash password
   * 3. Create user in transaction
   * 4. Assign customer role
   * 5. Return user with roles
   */
  async register(
    dto: CreateCustomerDto,
    lang?: string,
  ): Promise<IRegistrationResponse> {
    this.logger.log(`Starting customer registration for email: ${dto.email}`);

    // 1. Validate email uniqueness
    await this.validateEmailUnique(dto.email, lang);

    // 2. Hash password
    const hashedPassword = await this.hashPassword(dto.password);

    // 3. Find customer role
    const customerRole = await this.findCustomerRoleOrThrow(lang);

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

      this.logger.log(`User created with ID: ${user.id}`);

      // 6. Assign customer role
      await this.repository.assignRole(user.id, customerRole.id, trx);

      this.logger.log(`Customer role assigned to user: ${user.id}`);

      // 7. Commit transaction
      await trx.commit();

      this.logger.log(`Registration completed for user: ${user.id}`);

      // 8. Build response with roles
      const responseData: ICustomerWithRoles = {
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
        roles: [customerRole],
      };

      return {
        success: true,
        message: this.i18n.t('customerRegistration.success', { lang }),
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
      this.logger.warn(`Email already exists: ${email}`);
      throw new ConflictException({
        code: CustomerRegistrationErrorCodes.EMAIL_ALREADY_EXISTS,
        message: this.i18n.t('customerRegistration.errors.emailExists', {
          lang,
        }),
        detail: this.i18n.t('customerRegistration.errors.emailExistsDetail', {
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
        this.i18n.t('customerRegistration.errors.passwordHashFailed'),
      );
    }
  }

  /**
   * Find customer role or throw error
   */
  private async findCustomerRoleOrThrow(lang?: string) {
    const role = await this.repository.findRoleByKey(this.CUSTOMER_ROLE_KEY);

    if (!role) {
      this.logger.error('Customer role not found in database');
      throw new DomainNotFoundException(
        this.i18n.t('customerRegistration.errors.roleNotFound', {
          lang,
        }),
        {},
        { code: CustomerRegistrationErrorCodes.ROLE_NOT_FOUND },
      );
    }

    return role;
  }
}
