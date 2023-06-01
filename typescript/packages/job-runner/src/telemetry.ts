import { TraceExporter } from "@google-cloud/opentelemetry-cloud-trace-exporter";
import { start } from "@google-cloud/profiler";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

export function init() {
  const provider = new NodeTracerProvider();

  const exporter = new TraceExporter();
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  provider.register();
  start();
}
