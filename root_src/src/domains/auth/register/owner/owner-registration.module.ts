import { Module } from '@nestjs/common';
import { OwnerRegistrationController } from './owner-registration.controller';
import { OwnerRegistrationService } from './owner-registration.service';
import { OwnerRegistrationRepository } from './repository/owner-registration.repository';
import { DatabaseModule } from '../../../../database/database.module';
import { UserEncryptionModule } from '../../../../jobs/user-encryption/user-encryption.module';

/**
 * Owner Registration Module
 *
 * NestJS module for owner registration domain.
 * Provides the registration endpoint and related services.
 *
 * @module OwnerRegistrationModule
 * @version 1.0.0
 * @since 2026-01-29
 */
@Module({
  imports: [
    DatabaseModule, // Provides DatabaseService for database access
    UserEncryptionModule, // Provides EncryptionService for PII encryption
  ],
  controllers: [OwnerRegistrationController],
  providers: [OwnerRegistrationService, OwnerRegistrationRepository],
  exports: [OwnerRegistrationService],
})
export class OwnerRegistrationModule {}
