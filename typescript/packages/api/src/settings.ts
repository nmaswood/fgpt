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
    uri:
      "socket://pgwriter:stanfanmanplanhorsebatterstapleduck@nasr-learn%3Aus-central1%3Afgpt-db/songbird" ??
      "socket://sb-writer:baldeagleduckfishtoadmushroommousefood@production-371018%3Aus-central1%3Asongbird-prod/songbird" ??
      "postgres://pgwriter:okD%25g65673f%23@/fgpt?host=/cloudsql/nasr-learn%3Aus-central1%3Afgpt-db" ??
      process.env["SQL_URI"] ??
      "test",
  },
  mlServiceUri: process.env["ML_SERVICE_URI"],
});
