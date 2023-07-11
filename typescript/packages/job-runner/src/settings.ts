import { z } from "zod";

const ZSettings = z.object({
  sql: z.object({
    uri: z.string(),
  }),
  mlServiceUri: z.string(),
  assetBucket: z.string(),
  tikaClient: z.string(),
  debugMode: z.boolean(),
  host: z.string(),
  port: z.number(),
  pubsub: z.object({
    projectId: z.string(),
    topic: z.string(),
    emulatorHost: z.string().optional(),
  }),

  serviceToServiceSecret: z.string(),

  claudeReportGeneration: z.boolean(),
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
  debugMode: debugMode === "true",

  host: process.env["HOST"] ?? "0.0.0.0",
  port: Number(process.env["PORT"] ?? "8080"),
  pubsub: {
    projectId: process.env["PUBSUB_PROJECT_ID"],
    topic: process.env["PUBSUB_TOPIC"],
    emulatorHost: process.env["PUBSUB_EMULATOR_HOST"],
  },
  serviceToServiceSecret: process.env["SERVICE_TO_SERVICE_SECRET"],

  claudeReportGeneration:
    process.env["CLAUDE_REPORT_GENERATION"]?.toLowerCase() === "true",
});
