import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../metrics/metrics.service';

/**
 * Request Timing Middleware
 *
 * Tracks the time taken to process a request, stores it in the request object,
 * and feeds metrics to Prometheus via MetricsService.
 *
 * Records:
 * - `http_requests_total` counter (method, route, status)
 * - `http_request_duration_seconds` histogram (method, route, status)
 *
 * @class RequestTimingMiddleware
 * @implements {NestMiddleware}
 * @version 2.0.0
 * @since 2025-10-13
 * @updated 2026-02-22 - Refactored to feed Prometheus metrics
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
  constructor(private readonly metricsService: MetricsService) {}

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

      // Feed metrics to Prometheus
      const method = req.method;
      const route = req.route?.path || req.baseUrl || req.path || 'unknown';
      const status = String(res.statusCode);
      const durationSeconds = requestTime / 1000;

      this.metricsService.incrementRequestCounter(method, route, status);
      this.metricsService.observeRequestDuration(
        method,
        route,
        status,
        durationSeconds,
      );
    });

    next();
  }
}
