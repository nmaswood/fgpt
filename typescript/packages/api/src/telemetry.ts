import { TraceExporter } from "@google-cloud/opentelemetry-cloud-trace-exporter";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

export function init() {
  const provider = new NodeTracerProvider();

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [HttpInstrumentation, ExpressInstrumentation] as any,
  });

  const exporter = new TraceExporter();
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();
}
