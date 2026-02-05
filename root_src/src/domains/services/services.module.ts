import { Module } from '@nestjs/common';
import { ServiceController } from './service.controller';
import { ServiceService } from './service.service';
import { ServiceRepository } from './repository/service.repository';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../../auth/auth.module';

/**
 * Services Domain Module
 *
 * Configures the services domain with all its dependencies.
 * Exports the service and repository for use in other modules.
 *
 * @module ServicesModule
 * @version 1.0.0
 * @since 2026-02-03
 */
@Module({
  imports: [
    DatabaseModule, // For database access
    AuthModule, // For JWT authentication
  ],
  controllers: [ServiceController],
  providers: [ServiceService, ServiceRepository],
  exports: [ServiceService, ServiceRepository],
})
export class ServicesModule {}
