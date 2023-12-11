import { z } from "zod";

export const ZSelectId = z.object({
  id: z.string(),
});

export type SelectId = z.infer<typeof ZSelectId>;
