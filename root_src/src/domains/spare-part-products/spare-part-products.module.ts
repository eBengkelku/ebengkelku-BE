import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { SparePartProductController } from './spare-part-product.controller';
import { SparePartProductService } from './spare-part-product.service';
import { SparePartProductRepository } from './repository/spare-part-product.repository';

/**
 * Spare Part Products Module
 *
 * Module for managing spare-part-product-specific operations.
 *
 * @module SparePartProductsModule
 * @version 1.0.0
 * @since 2026-02-12
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [SparePartProductController],
  providers: [SparePartProductService, SparePartProductRepository],
  exports: [SparePartProductService, SparePartProductRepository],
})
export class SparePartProductsModule {}
