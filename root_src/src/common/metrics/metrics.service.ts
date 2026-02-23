import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { METRICS } from './metrics.constants';

/**
 * Metrics Service
 *
 * Injectable service that wraps Prometheus metrics operations.
 * Used by middleware to record HTTP request metrics.
 *
 * @class MetricsService
 * @version 1.0.0
 * @since 2026-02-22
 */
@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric(METRICS.HTTP_REQUESTS_TOTAL)
    private readonly httpRequestsTotal: Counter<string>,

    @InjectMetric(METRICS.HTTP_REQUEST_DURATION_SECONDS)
    private readonly httpRequestDuration: Histogram<string>,
  ) {}

  /**
   * Increment the HTTP request counter.
   *
   * @param method - HTTP method (GET, POST, etc.)
   * @param route - Route path (e.g., /v1/products)
   * @param status - HTTP status code as string (e.g., "200")
   */
  incrementRequestCounter(method: string, route: string, status: string): void {
    this.httpRequestsTotal.inc({ method, route, status });
  }

  /**
   * Observe (record) the HTTP request duration.
   *
   * @param method - HTTP method (GET, POST, etc.)
   * @param route - Route path (e.g., /v1/products)
   * @param status - HTTP status code as string (e.g., "200")
   * @param durationSeconds - Request duration in seconds
   */
  observeRequestDuration(
    method: string,
    route: string,
    status: string,
    durationSeconds: number,
  ): void {
    this.httpRequestDuration.observe(
      { method, route, status },
      durationSeconds,
    );
  }
}
