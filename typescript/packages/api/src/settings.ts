import { z } from "zod";

const ZSettings = z.object({
  host: z.string(),
  port: z.number(),
  sql: z.object({
    uri: z.string(),
  }),
  mlServiceUri: z.string(),
});

export const SETTINGS = ZSettings.parse({
  host: process.env["HOST"] ?? "0.0.0.0",
  port: Number(process.env["PORT"] ?? "8080"),
  sql: {
    uri: process.env["SQL_URI"] ?? "test",
  },
  mlServiceUri: process.env["ML_SERVICE_URI"],
});
