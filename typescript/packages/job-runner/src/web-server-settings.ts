import { z } from "zod";

const ZWebServerSettings = z.object({
  host: z.string(),
  port: z.number(),
});

export type WebServerSettings = z.infer<typeof ZWebServerSettings>;

export const WEB_SERVER_SETTINGS = ZWebServerSettings.parse({
  host: process.env["HOST"] ?? "0.0.0.0",
  port: Number(process.env["PORT"] ?? "8080"),
});
