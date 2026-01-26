/**
 * User Encryption Job Module
 *
 * NestJS module for the user data encryption cron job.
 * Provides encryption services for PII data compliance with Indonesia PDP regulations.
 *
 * @module UserEncryption
 * @version 1.0.0
 */

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { EncryptionService } from './services/encryption.service';
import { UserEncryptionJobService } from './services/user-encryption-job.service';

/**
 * Module for user data encryption cron job
 *
 * Features:
 * - Scheduled encryption of PII data
 * - Hybrid RSA+AES encryption
 * - Batch processing for performance
 * - Comprehensive logging
 *
 * Usage:
 * Import this module in app.module.ts to enable the encryption cron job.
 *
 * Configuration:
 * Set the following environment variables:
 * - ENCRYPTION_KEY_PASSPHRASE: Passphrase for the private key
 * - ENCRYPTION_BATCH_SIZE: (optional) Number of records per batch
 * - ENCRYPTION_DRY_RUN: (optional) Enable dry-run mode
 */
@Module({
  imports: [ScheduleModule.forRoot(), ConfigModule, DatabaseModule],
  providers: [EncryptionService, UserEncryptionJobService],
  exports: [EncryptionService, UserEncryptionJobService],
})
export class UserEncryptionModule {}
