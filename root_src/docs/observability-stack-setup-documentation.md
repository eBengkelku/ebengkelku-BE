# Observability Stack Setup

> **TL;DR** — Alloy, Grafana, Loki, Prometheus, and Tempo run as Docker containers alongside the NestJS app. Metrics via `/metrics`, traces via OTLP to Alloy→Tempo, logs via Docker stdout→Alloy→Loki.

## Overview

This document covers the observability and monitoring stack for the eBengkelku backend. The stack provides three pillars of observability:

| Pillar  | Tool       | Collection Method                         |
| ------- | ---------- | ----------------------------------------- |
| Metrics | Prometheus | Scrapes `/metrics` endpoint on NestJS app |
| Traces  | Tempo      | OTLP HTTP via Alloy collector             |
| Logs    | Loki       | Docker container stdout via Alloy         |

Grafana serves as the unified dashboard for all three data sources.

## Architecture

```
NestJS App (nest-app-api:3004)
├── /metrics endpoint ──scrape──→ Prometheus ──→ Grafana
├── OTEL SDK ──OTLP HTTP──→ Alloy ──→ Tempo ──→ Grafana
└── stdout (JSON logs) ──Docker──→ Alloy ──→ Loki ──→ Grafana
```

## Quick Start

### 1. Start the Stack

```bash
docker compose up -d
```

### 2. Verify Services

| Service    | URL                           | Purpose                  |
| ---------- | ----------------------------- | ------------------------ |
| NestJS API | http://localhost:3004         | Application              |
| Metrics    | http://localhost:3004/metrics | Prometheus metrics       |
| Grafana    | http://localhost:3000         | Dashboards (admin/admin) |
| Prometheus | http://localhost:9090         | Metric queries           |
| Loki       | http://localhost:3100         | Log queries              |
| Tempo      | http://localhost:3200         | Trace queries            |
| Alloy      | http://localhost:12345        | Collector UI             |

### 3. View Dashboard

Open Grafana → **eBengkelku Backend Dashboard** (auto-provisioned).

## Docker Network Layout

```
┌─────────────────────────────────────────────┐
│  monitoring network                         │
│  ┌──────────┐  ┌────────┐  ┌─────┐         │
│  │Prometheus│  │Grafana │  │Loki │         │
│  └──────────┘  └────────┘  └─────┘         │
│  ┌──────┐  ┌─────┐                         │
│  │Alloy │  │Tempo│                         │
│  └──────┘  └─────┘                         │
│  ┌──────────────┐                          │
│  │nest-app-api  │ ← also on db network     │
│  └──────────────┘                          │
└─────────────────────────────────────────────┘
```

## Configuration Files

| File                                       | Purpose                               |
| ------------------------------------------ | ------------------------------------- |
| `config/alloy/config.alloy`                | OTLP receiver + Docker log collection |
| `config/grafana/datasources.yml`           | Provisioned datasources               |
| `config/grafana/dashboards/dashboard.json` | Pre-built dashboard                   |
| `config/grafana/dashboards/dashboards.yml` | Dashboard provisioner                 |
| `config/loki/loki-config.yml`              | Loki storage & retention              |
| `config/prometheus/prometheus.yml`         | Scrape targets                        |
| `config/tempo/tempo.yml`                   | Trace storage & processing            |

## Environment Variables (OTEL)

| Variable                      | Default                        | Description               |
| ----------------------------- | ------------------------------ | ------------------------- |
| `OTEL_SDK_DISABLED`           | `false`                        | Disable OTEL SDK entirely |
| `OTEL_SERVICE_NAME`           | `ebengkelku-be`                | Service name in traces    |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://alloy:4318`            | Alloy OTLP HTTP endpoint  |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | `http/protobuf`                | OTLP protocol             |
| `OTEL_TRACES_SAMPLER`         | `parentbased_traceidratio`     | Sampling strategy         |
| `OTEL_TRACES_SAMPLER_ARG`     | `1.0`                          | Sample ratio (1.0 = 100%) |
| `OTEL_RESOURCE_ATTRIBUTES`    | `deployment.environment=local` | Extra resource attributes |

## NestJS Integration

### Metrics (`@willsoto/nestjs-prometheus`)

- `MetricsModule` registered in `AppModule`
- Exposes `/metrics` endpoint automatically
- Custom metrics: `http_requests_total` (Counter), `http_request_duration_seconds` (Histogram)
- `RequestTimingMiddleware` feeds data to both metrics on every request

### Tracing (OpenTelemetry)

- `src/instrumentation.ts` bootstraps the OTEL NodeSDK **before** NestJS loads
- Auto-instruments: HTTP, Express, PostgreSQL (pg)
- Disable by setting `OTEL_SDK_DISABLED=true`

## Production Considerations

> [!WARNING]
> Current configuration is for **development only**.

| Concern        | Dev Value              | Production Recommendation |
| -------------- | ---------------------- | ------------------------- |
| Sampling rate  | 100% (`1.0`)           | 10-25% (`0.1` to `0.25`)  |
| Grafana auth   | Anonymous admin        | Proper auth + RBAC        |
| Data retention | 30h (Loki), 1h (Tempo) | Based on storage budget   |
| Resources      | No limits              | Set CPU/memory limits     |

## Troubleshooting

**No metrics in Grafana?**

- Check `http://localhost:3004/metrics` returns data
- Check Prometheus targets: `http://localhost:9090/targets`

**No logs in Grafana?**

- Verify Alloy can access Docker socket
- Check Loki health: `http://localhost:3100/ready`

**No traces?**

- Ensure `OTEL_SDK_DISABLED` is not `true`
- Check Alloy is receiving OTLP: `http://localhost:12345`

## Related Docs

- [Prometheus Metrics Guide](observability-prometheus-metrics-guide.md)
