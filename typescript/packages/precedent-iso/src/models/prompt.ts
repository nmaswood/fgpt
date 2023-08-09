import { z } from "zod";

export const ZPromptSlug = z.enum([
  "kpi",
  "ebitda_adjustments",
  "business_model",
  "expense_drivers",
]);
export type PromptSlug = z.infer<typeof ZPromptSlug>;

export interface PromptDefinition {
  template: string;
}

export interface Prompt {
  id: string;
  slug: PromptSlug;
  definition: PromptDefinition;
}
