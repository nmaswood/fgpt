import { MLServiceClient } from "../ml/ml-service";
import { ProcessedFileStore } from "../processed-file-store";
import { ShaHash } from "../sha-hash";
import { TextExtractor } from "../text-extractor";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TextExtractionHandler {
  export interface Arguments {
    organizationId: string;
    projectId: string;
    fileReferenceId: string;
  }

  export interface Response {
    processedFileId: string;
  }
}

export interface TextExtractionHandler {
  extract: (
    page: TextExtractionHandler.Arguments,
  ) => Promise<TextExtractionHandler.Response>;
}

export class TextExtractionHandlerImpl implements TextExtractionHandler {
  constructor(
    private readonly textExtractor: TextExtractor,
    private readonly processedFileStore: ProcessedFileStore,
    private readonly mlService: MLServiceClient,
  ) {}

  async extract({
    organizationId,
    projectId,
    fileReferenceId,
  }: TextExtractionHandler.Arguments): Promise<TextExtractionHandler.Response> {
    const { text, pages } = await this.textExtractor.extract(fileReferenceId);

    const { gpt4, claude100k } = await this.mlService.tokenLength(text);
    const processedFile = await this.processedFileStore.upsert({
      organizationId,
      projectId,
      fileReferenceId,
      text,
      hash: ShaHash.forData(text),
      gpt4TokenLength: gpt4,
      claude100kLength: claude100k,
      textWithPages: pages,
      numPages: pages.length,
    });

    return {
      processedFileId: processedFile.id,
    };
  }
}
