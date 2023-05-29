import { z } from "zod";

const ZTestSettings = z.object({
  sqlUri: z.string(),
  tikaClient: z.string(),
});

export const TEST_SETTINGS = ZTestSettings.parse({
  sqlUri: process.env["SQL_URI"],
  tikaClient: process.env["TIKA_CLIENT"],
});
