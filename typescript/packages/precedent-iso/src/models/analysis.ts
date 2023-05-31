import { z } from "zod";

export interface Analysis {
  id: string;
  organizationId: string;
  projectId: string;
  taskId: string | undefined;
  name: string;
  definition: AnalysisDefinition;
  output: AnalysisOutput | undefined;
}

export const ZAnalysisItem = z.object({
  name: z.string(),
  prompts: z.string().array(),
});

export const ZAnalysisDefinition = z.object({
  version: z.literal("1"),
  items: ZAnalysisItem.array(),
});

export const ZAnalysisOutputResponse = z.object({
  prompt: z.string(),
  answer: z.string(),
  chunkIds: z.string().array(),
  text: z.string(),
});

export const ZAnalysisOutputItem = z.object({
  name: z.string(),
  responses: ZAnalysisOutputResponse.array(),
});

export const ZAnalysisOutput = z.object({
  version: z.literal("1"),
  items: ZAnalysisOutputItem.array(),
});

export type AnalysisOutputResponse = z.infer<typeof ZAnalysisOutputResponse>;
export type AnalysisOutputItem = z.infer<typeof ZAnalysisOutputItem>;
export type AnalysisItem = z.infer<typeof ZAnalysisItem>;
export type AnalysisDefinition = z.infer<typeof ZAnalysisDefinition>;
export type AnalysisOutput = z.infer<typeof ZAnalysisOutput>;
