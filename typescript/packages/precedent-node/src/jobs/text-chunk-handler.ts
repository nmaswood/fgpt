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
    | {
        type: "llm-output" | "long-form";
        textGroupId: string;
        textChunkIds: string[];
      }
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
    const text = await this.processedFileStore.getText(processedFileId);
    if (text.length === 0) {
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
    const chunks = this.CHUNKER.chunk({
      tokenChunkLimit: chunkSize,
      text,
    });

    const textChunkGroup = await this.textChunkStore.upsertTextChunkGroup({
      ...common,
      numChunks: chunks.length,
      strategy,
      embeddingsWillBeGenerated: strategy === "greedy_v0",
    });
    const upsertTextChunkArgs = chunks.map((chunkText, chunkOrder) => ({
      chunkOrder,
      chunkText,
      hash: ShaHash.forData(chunkText),
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
      case "greedy_15k": {
        return {
          type: "llm-output",
          textChunkIds: textChunks.map((chunk) => chunk.id),
          textGroupId: textChunkGroup.id,
        };
      }
      case "greedy_125k":
      case "greedy_150k": {
        return {
          type: "long-form",
          textChunkIds: textChunks.map((chunk) => chunk.id),
          textGroupId: textChunkGroup.id,
        };
      }

      default:
        assertNever(strategy);
    }
  }
}
