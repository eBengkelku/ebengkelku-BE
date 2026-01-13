import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CommonModule } from '../../common/common.module';
import { AuthModule } from '../../auth/auth.module';
import { CategoryService } from './services/category.service';
import { TagService } from './services/tag.service';
import { CategoryController } from './controllers/category.controller';
import { TagController } from './controllers/tag.controller';

/**
 * Classifiers Module
 *
 * NestJS module for category and tag management using BaseKnexService for Auto CRUD.
 * Provides CRUD operations for categories and tags with automatic pagination,
 * search, and i18n support.
 *
 * @module ClassifiersModule
 * @version 1.0.0
 * @since 2025-01-13
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [ClassifiersModule],
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
    CategoryService, // Category management service
    TagService, // Tag management service
  ],
  controllers: [
    CategoryController, // HTTP endpoints for category operations
    TagController, // HTTP endpoints for tag operations
  ],
  exports: [
    CategoryService, // Export for use in other modules (e.g., ProductsModule)
    TagService, // Export for use in other modules (e.g., ProductsModule)
  ],
})
export class ClassifiersModule {}
