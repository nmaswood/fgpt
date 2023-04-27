import { z } from "zod";

const ZTestSettings = z.object({
  sqlUri: z.string(),
});

export const TEST_SETTINGS = ZTestSettings.parse({
  sqlUri: process.env["SQL_URI"],
});
