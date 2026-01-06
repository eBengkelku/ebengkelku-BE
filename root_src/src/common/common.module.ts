import { Module, Global } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';
import { Reflector } from '@nestjs/core';
import { ResponseTransformInterceptor } from './interceptors/response-transform.interceptor';
import { ValidationExceptionFilter } from './filters/validation-exception.filter';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

/**
 * Common Module
 *
 * Global module that provides shared utilities, filters, and interceptors
 * for the entire application.
 *
 * Exception filters are registered with proper ordering:
 * (Note: APP_FILTER uses reverse order - last registered = first executed)
 *
 * Execution order (most specific to most general):
 * 1. ValidationExceptionFilter - handles validation errors (I18nValidationException, BadRequestException)
 * 2. HttpExceptionFilter - handles HTTP exceptions
 * 3. GlobalExceptionFilter - catch-all for unhandled exceptions
 *
 * @module CommonModule
 * @version 1.4.0
 * @since 2025-10-03
 * @updated 2025-10-10 - Fixed filter ordering for proper exception handling
 */
@Global()
@Module({
  imports: [],
  providers: [
    // Register response transform interceptor
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector, i18n: I18nService) => {
        return new ResponseTransformInterceptor(reflector, i18n);
      },
      inject: [Reflector, I18nService],
    },
    // Register global exception filter (catch-all, registered first = executed last)
    {
      provide: APP_FILTER,
      useFactory: (i18n: I18nService) => {
        return new GlobalExceptionFilter(i18n);
      },
      inject: [I18nService],
    },
    // Register HTTP exception filter (registered second = executed second)
    {
      provide: APP_FILTER,
      useFactory: (i18n: I18nService) => {
        return new HttpExceptionFilter(i18n);
      },
      inject: [I18nService],
    },
    // Register validation exception filter (registered last = executed first/highest priority)
    {
      provide: APP_FILTER,
      useFactory: (i18n: I18nService) => {
        return new ValidationExceptionFilter(i18n);
      },
      inject: [I18nService],
    },
  ],
  exports: [],
})
export class CommonModule {}
