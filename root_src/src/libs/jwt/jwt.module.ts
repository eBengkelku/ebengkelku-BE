/**
 * JWT Module
 *
 * Module for JWT token generation functionality.
 *
 * @module Libs/JWT
 * @version 1.0.0
 * @since 2026-01-27
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { JwtController } from './jwt.controller';
import { JwtService } from './services/jwt.service';
import { JwtRepository } from './services/jwt.repository';
import { DatabaseModule } from '../../database/database.module';
import { UserEncryptionModule } from '../../jobs/user-encryption/user-encryption.module';

/**
 * JWT Module
 *
 * Provides JWT token generation functionality.
 * Exports JwtService for use by other modules.
 */
@Module({
  imports: [ConfigModule, DatabaseModule, UserEncryptionModule],
  controllers: [JwtController],
  providers: [JwtService, JwtRepository],
  exports: [JwtService],
})
export class JwtModule {}
