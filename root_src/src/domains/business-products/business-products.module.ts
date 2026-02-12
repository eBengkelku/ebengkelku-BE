import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { BusinessProductController } from './business-product.controller';
import { BusinessProductService } from './business-product.service';
import { BusinessProductRepository } from './repository/business-product.repository';

/**
 * Business Products Module
 *
 * Module for managing business-scoped product operations.
 *
 * @module BusinessProductsModule
 * @version 1.0.0
 * @since 2026-02-12
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [BusinessProductController],
  providers: [BusinessProductService, BusinessProductRepository],
  exports: [BusinessProductService, BusinessProductRepository],
})
export class BusinessProductsModule {}
