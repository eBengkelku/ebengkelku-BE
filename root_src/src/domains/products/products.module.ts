import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ProductRepository } from './repository/product.repository';
import { DatabaseModule } from '../../database/database.module';
import { FilesModule } from '../files/files.module';
import { AuthModule } from '../../auth/auth.module';

/**
 * Products Module
 *
 * NestJS module for product domain using the Rich Domain Model pattern.
 * Registers all product-related providers, controllers, and dependencies.
 *
 * @module ProductsModule
 * @version 1.0.0
 * @since 2025-10-03
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [ProductsModule],
 * })
 * export class AppModule {}
 * ```
 */
@Module({
  imports: [
    DatabaseModule, // Provides DatabaseService for Knex access
    FilesModule, // File handling functionality
    AuthModule, // Authentication and authorization
  ],
  providers: [
    ProductRepository, // Domain repository for data access
    ProductService, // Application service for orchestration
  ],
  controllers: [
    ProductController, // HTTP endpoints for product operations
  ],
  exports: [
    ProductService, // Export service for use in other modules
    ProductRepository, // Export repository for direct access if needed
  ],
})
export class ProductsModule {}
