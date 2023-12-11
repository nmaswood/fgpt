import { z } from "zod";

export const ZClientSettings = z.object({
  publicApiEndpoint: z.string(),
});

export const CLIENT_SETTINGS = ZClientSettings.parse({
  publicApiEndpoint: process.env["NEXT_PUBLIC_API_ENDPOINT"],
});
