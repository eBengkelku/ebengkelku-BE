# Prometheus Metrics Guide

> **TL;DR** — Custom HTTP metrics (`http_requests_total`, `http_request_duration_seconds`) are auto-recorded by `RequestTimingMiddleware`. Default Node.js/process metrics are enabled. Add new metrics via `MetricsModule`.

## Overview

This guide explains how Prometheus metrics work in the eBengkelku backend, how to add new custom metrics, and how to query them.

## Current Metrics

### Custom Metrics

| Metric                          | Type      | Labels                      | Description                |
| ------------------------------- | --------- | --------------------------- | -------------------------- |
| `http_requests_total`           | Counter   | `method`, `route`, `status` | Total HTTP requests        |
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status` | Request duration (seconds) |

### Default Metrics (auto-collected by `prom-client`)

| Metric                          | Description        |
| ------------------------------- | ------------------ |
| `nodejs_eventloop_lag_seconds`  | Event loop lag     |
| `nodejs_heap_size_total_bytes`  | V8 total heap size |
| `nodejs_heap_size_used_bytes`   | V8 used heap size  |
| `process_cpu_seconds_total`     | CPU time spent     |
| `process_resident_memory_bytes` | Resident memory    |
| `process_start_time_seconds`    | Process start time |

## How It Works

```
HTTP Request → RequestTimingMiddleware
                 ├── Records start time
                 ├── On res.finish:
                 │   ├── metricsService.incrementRequestCounter()
                 │   └── metricsService.observeRequestDuration()
                 └── next()
```

The `MetricsModule` registers:

1. `PrometheusModule` — exposes `/metrics` endpoint
2. Counter provider — `http_requests_total`
3. Histogram provider — `http_request_duration_seconds`
4. `MetricsService` — injectable wrapper for metric operations

## Adding New Metrics

### Step 1: Define in `metrics.constants.ts`

```typescript
export const METRICS = {
  HTTP_REQUESTS_TOTAL: 'http_requests_total',
  HTTP_REQUEST_DURATION_SECONDS: 'http_request_duration_seconds',
  // Add your new metric:
  DB_QUERY_DURATION_SECONDS: 'db_query_duration_seconds',
} as const;
```

### Step 2: Register provider in `metrics.module.ts`

```typescript
// In providers array:
makeHistogramProvider({
  name: METRICS.DB_QUERY_DURATION_SECONDS,
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'table'],
  buckets: DURATION_BUCKETS,
}),
```

### Step 3: Add to `MetricsService`

```typescript
@InjectMetric(METRICS.DB_QUERY_DURATION_SECONDS)
private readonly dbQueryDuration: Histogram<string>;

observeDbQueryDuration(operation: string, table: string, seconds: number) {
  this.dbQueryDuration.observe({ operation, table }, seconds);
}
```

### Step 4: Use in your code

```typescript
@Injectable()
export class SomeRepository {
  constructor(private readonly metricsService: MetricsService) {}

  async findAll() {
    const start = Date.now();
    const result = await this.knex('users').select('*');
    this.metricsService.observeDbQueryDuration(
      'select',
      'users',
      (Date.now() - start) / 1000,
    );
    return result;
  }
}
```

## Useful PromQL Queries

### Request Rate (RPS)

```promql
sum(rate(http_requests_total{job="ebengkelku-be"}[1m]))
```

### Error Rate (%)

```promql
(sum(rate(http_requests_total{job="ebengkelku-be",status=~"5.."}[5m]))
/ sum(rate(http_requests_total{job="ebengkelku-be"}[5m]))) * 100
```

### P95 Latency (ms)

```promql
histogram_quantile(0.95,
  sum(rate(http_request_duration_seconds_bucket{job="ebengkelku-be"}[5m])) by (le)
) * 1000
```

### Average Latency (ms)

```promql
(sum(rate(http_request_duration_seconds_sum{job="ebengkelku-be"}[5m]))
/ sum(rate(http_request_duration_seconds_count{job="ebengkelku-be"}[5m]))) * 1000
```

### Top 5 Slowest Routes

```promql
topk(5,
  sum by (route) (rate(http_request_duration_seconds_sum{job="ebengkelku-be"}[5m]))
  / sum by (route) (rate(http_request_duration_seconds_count{job="ebengkelku-be"}[5m]))
) * 1000
```

## Metric Naming Conventions

Follow [Prometheus naming best practices](https://prometheus.io/docs/practices/naming/):

| Rule                     | Example                          |
| ------------------------ | -------------------------------- |
| Snake_case               | `http_requests_total` ✅         |
| Unit suffix              | `_seconds`, `_bytes`, `_total`   |
| Counter ends in `_total` | `http_requests_total` ✅         |
| Use base units           | seconds (not ms), bytes (not KB) |

## Histogram Buckets

Default buckets for request duration:

```
5ms, 10ms, 25ms, 50ms, 100ms, 250ms, 500ms, 1s, 2.5s, 5s, 10s
```

Adjust in `metrics.constants.ts` → `DURATION_BUCKETS` based on your SLA requirements.

## Related Docs

- [Observability Stack Setup](observability-stack-setup-documentation.md)
