import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService<AppConfig>) {}
  getHello(): string {
    return 'Hello World !';
  }

  getHealth() {
    const environment = this.configService.get('nodeEnv') || 'local';

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: environment,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total:
          Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      },
    };
  }
}
