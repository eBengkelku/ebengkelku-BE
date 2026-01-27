/**
 * Encryption Health Module
 *
 * Provides encryption keys health check functionality for NestJS applications.
 *
 * @module Common/Health
 * @version 1.0.0
 */

import { Module, Global } from '@nestjs/common';
import { EncryptionHealthService } from './services/encryption-health.service';

/**
 * NestJS wrapper module for EncryptionHealthService
 *
 * Note: The standalone `validateEncryptionKeysHealth()` function is
 * designed to run before NestJS bootstrap and doesn't require this module.
 * This module is provided for cases where you want to inject the service
 * into other NestJS providers.
 */
@Global()
@Module({
  providers: [
    {
      provide: EncryptionHealthService,
      useFactory: () => new EncryptionHealthService(),
    },
  ],
  exports: [EncryptionHealthService],
})
export class EncryptionHealthModule {}
