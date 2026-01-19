import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CommonModule } from '../../common/common.module';
import { AuthModule } from '../../auth/auth.module';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { CategoryRepository } from './repository/category.repository';

/**
 * Categories Module
 *
 * NestJS module for category management using Rich Domain Model pattern.
 * Registers all category-related providers, controllers, and dependencies.
 *
 * @module CategoriesModule
 * @version 1.0.0
 * @since 2025-01-13
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [CategoriesModule],
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
    CategoryRepository, // Domain repository for data access
    CategoryService, // Application service for orchestration
  ],
  controllers: [
    CategoryController, // HTTP endpoints for category operations
  ],
  exports: [
    CategoryService, // Export for use in other modules (e.g., ProductsModule)
    CategoryRepository, // Export repository for direct access if needed
  ],
})
export class CategoriesModule {}
