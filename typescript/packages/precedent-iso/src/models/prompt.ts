import { z } from "zod";

export const ZPromptSlug = z.enum([
  "kpi",
  "ebitda_adjustments",
  "business_model",
  "expense_drivers",
  "cim",
  "hfm",
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

export const SLUG_DISPLAY_NAME = {
  cim: "CIM Report",
  kpi: "Key Financials",
  ebitda_adjustments: "EBITDA Adjustments",
  business_model: "Business Model",
  expense_drivers: "Expense Drivers",
};

export const PROMPT_SLUGS = [
  "business_model",
  "kpi",
  "expense_drivers",
  "ebitda_adjustments",
  "cim",
] as const;

export const ZModel = z.enum(["claude-2"]);
export type Model = z.infer<typeof ZModel>;
