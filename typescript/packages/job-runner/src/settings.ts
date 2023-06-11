import { z } from "zod";

const ZSettings = z.object({
  sql: z.object({
    uri: z.string(),
  }),
  mlServiceUri: z.string(),
  assetBucket: z.string(),
  tikaClient: z.string(),
  tracingEnabled: z.boolean(),
  setTaskToErrorOnFailure: z.boolean(),
});

export type Settings = z.infer<typeof ZSettings>;

export const SETTINGS = ZSettings.parse({
  sql: {
    uri: process.env["SQL_URI"] ?? "test",
  },
  jobType: process.env["JOB_TYPE"] ?? "text-extraction",
  mlServiceUri: process.env["ML_SERVICE_URI"],
  assetBucket: process.env["ASSET_BUCKET"],
  tikaClient: process.env["TIKA_CLIENT"],
  tracingEnabled: process.env["TRACING_ENABLED"]?.toLowerCase() === "true",
  setTaskToErrorOnFailure:
    process.env["SET_TASK_TO_ERROR_ON_FAILURE"]?.toLowerCase() !== "false",
});
