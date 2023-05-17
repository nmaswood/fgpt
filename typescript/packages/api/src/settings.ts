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
});
