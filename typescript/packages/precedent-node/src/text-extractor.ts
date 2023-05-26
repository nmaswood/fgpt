import { isNotNull } from "@fgpt/precedent-iso";
import { v1 as vision } from "@google-cloud/vision";

import { FileReferenceStore } from "./file-reference-store";

export interface TextExtractor {
  extract(fileId: string): Promise<ExtractResponse>;
}

export interface ExtractResponse {
  text: string;
}

export class CloudVisionTextExtractor implements TextExtractor {
  #client: vision.ImageAnnotatorClient;
  constructor(
    private readonly fileReferenceStore: FileReferenceStore,
    private readonly bucketName: string
  ) {
    this.#client = new vision.ImageAnnotatorClient();
  }

  async extract(fileId: string): Promise<ExtractResponse> {
    const file = await this.fileReferenceStore.get(fileId);

    const operations = await this.#client.batchAnnotateFiles({
      requests: [
        {
          inputConfig: {
            mimeType: file.contentType,
            gcsSource: {
              uri: `gs://${this.bucketName}/${file.path}`,
            },
          },
          features: [
            {
              type: "DOCUMENT_TEXT_DETECTION",
              maxResults: 100_000,
            },
          ],
        },
      ],
    });

    if (!operations) {
      throw new Error("illegal state error");
    }

    const [operation] = operations;

    const responses = (operation.responses ?? []).flatMap(
      (response) => response.responses ?? []
    );

    const fullText = responses
      .map((response) => response.fullTextAnnotation?.text)
      .filter(isNotNull);

    return {
      text: fullText.join(" "),
    };
  }
}
