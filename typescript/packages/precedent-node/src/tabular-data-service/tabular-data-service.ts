import {
  AnalyzeResponseChunk,
  AnalyzeTableModel,
  assertNever,
} from "@fgpt/precedent-iso";
import { AxiosInstance } from "axios";
import z from "zod";

export interface ExtractArguments {
  title: string;
  bucket: string;
  objectPath: string;
  outputPrefix: string;
}

export type ExtractionResponse =
  | { type: "empty" }
  | { type: "table"; path: string; numberOfSheets: number };

export interface AnalyzeArguments {
  bucket: string;
  objectPath: string;
}

export interface AnalyzeResponse {
  responses: AnalyzeResponseChunk[];
}

export interface TabularDataService {
  extract(args: ExtractArguments): Promise<ExtractionResponse>;
  analyzeForModel(
    model: AnalyzeTableModel,
    args: AnalyzeArguments,
  ): Promise<AnalyzeResponse>;
  analyzeGPT(args: AnalyzeArguments): Promise<AnalyzeResponse>;
  analyzeClaude(args: AnalyzeArguments): Promise<AnalyzeResponse>;
}

export class HttpTabularDataService implements TabularDataService {
  OUTPUT_PREFIX = "excel_artefacts";
  constructor(private readonly client: AxiosInstance) {}

  async extract({
    title,
    bucket,
    objectPath,
    outputPrefix,
  }: ExtractArguments): Promise<ExtractionResponse> {
    const response = await this.client.post<unknown>("/pdf/extract-tables", {
      bucket,
      object_path: objectPath,
      output_prefix: outputPrefix,
      title,
    });
    return ZExtractResponse.parse(response.data);
  }

  async analyzeForModel(
    model: AnalyzeTableModel,
    { bucket, objectPath }: AnalyzeArguments,
  ): Promise<AnalyzeResponse> {
    switch (model) {
      case "gpt": {
        return this.analyzeGPT({ bucket, objectPath });
      }
      case "claude": {
        return this.analyzeClaude({ bucket, objectPath });
      }
      default:
        assertNever(model);
    }
  }

  async analyzeGPT({
    bucket,
    objectPath,
  }: AnalyzeArguments): Promise<AnalyzeResponse> {
    const response = await this.client.post<unknown>("/excel/analyze-gpt", {
      bucket,
      object_path: objectPath,
    });

    return { responses: ZAnalyzeResponse.parse(response.data).chunks };
  }

  async analyzeClaude({
    bucket,
    objectPath,
  }: AnalyzeArguments): Promise<AnalyzeResponse> {
    const response = await this.client.post<unknown>("/excel/analyze-claude", {
      bucket,
      object_path: objectPath,
    });

    return { responses: ZAnalyzeResponse.parse(response.data).chunks };
  }
}

const ZAnalyzeResponseChunk = z
  .object({
    sheet_names: z.string().array(),
    content: z.string(),
    prompt: z.string(),
    sanitized_html: z.string().nullable(),
  })
  .transform((row) => ({
    sheetNames: row.sheet_names,
    content: row.content,
    prompt: row.prompt,
    sanitizedHtml: row.sanitized_html ?? undefined,
  }));

const ZAnalyzeResponse = z.object({
  chunks: ZAnalyzeResponseChunk.array(),
});

const ZExtractResponse = z
  .object({
    number_of_sheets: z.number(),
    object_path: z.string().nullable(),
  })
  .transform(
    (row): ExtractionResponse =>
      row.object_path
        ? {
            type: "table",
            path: row.object_path,
            numberOfSheets: row.number_of_sheets,
          }
        : { type: "empty" },
  );
