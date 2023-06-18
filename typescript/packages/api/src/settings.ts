import { z } from "zod";

const ZSettings = z.object({
  host: z.string(),
  port: z.number(),
  sql: z.object({
    uri: z.string(),
  }),
  mlServiceUri: z.string(),
  auth: z.object({
    jwksUri: z.string(),
    audience: z.string(),
    issuer: z.string(),
  }),
  assetBucket: z.string(),
  tracingEnabled: z.boolean(),
  urlSigningServiceAccountPath: z.string().optional(),
  pubsub: z.object({
    projectId: z.string(),
    topic: z.string(),
    emulatorHost: z.string().optional(),
  }),
});

export const SETTINGS = ZSettings.parse({
  host: process.env["HOST"] ?? "0.0.0.0",
  port: Number(process.env["PORT"] ?? "8080"),
  sql: {
    uri: process.env["SQL_URI"],
  },
  mlServiceUri: process.env["ML_SERVICE_URI"],
  auth: {
    jwksUri: `${process.env["AUTH0_ISSUER"]}.well-known/jwks.json`,
    audience: process.env["AUTH0_AUDIENCE"],
    issuer: process.env["AUTH0_ISSUER"],
  },

  assetBucket: process.env["ASSET_BUCKET"],
  tracingEnabled: process.env["TRACING_ENABLED"]?.toLowerCase() === "true",
  urlSigningServiceAccountPath: process.env["URL_SIGNING_SERVICE_ACCOUNT_PATH"],

  pubsub: {
    projectId: process.env["PUBSUB_PROJECT_ID"],
    topic: process.env["PUBSUB_TOPIC"],
    emulatorHost: process.env["PUBSUB_EMULATOR_HOST"],
  },
});
