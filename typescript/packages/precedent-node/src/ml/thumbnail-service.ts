import { AxiosInstance } from "axios";
import { z } from "zod";

export interface ForPdfArgs {
  bucket: string;
  objectPath: string;
  outputPrefix: string;
}

export interface ForPdfResponse {
  objectPath: string;
}

export interface ThumbnailService {
  forPdf(args: ForPdfArgs): Promise<ForPdfResponse>;
}

export class ThumbnailServiceImpl implements ThumbnailService {
  constructor(private readonly client: AxiosInstance) {}

  async forPdf({
    bucket,
    objectPath,
    outputPrefix,
  }: ForPdfArgs): Promise<ForPdfResponse> {
    const response = await this.client.post<unknown>("/pdf/get-thumbnail", {
      bucket,
      object_path: objectPath,
      output_prefix: outputPrefix,
    });
    return ZExtractResponse.parse(response.data);
  }
}
const ZExtractResponse = z
  .object({
    object_path: z.string(),
  })
  .transform(
    (row): ForPdfResponse => ({
      objectPath: row.object_path,
    }),
  );
