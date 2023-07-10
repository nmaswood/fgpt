import { isNotNull, TextChunk } from "@fgpt/precedent-iso";
import { keyBy } from "lodash";

import { MLServiceClient } from "../ml/ml-service";
import { VectorService } from "../ml/vector-service";
import { TextChunkStore } from "../text-chunk-store";

export interface GenerateAndUpsertArguments {
  textChunkGroupId: string;
}

export interface EmbeddingsHandler {
  generateAndUpsertEmbeddings: (
    args: GenerateAndUpsertArguments,
  ) => Promise<void>;
}

export class EmbeddingsHandlerImpl implements EmbeddingsHandler {
  constructor(
    private readonly mlService: MLServiceClient,
    private readonly textChunkStore: TextChunkStore,
    private readonly vectorService: VectorService,
  ) {}

  async generateAndUpsertEmbeddings({
    textChunkGroupId,
  }: GenerateAndUpsertArguments): Promise<void> {
    const chunkGenerator = this.textChunkStore.iterateTextChunks(
      100,
      textChunkGroupId,
    );

    for await (const group of chunkGenerator) {
      const byChunkId = await this.#getAndSetEmbeddingsIfNeeded(
        textChunkGroupId,
        group,
      );
      const payloads = group
        .map((textChunk) => {
          const vector = byChunkId[textChunk.id]?.embedding;
          return vector
            ? {
                textChunk,
                vector,
              }
            : null;
        })
        .filter(isNotNull)
        .map(({ textChunk, vector }) => ({
          id: textChunk.id,
          vector,
          metadata: {
            textChunkId: textChunk.id,
            organizationId: textChunk.organizationId,
            projectId: textChunk.projectId,
            // this is so we can eventually migrate to the new name
            fileId: textChunk.fileReferenceId,
            fileReferenceId: textChunk.fileReferenceId,
            processedFileId: textChunk.processedFileId,
          },
        }));

      await this.vectorService.upsertVectors(payloads);
    }
  }
  async #getAndSetEmbeddingsIfNeeded(
    textChunkGroupId: string,
    chunks: TextChunk[],
  ) {
    const hasNoEmbeddings = chunks.filter((c) => !c.hasEmbedding);
    const embeddings = await this.mlService.getEmbeddings({
      documents: hasNoEmbeddings.map((chunk) => chunk.chunkText),
    });

    const withEmbeddings = hasNoEmbeddings.map((chunk, i) => {
      const embedding = embeddings.response[i];
      if (!embedding) {
        throw new Error("undefined embedding");
      }
      return {
        chunkId: chunk.id,
        embedding,
      };
    });

    await this.textChunkStore.setManyEmbeddings(
      textChunkGroupId,
      withEmbeddings,
    );

    const newEmbeddings = await this.textChunkStore.getEmbeddings(
      chunks.map((c) => c.id),
    );

    return keyBy(newEmbeddings, (e) => e.chunkId);
  }
}
