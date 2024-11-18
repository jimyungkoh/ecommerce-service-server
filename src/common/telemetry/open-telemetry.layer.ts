import { NodeSdk } from '@effect/opentelemetry';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { Effect } from 'effect';

// OpenTelemetry SDK 설정을 위한 Layer 제공
export const OpenTelemetryLayer = {
  // 기본 설정으로 Effect에 Tracer 제공
  default: Effect.provide(
    NodeSdk.layer(() => ({
      resource: {
        serviceName: 'ecommerce-server',
      },
      spanProcessor: new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: 'http://localhost:4318/v1/traces',
          timeoutMillis: 15000,
          concurrencyLimit: 10,
        }),
        {
          maxQueueSize: 2048,
          maxExportBatchSize: 512,
          scheduledDelayMillis: 5000,
          exportTimeoutMillis: 30000,
        },
      ),
    })),
  ),
};
