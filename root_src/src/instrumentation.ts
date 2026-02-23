/**
 * OpenTelemetry Instrumentation Bootstrap
 *
 * This file MUST be imported at the very top of main.ts, before any other
 * imports, to ensure the OTEL SDK patches all libraries before they load.
 *
 * Controlled by standard OTEL environment variables:
 * - OTEL_SDK_DISABLED: Set to 'true' to disable (default: false)
 * - OTEL_SERVICE_NAME: Service name for traces
 * - OTEL_EXPORTER_OTLP_ENDPOINT: OTLP collector endpoint
 * - OTEL_EXPORTER_OTLP_PROTOCOL: Protocol (http/protobuf, grpc)
 * - OTEL_TRACES_SAMPLER: Sampler type
 * - OTEL_TRACES_SAMPLER_ARG: Sampler argument (e.g., ratio)
 * - OTEL_RESOURCE_ATTRIBUTES: Additional resource attributes
 *
 * @module Instrumentation
 * @version 1.0.0
 * @since 2026-02-22
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const isDisabled =
  process.env.OTEL_SDK_DISABLED === 'true' ||
  process.env.OTEL_SDK_DISABLED === '1';

if (!isDisabled) {
  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter(),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable fs instrumentation to reduce noise
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();

  // Graceful shutdown
  const shutdown = async () => {
    try {
      await sdk.shutdown();
    } catch (err) {
      console.error('Error shutting down OpenTelemetry SDK:', err);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  console.log(
    `✅ OpenTelemetry SDK initialized (service: ${process.env.OTEL_SERVICE_NAME || 'unknown'})`,
  );
} else {
  console.log('ℹ️  OpenTelemetry SDK is disabled (OTEL_SDK_DISABLED=true)');
}
