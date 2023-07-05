import { isNotNull } from "@fgpt/precedent-iso";
import { keyBy } from "lodash";
import lodashChunk from "lodash/chunk";

import { LOGGER } from "../logger";
import { MLServiceClient } from "../ml/ml-service";
import { TextChunkStore } from "../text-chunk-store";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace EmbeddingsHandler {
  export interface GenerateArguments {
    textChunkGroupId: string;
  }

  export interface GenerateResponse {
    textChunkIds: string[];
  }

  export interface UpsertArguments {
    textChunkIds: string[];
    organizationId: string;
    projectId: string;
    fileReferenceId: string;
    processedFileId: string;
  }
}

export interface EmbeddingsHandler {
  generateEmbeddings: (
    args: EmbeddingsHandler.GenerateArguments
  ) => Promise<EmbeddingsHandler.GenerateResponse>;

  upsertEmbeddings: (args: EmbeddingsHandler.UpsertArguments) => Promise<void>;
}

export class EmbeddingsHandlerImpl implements EmbeddingsHandler {
  constructor(
    private readonly mlService: MLServiceClient,
    private readonly textChunkStore: TextChunkStore
  ) {}

  async generateEmbeddings({
    textChunkGroupId,
  }: EmbeddingsHandler.GenerateArguments): Promise<EmbeddingsHandler.GenerateResponse> {
    const allChunks = await this.textChunkStore.listWithNoEmbeddings(
      textChunkGroupId
    );

    if (allChunks.length === 0) {
      LOGGER.warn("No chunk ids with embeddings present, skipping");
      return {
        textChunkIds: [],
      };
    }

    const textChunkIds: string[] = [];

    for (const group of lodashChunk(allChunks, 100)) {
      LOGGER.info("Processing chunk group");
      const embeddings = await this.mlService.getEmbeddings({
        documents: group.map((chunk) => chunk.chunkText),
      });

      const withEmbeddings = group.map((chunk, i) => {
        const embedding = embeddings.response[i];
        if (!embedding) {
          throw new Error("undefined embedding");
        }
        return {
          chunkId: chunk.id,
          embedding,
        };
      });
      const chunksWritten = await this.textChunkStore.setManyEmbeddings(
        textChunkGroupId,
        withEmbeddings
      );

      textChunkIds.push(...chunksWritten.map((chunk) => chunk.id));
    }
    return { textChunkIds };
  }

  async upsertEmbeddings({
    textChunkIds,
    organizationId,
    projectId,
    fileReferenceId,
    processedFileId,
  }: EmbeddingsHandler.UpsertArguments): Promise<void> {
    const embeddings = await this.textChunkStore.getEmbeddings(textChunkIds);
    const byChunkId = keyBy(embeddings, (e) => e.chunkId);

    for (const chunkId of textChunkIds) {
      if (!byChunkId[chunkId]) {
        LOGGER.error({ chunkId }, "Missing embedding for chunk id");
      }
    }

    const payloads = textChunkIds
      .map((textChunkId) => ({
        textChunkId,
        embedding: byChunkId[textChunkId]?.embedding,
      }))
      .filter((val) => isNotNull(val.embedding))
      .map(({ textChunkId, embedding }) => ({
        id: textChunkId,
        vector: embedding!,
        metadata: {
          textChunkId,
          organizationId,
          projectId,
          fileId: fileReferenceId,
          processedFileId,
        },
      }));

    await this.mlService.upsertVectors(payloads);
  }
}
