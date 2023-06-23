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

export interface TableExtractor {
  extract(args: ExtractArguments): Promise<ExtractionResponse>;
}

export class HttpTableExtractor {
  #client: AxiosInstance;
  OUTPUT_PREFIX = "excel_artefacts";

  constructor(baseURL: string) {
    this.#client = axios.create({
      baseURL,
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
