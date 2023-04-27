import { z } from "zod";

const ZJobType = z.enum(["get-earnings-call-href"]);

const ZSettings = z.object({
  sql: z.object({
    uri: z.string(),
  }),
  jobType: ZJobType,
  seekingAlpha: z.object({
    email: z.string(),
    password: z.string(),
  }),
});

export type Settings = z.infer<typeof ZSettings>;
export type JobType = z.infer<typeof ZJobType>;

export const SETTINGS = ZSettings.parse({
  sql: {
    uri: process.env["SQL_URI"] ?? "test",
  },
  jobType: process.env["JOB_TYPE"] ?? "get-earnings-call-href",
  seekingAlpha: {
    email: process.env["SEEKING_ALPHA_EMAIL"],
    password: process.env["SEEKING_ALPHA_PASSWORD"],
  },
});
