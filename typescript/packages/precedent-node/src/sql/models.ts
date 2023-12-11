import { z } from "zod";

export const ZCountRow = z.object({
  count: z.number(),
});
