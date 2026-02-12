import { Module } from '@nestjs/common';
import { ProductCategoryController } from './product-category.controller';
import { ProductCategoryService } from './product-category.service';
import { ProductCategoryRepository } from './repository/product-category.repository';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../../auth/auth.module';

/**
 * Product Categories Domain Module
 *
 * Configures the product categories domain with all its dependencies.
 *
 * @module ProductCategoriesModule
 * @version 1.0.0
 * @since 2026-02-12
 */
@Module({
  imports: [
    DatabaseModule, // For database access
    AuthModule, // For JWT authentication
  ],
  controllers: [ProductCategoryController],
  providers: [ProductCategoryService, ProductCategoryRepository],
  exports: [ProductCategoryService, ProductCategoryRepository],
})
export class ProductCategoriesModule {}
