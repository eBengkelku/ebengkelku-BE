/**
 * Metrics Constants
 *
 * Defines metric names, labels, and configuration for Prometheus metrics.
 *
 * @module MetricsConstants
 * @version 1.0.0
 * @since 2026-02-22
 */

/**
 * Prometheus metric names used throughout the application.
 */
export const METRICS = {
  /** Counter: Total number of HTTP requests */
  HTTP_REQUESTS_TOTAL: 'http_requests_total',

  /** Histogram: HTTP request duration in seconds */
  HTTP_REQUEST_DURATION_SECONDS: 'http_request_duration_seconds',
} as const;

/**
 * Standard label names for HTTP metrics.
 */
export const METRIC_LABELS = {
  METHOD: 'method',
  ROUTE: 'route',
  STATUS: 'status',
} as const;

/**
 * Default histogram buckets for request duration (in seconds).
 * Covers range from 5ms to 10s for typical API response times.
 */
export const DURATION_BUCKETS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
];
