import { z } from "zod";

const ZCommonSettings = z.object({
  sql: z.object({
    uri: z.string(),
  }),
  mlServiceUri: z.string(),
  assetBucket: z.string(),
  tikaClient: z.string(),
  debugMode: z.boolean(),
});

export type CommonSettings = z.infer<typeof ZCommonSettings>;

const debugMode = process.env["DEBUG_MODE"]?.toLowerCase() ?? "false";
export const COMMON_SETTINGS = ZCommonSettings.parse({
  sql: {
    uri: process.env["SQL_URI"] ?? "test",
  },
  jobType: process.env["JOB_TYPE"] ?? "text-extraction",
  mlServiceUri: process.env["ML_SERVICE_URI"],
  assetBucket: process.env["ASSET_BUCKET"],
  tikaClient: process.env["TIKA_CLIENT"],
  debugMode: debugMode === "true",
});
