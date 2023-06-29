import { AnalyzeResponseChunk } from "@fgpt/precedent-iso";
import axios, { AxiosInstance } from "axios";
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
  analyze(args: AnalyzeArguments): Promise<AnalyzeResponse>;
}

export class HttpTabularDataService implements TabularDataService {
  #client: AxiosInstance;
  OUTPUT_PREFIX = "excel_artefacts";

  constructor(baseURL: string, serviceToServiceSecret: string) {
    this.#client = axios.create({
      baseURL,
      headers: {
        "X-Service-To-Service-Secret": serviceToServiceSecret,
      },
    });
  }

  async extract({
    title,
    bucket,
    objectPath,
    outputPrefix,
  }: ExtractArguments): Promise<ExtractionResponse> {
    const response = await this.#client.post<unknown>("/pdf/extract-tables", {
      bucket,
      object_path: objectPath,
      output_prefix: outputPrefix,
      title,
    });
    return ZExtractResponse.parse(response.data);
  }

  async analyze({
    bucket,
    objectPath,
  }: AnalyzeArguments): Promise<AnalyzeResponse> {
    const response = await this.#client.post<unknown>("/excel/analyze", {
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
  })
  .transform((row) => ({
    sheetNames: row.sheet_names,
    content: row.content,
  }));

const ZAnalyzeResponse = z.object({
  chunks: ZAnalyzeResponseChunk.array(),
});

const ZExtractResponse = z
  .object({
    number_of_sheets: z.number(),
    object_path: z.string().optional(),
  })
  .transform(
    (row): ExtractionResponse =>
      row.object_path
        ? {
            type: "table",
            path: row.object_path,
            numberOfSheets: row.number_of_sheets,
          }
        : { type: "empty" }
  );
