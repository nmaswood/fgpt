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
  sheetNumbers: number[];
  bucket: string;
  objectPath: string;
}

export interface AnalyzeResponse {
  responses: Record<number, Record<string, unknown>>;
}

export interface TableExtractor {
  extract(args: ExtractArguments): Promise<ExtractionResponse>;
  analyze(args: AnalyzeArguments): Promise<AnalyzeResponse>;
}

export class HttpTableExtractor {
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
    sheetNumbers,
    bucket,
    objectPath,
  }: AnalyzeArguments): Promise<AnalyzeResponse> {
    const response = await this.#client.post<unknown>("/excel/analyze", {
      bucket,
      object_path: objectPath,
      sheet_numbers: sheetNumbers,
    });

    return { responses: ZAnalyzeResponse.parse(response.data) };
  }
}

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

const ZAnalyzeResponse = z
  .object({
    resp: z.record(z.record(z.unknown())),
  })
  .transform((row) => {
    const result: Record<number, Record<string, unknown>> = {};
    for (const [key, value] of Object.entries(row.resp)) {
      result[Number(key)] = value;
    }
    return result;
  });
