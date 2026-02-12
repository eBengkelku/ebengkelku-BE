import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { ToolProductController } from './tool-product.controller';
import { ToolProductService } from './tool-product.service';
import { ToolProductRepository } from './repository/tool-product.repository';

/**
 * Tool Products Module
 *
 * Module for managing tool-product-specific operations.
 *
 * @module ToolProductsModule
 * @version 1.0.0
 * @since 2026-02-12
 */
@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [ToolProductController],
  providers: [ToolProductService, ToolProductRepository],
  exports: [ToolProductService, ToolProductRepository],
})
export class ToolProductsModule {}
