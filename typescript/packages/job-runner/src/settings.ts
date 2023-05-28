import { z } from "zod";

const ZSettings = z.object({
  sql: z.object({
    uri: z.string(),
  }),
  mlServiceUri: z.string(),
  assetBucket: z.string(),
  tikaClient: z.string(),
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
});
