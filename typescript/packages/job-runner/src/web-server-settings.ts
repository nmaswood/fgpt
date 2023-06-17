import { z } from "zod";

const ZWebServerSettings = z.object({
  host: z.string(),
  port: z.number(),
  pubsub: z.object({
    projectId: z.string(),
    topic: z.string(),
    subscription: z.string(),
    emulatorHost: z.string().optional(),
  }),
});

export type WebServerSettings = z.infer<typeof ZWebServerSettings>;

export const WEB_SERVER_SETTINGS = ZWebServerSettings.parse({
  host: process.env["HOST"] ?? "0.0.0.0",
  port: Number(process.env["PORT"] ?? "8080"),
  pubsub: {
    projectId: process.env["PUBSUB_PROJECT_ID"],
    topic: process.env["PUBSUB_TOPIC"],
    subscription: process.env["PUBSUB_SUBSCRIPTION"],
    emulatorHost: process.env["PUBSUB_EMULATOR_HOST"],
  },
});
