import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Knex, knex } from 'knex';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private knexInstance: Knex;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const databaseConfig = this.configService.get('database');
    this.knexInstance = knex(databaseConfig);

    // Test the connection
    try {
      await this.knexInstance.raw('SELECT 1');
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection failed:', error);
    }
  }

  async onModuleDestroy() {
    if (this.knexInstance) {
      await this.knexInstance.destroy();
    }
  }

  getKnex(): Knex {
    return this.knexInstance;
  }
}
