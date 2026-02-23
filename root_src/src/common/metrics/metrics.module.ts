import { Module } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { METRICS, METRIC_LABELS, DURATION_BUCKETS } from './metrics.constants';

/**
 * Metrics Module
 *
 * Registers Prometheus metrics endpoint (/metrics) and custom HTTP metrics.
 * Uses a custom MetricsController with @Public() decorator to bypass
 * the global JwtAuthGuard on the /metrics endpoint.
 *
 * Exports MetricsService for use by middleware and other modules.
 *
 * @module MetricsModule
 * @version 1.1.0
 * @since 2026-02-22
 * @updated 2026-02-22 - Added custom controller for public /metrics access
 */
@Module({
  imports: [
    PrometheusModule.register({
      controller: MetricsController,
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
  providers: [
    // Custom counter: http_requests_total
    makeCounterProvider({
      name: METRICS.HTTP_REQUESTS_TOTAL,
      help: 'Total number of HTTP requests',
      labelNames: [
        METRIC_LABELS.METHOD,
        METRIC_LABELS.ROUTE,
        METRIC_LABELS.STATUS,
      ],
    }),

    // Custom histogram: http_request_duration_seconds
    makeHistogramProvider({
      name: METRICS.HTTP_REQUEST_DURATION_SECONDS,
      help: 'HTTP request duration in seconds',
      labelNames: [
        METRIC_LABELS.METHOD,
        METRIC_LABELS.ROUTE,
        METRIC_LABELS.STATUS,
      ],
      buckets: DURATION_BUCKETS,
    }),

    MetricsService,
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
