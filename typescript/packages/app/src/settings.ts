import { z } from "zod";

export const ZServerSettings = z.object({
  publicApiEndpoint: z.string(),
  auth: z.object({
    secret: z.string(),
    baseUrl: z.string(),
    issuerBaseUrl: z.string(),
    clientId: z.string(),
    clientSecret: z.string(),
    scope: z.string(),
    audience: z.string(),
  }),
});

export const SERVER_SETTINGS = ZServerSettings.parse({
  publicApiEndpoint: process.env["PUBLIC_API_ENDPOINT"],
  // these values will likely never get used in application code
  // but I am including here as a sort sanity check to ensure that they are present
  auth: {
    secret: process.env["AUTH0_SECRET"],
    baseUrl: process.env["AUTH0_BASE_URL"],
    issuerBaseUrl: process.env["AUTH0_ISSUER_BASE_URL"],
    clientId: process.env["AUTH0_CLIENT_ID"],
    clientSecret: process.env["AUTH0_CLIENT_SECRET"],
    scope: process.env["AUTH0_SCOPE"],
    audience: process.env["AUTH0_AUDIENCE"],
  },
});
