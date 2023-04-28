import { z } from "zod";

export const ZSettings = z.object({
  publicApiEndpoint: z.string(),
});

export const SETTINGS = ZSettings.parse({
  publicApiEndpoint: process.env["PUBLIC_API_ENDPOINT"],
});
