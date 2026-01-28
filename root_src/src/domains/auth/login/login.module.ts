import { Module } from '@nestjs/common';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';
import { LoginRepository } from './repository/login.repository';
import { DatabaseModule } from '../../../database/database.module';
import { UserEncryptionModule } from '../../../jobs/user-encryption/user-encryption.module';
import { JwtModule as CustomJwtModule } from '../../../libs/jwt/jwt.module';

/**
 * Login Module
 *
 * NestJS module for user login domain.
 * Provides the login endpoint and related services.
 *
 * @module LoginModule
 * @version 1.0.0
 * @since 2026-01-28
 */
@Module({
  imports: [
    DatabaseModule, // Provides DatabaseService for database access
    UserEncryptionModule, // Provides EncryptionService for PII decryption
    CustomJwtModule, // Provides JwtService for token generation
  ],
  controllers: [LoginController],
  providers: [LoginService, LoginRepository],
  exports: [LoginService],
})
export class LoginModule {}
