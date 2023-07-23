// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

// [START opentelemetry_trace_samples]
"use strict";

// [START opentelemetry_trace_import]
import { TraceExporter } from "@google-cloud/opentelemetry-cloud-trace-exporter";
import * as opentelemetry from "@opentelemetry/api";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";

export function tracerInit() {
  const provider = new NodeTracerProvider();
  provider.register();
  const exporter = new TraceExporter();

  // Configure the span processor to send spans to the exporter
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

  // [END setup_exporter]

  // [START opentelemetry_trace_custom_span]

  // Initialize the OpenTelemetry APIs to use the
  // NodeTracerProvider bindings
  opentelemetry.trace.setGlobalTracerProvider(provider);
}
