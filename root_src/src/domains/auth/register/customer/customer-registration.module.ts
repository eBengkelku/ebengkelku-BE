import { Module } from '@nestjs/common';
import { CustomerRegistrationController } from './customer-registration.controller';
import { CustomerRegistrationService } from './customer-registration.service';
import { CustomerRegistrationRepository } from './repository/customer-registration.repository';
import { DatabaseModule } from '../../../../database/database.module';
import { UserEncryptionModule } from '../../../../jobs/user-encryption/user-encryption.module';

/**
 * Customer Registration Module
 *
 * NestJS module for customer registration domain.
 * Provides the registration endpoint and related services.
 *
 * @module CustomerRegistrationModule
 * @version 1.0.0
 * @since 2026-01-27
 */
@Module({
  imports: [
    DatabaseModule, // Provides DatabaseService for database access
    UserEncryptionModule, // Provides EncryptionService for PII encryption
  ],
  controllers: [CustomerRegistrationController],
  providers: [CustomerRegistrationService, CustomerRegistrationRepository],
  exports: [CustomerRegistrationService],
})
export class CustomerRegistrationModule {}
