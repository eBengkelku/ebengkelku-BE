import { Module } from '@nestjs/common';
import { ProductTypeController } from './product-type.controller';
import { ProductTypeService } from './product-type.service';
import { ProductTypeRepository } from './repository/product-type.repository';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../../auth/auth.module';

/**
 * Product Types Domain Module
 *
 * Configures the product types domain with all its dependencies.
 *
 * @module ProductTypesModule
 * @version 1.0.0
 * @since 2026-02-12
 */
@Module({
  imports: [
    DatabaseModule, // For database access
    AuthModule, // For JWT authentication
  ],
  controllers: [ProductTypeController],
  providers: [ProductTypeService, ProductTypeRepository],
  exports: [ProductTypeService, ProductTypeRepository],
})
export class ProductTypesModule {}
