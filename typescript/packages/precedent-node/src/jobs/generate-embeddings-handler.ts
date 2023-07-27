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

export interface ChunkNeighbors {
  prev: string | undefined;
  next: string | undefined;
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
      50,
      textChunkGroupId,
    );

    for await (const group of chunkGenerator) {
      const byChunkId = await this.#getAndSetEmbeddingsIfNeeded(group);
      const orderMap = await this.#orderMap(textChunkGroupId, group);
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
            organizationId: textChunk.organizationId,
            projectId: textChunk.projectId,
            fileReferenceId: textChunk.fileReferenceId,
            ...orderMap[textChunk.chunkOrder],
          },
        }));

      await this.vectorService.upsertVectors(payloads);
    }
  }
  async #getAndSetEmbeddingsIfNeeded(chunks: TextChunk[]) {
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

    await this.textChunkStore.setManyEmbeddings(withEmbeddings);

    const newEmbeddings = await this.textChunkStore.getEmbeddings(
      chunks.map((c) => c.id),
    );

    return keyBy(newEmbeddings, (e) => e.chunkId);
  }

  async #orderMap(
    textChunkGroupId: string,
    chunks: TextChunk[],
  ): Promise<Record<number, ChunkNeighbors>> {
    const orders = this.#getOrders(chunks);

    const forOrders = await this.textChunkStore.getTextChunkByOrder(
      textChunkGroupId,
      orders,
    );

    const byIndex = keyBy(forOrders, (c) => c.chunkOrder);

    return Object.fromEntries(
      orders.map((order) => [
        order,
        {
          prev: byIndex[order - 1]?.id,
          next: byIndex[order + 1]?.id,
        },
      ]),
    );
  }

  #getOrders(chunks: TextChunk[]): number[] {
    const toFetch: Set<number> = new Set();

    for (const chunk of chunks) {
      toFetch.add(chunk.chunkOrder);
      toFetch.add(chunk.chunkOrder - 1);
      toFetch.add(chunk.chunkOrder + 1);
    }

    return Array.from(toFetch).sort();
  }
}
