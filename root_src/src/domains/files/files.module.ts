import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [FileService],
  exports: [FileService],
})
export class FilesModule {}
