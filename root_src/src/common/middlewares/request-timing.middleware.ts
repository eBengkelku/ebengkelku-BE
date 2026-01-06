import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Request Timing Middleware
 *
 * Tracks the time taken to process a request and stores it in the request object.
 * This timing information is used by interceptors and filters to add requestTime
 * to the response.
 *
 * @class RequestTimingMiddleware
 * @implements {NestMiddleware}
 * @version 1.0.0
 * @since 2025-10-13
 *
 * @example Usage in app.module.ts
 * ```typescript
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(RequestTimingMiddleware)
 *       .forRoutes('*');
 *   }
 * }
 * ```
 */
@Injectable()
export class RequestTimingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Store request start time in milliseconds
    const startTime = Date.now();

    // Store start time in request object for access by interceptors/filters
    (req as any).startTime = startTime;

    // Add listener to calculate request time when response finishes
    res.on('finish', () => {
      const endTime = Date.now();
      const requestTime = endTime - startTime;

      // Store request time in request object for access by filters
      (req as any).requestTime = requestTime;
    });

    next();
  }
}
