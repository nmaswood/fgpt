import { z } from "zod";

export interface ExcelFileToDisplay {
  signedUrl: string;
  numSheets: number;
}

export const ZDirectUpload = z.object({
  type: z.literal("direct-upload"),
});

export const ZDerived = z.object({
  type: z.literal("derived"),
  excelAssetId: z.string(),
});

export const ZExcelSource = z.discriminatedUnion("type", [
  ZDirectUpload,
  ZDerived,
]);

export type ExcelSource = z.infer<typeof ZExcelSource>;

export interface AnalyzeResponseChunk {
  content: string;
  sheetNames: string[];
}

export interface AnalyzeOutput {
  type: "v0_chunks";
  value: AnalyzeResponseChunk[];
}
