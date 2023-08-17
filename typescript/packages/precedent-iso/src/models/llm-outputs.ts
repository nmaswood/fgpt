import { PromptSlug } from "./prompt";

export type MiscValue =
  | {
      type: "terms";
      value: Term[];
      order: number | undefined;
    }
  | {
      type: "long_form";
      raw: string;
      html: string | undefined;
    }
  | {
      type: "output";
      slug: PromptSlug;
      raw: string;
      html: string | undefined;
    };

export interface Term {
  termValue: string;
  termName: string;
}

export interface Report {
  terms: Term[];
  outputs: SlugWithOutput[];
}

export interface SlugWithOutput {
  slug: PromptSlug;
  output: DisplayOutput;
}

export interface DisplayOutput {
  type: "html" | "raw";
  value: string[];
}
