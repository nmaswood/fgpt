import { z } from "zod";

const ZSettings = z.object({
  sql: z.object({
    uri: z.string(),
  }),
  mlServiceUri: z.string(),
  assetBucket: z.string(),
  tikaClient: z.string(),
  tracingEnabled: z.boolean(),
  debugMode: z.boolean(),
});

export type Settings = z.infer<typeof ZSettings>;

const debugMode = process.env["DEBUG_MODE"]?.toLowerCase() ?? "false";
export const SETTINGS = ZSettings.parse({
  sql: {
    uri: process.env["SQL_URI"] ?? "test",
  },
  jobType: process.env["JOB_TYPE"] ?? "text-extraction",
  mlServiceUri: process.env["ML_SERVICE_URI"],
  assetBucket: process.env["ASSET_BUCKET"],
  tikaClient: process.env["TIKA_CLIENT"],
  tracingEnabled: process.env["TRACING_ENABLED"]?.toLowerCase() === "true",
  debugMode: debugMode === "true",
});
