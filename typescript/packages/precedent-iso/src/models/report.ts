import { z } from "zod";

export interface Report {
  id: string;
  organizationId: string;
  projectId: string;
  taskId: string | undefined;
  name: string;
  definition: ReportDefinition;
  output: ReportOutput | undefined;
}

export type AnalysisItem = z.infer<typeof ZAnalysisItem>;

export const ZAnalysisItem = z.object({
  id: z.string(),
  name: z.string(),
  prompts: z.string().array(),
});

export const ZReportDefinition = z.object({
  version: z.literal("1"),
  items: ZAnalysisItem.array(),
});

export const ZReportOutputItem = z.object({
  id: z.string(),
  name: z.string(),
  output: z.string(),
});

export const ZReportOutput = z.object({
  version: z.literal("1"),
  items: ZReportOutputItem.array(),
});

export type ReportDefinition = z.infer<typeof ZReportDefinition>;
export type ReportOutput = z.infer<typeof ZReportOutput>;
