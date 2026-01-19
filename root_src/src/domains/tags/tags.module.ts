import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CommonModule } from '../../common/common.module';
import { AuthModule } from '../../auth/auth.module';
import { TagService } from './tag.service';
import { TagController } from './tag.controller';
import { TagRepository } from './repository/tag.repository';

/**
 * Tags Module
 *
 * NestJS module for tag management using Rich Domain Model pattern.
 * Registers all tag-related providers, controllers, and dependencies.
 *
 * @module TagsModule
 * @version 1.0.0
 * @since 2025-01-13
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [TagsModule],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [
    DatabaseModule, // Provides DatabaseService for Knex access
    CommonModule, // Provides I18nService for internationalization
    AuthModule, // Provides AuthService and JwtAuthGuard for authentication
  ],
  providers: [
    TagRepository, // Domain repository for data access
    TagService, // Application service for orchestration
  ],
  controllers: [
    TagController, // HTTP endpoints for tag operations
  ],
  exports: [
    TagService, // Export for use in other modules (e.g., ProductsModule)
    TagRepository, // Export repository for direct access if needed
  ],
})
export class TagsModule {}
