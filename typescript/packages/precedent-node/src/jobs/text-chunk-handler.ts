import {
  assertNever,
  CHUNK_STRATEGY_TO_CHUNK_SIZE,
  ChunkStrategy,
  GreedyTextChunker,
  TextChunk,
} from "@fgpt/precedent-iso";
import lodashChunk from "lodash/chunk";

import { LOGGER } from "../logger";
import { ProcessedFileStore } from "../processed-file-store";
import { ShaHash } from "../sha-hash";
import { TextChunkStore } from "../text-chunk-store";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TextChunkHandler {
  export interface Arguments {
    organizationId: string;
    projectId: string;
    fileReferenceId: string;
    processedFileId: string;
    strategy: ChunkStrategy;
  }

  export type Response =
    | { type: "embeddings"; textGroupId: string }
    | undefined;
}

export interface TextChunkHandler {
  chunk: (
    args: TextChunkHandler.Arguments,
  ) => Promise<TextChunkHandler.Response>;
}

export class TextChunkHandlerImpl implements TextChunkHandler {
  CHUNKER = new GreedyTextChunker();
  constructor(
    private readonly processedFileStore: ProcessedFileStore,
    private readonly textChunkStore: TextChunkStore,
  ) {}

  async chunk({
    organizationId,
    projectId,
    fileReferenceId,
    processedFileId,
    strategy,
  }: TextChunkHandler.Arguments): Promise<TextChunkHandler.Response> {
    const sourceText =
      await this.processedFileStore.getSourceText(processedFileId);
    if (sourceText.type === "text_only") {
      throw new Error("text only not supported");
    }

    const { pages } = sourceText;

    if (pages.length === 0) {
      LOGGER.warn({ processedFileId }, "No text to extract");
      return undefined;
    }

    const common = {
      organizationId,
      projectId,
      fileReferenceId,
      processedFileId,
    } as const;

    const chunkSize = CHUNK_STRATEGY_TO_CHUNK_SIZE[strategy];
    if (chunkSize === undefined) {
      throw new Error("illegal state");
    }
    const fromChunker = this.CHUNKER.chunk(chunkSize, sourceText);

    if (fromChunker.type === "without_location") {
      throw new Error("not supported");
    }

    const chunks = fromChunker.chunks;

    const textChunkGroup = await this.textChunkStore.upsertTextChunkGroup({
      ...common,
      numChunks: chunks.length,
      strategy,
    });

    const upsertTextChunkArgs = chunks.map((chunkWithLocation, chunkOrder) => ({
      chunkOrder,
      chunkText: chunkWithLocation.chunk,
      hash: ShaHash.forData(chunkWithLocation.chunk),
      location: chunkWithLocation.location,
    }));
    const commonArgs = {
      ...common,
      textChunkGroupId: textChunkGroup.id,
    };
    const textChunks: TextChunk[] = [];

    for (const upsertTextArgsGroup of lodashChunk(upsertTextChunkArgs, 100)) {
      textChunks.push(
        ...(await this.textChunkStore.upsertManyTextChunks(
          commonArgs,
          upsertTextArgsGroup,
        )),
      );
    }

    switch (strategy) {
      case "greedy_v0": {
        return {
          type: "embeddings",
          textGroupId: textChunkGroup.id,
        };
      }
      case "greedy_15k":
      case "greedy_125k":
      case "greedy_150k": {
        throw new Error("chunk size not expected");
      }

      default:
        assertNever(strategy);
    }
  }
}
