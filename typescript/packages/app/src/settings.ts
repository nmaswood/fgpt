import { z } from "zod";

export const ZSettings = z.object({});

export const SETTINGS = ZSettings.parse({});
