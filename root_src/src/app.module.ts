import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
} from 'nestjs-i18n';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { DatabaseModule } from './database/database.module';
// Auto-CRUD system
import { generateAllCrudModules } from './common/modules/auto-crud.module';

// Custom modules for file handling
import { FilesModule } from './domains/files/files.module';
import { ProductsModule } from './domains/products/products.module';

// Middleware
import { LoggerModule } from 'nestjs-pino';
import { AuthMiddleware } from './common/middlewares/auth.middleware';
import { LoggerMiddleware } from './common/middlewares/logger.middleware';
import configuration, { AppConfig, LoggerConfig, LoggerFormat } from './config';
import { RedisModule } from './libs/redis/redis.module';
import { RequestTimingMiddleware } from './common/middlewares/request-timing.middleware';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'local'}`, '.env'],
    }),

    I18nModule.forRoot({
      // I18n config
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '../i18n/'),
        watch: true,
      },
      resolvers: [
        { use: HeaderResolver, options: ['x-lang'] },
        new AcceptLanguageResolver(),
      ],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig>) => {
        const loggerConfig = config.get<LoggerConfig>('logger');

        return {
          pinoHttp: {
            level: loggerConfig?.level,
            formatters: loggerConfig?.formatters,
            transport:
              loggerConfig?.format === LoggerFormat.Pretty
                ? {
                    target: 'pino-pretty',
                    options: loggerConfig.prettyOptions,
                  }
                : undefined,
            useLevelLabels: true,
            autoLogging: false,
          },
        };
      },
    }),
    DatabaseModule,
    RedisModule,
    CommonModule,
    AuthModule,
    FilesModule,
    ProductsModule,
    // Auto-CRUD system extends manual modules
    ...generateAllCrudModules(),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Logger,

    // we set all routes to be private by default
    // use `@Public()` to make them public
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
    // Apply RequestTimingMiddleware first to track request time
    consumer.apply(RequestTimingMiddleware).forRoutes('*');
    // Then apply AuthMiddleware
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
