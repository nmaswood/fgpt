import { z } from "zod";

const ZTestSettings = z.object({
  sqlUri: z.string(),
  tikaClient: z.string(),
  springtimeUri: z.string(),
  bucket: z.string(),
});

export const TEST_SETTINGS = ZTestSettings.parse({
  sqlUri: process.env["SQL_URI"],
  tikaClient: process.env["TIKA_CLIENT"],
  springtimeUri: process.env["SPRINGTIME_URI"],
  bucket: process.env["TEST_BUCKET"],
});
