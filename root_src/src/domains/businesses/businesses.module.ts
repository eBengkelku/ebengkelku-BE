import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { BusinessRepository } from './repository/business.repository';

@Module({
  imports: [DatabaseModule, AuthModule, FilesModule],
  providers: [BusinessRepository, BusinessService],
  controllers: [BusinessController],
  exports: [BusinessService],
})
export class BusinessesModule {}
