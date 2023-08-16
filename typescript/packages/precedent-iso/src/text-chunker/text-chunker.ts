import { z } from "zod";
import { assertNever } from "../assert-never";
import { SourceText, TextWithPage } from "../models/text-group";

export interface TextChunker {
  chunk(tokenChunkLimit: number, text: SourceText): Chunks;
}

export const ZChunkStrategy = z.enum([
  "greedy_v0",
  "greedy_15k",
  "greedy_125k",
  "greedy_150k",
]);

export const GREEDY_VO_CHUNK_SIZE = 500;
export const GREEDY_15k_CHUNK_SIZE = 15_000;
export const GREEDY_125k_CHUNK_SIZE = 125_000;
export const GREEDY_150k_CHUNK_SIZE = 150_000;

export const CHUNK_STRATEGY_TO_CHUNK_SIZE = {
  greedy_v0: GREEDY_VO_CHUNK_SIZE,
  greedy_15k: GREEDY_15k_CHUNK_SIZE,
  greedy_125k: GREEDY_150k_CHUNK_SIZE,
  greedy_150k: GREEDY_150k_CHUNK_SIZE,
} as const;

export type ChunkStrategy = z.infer<typeof ZChunkStrategy>;

export type ChunkLocation =
  | {
      type: "single";
      page: number;
    }
  | {
      type: "range";
      start: number;
      end: number;
    };

export interface ChunkWithLocation {
  chunk: string;
  location: ChunkLocation;
}

export interface ChunksWithLocation {
  type: "with_location";
  chunks: ChunkWithLocation[];
}

export interface ChunksWithoutLocation {
  type: "without_location";
  chunks: string[];
}

export type Chunks = ChunksWithLocation | ChunksWithoutLocation;

export class GreedyTextChunker implements TextChunker {
  chunk(tokenChunkLimit: number, text: SourceText): Chunks {
    switch (text.type) {
      case "text_only": {
        if (text.text.length === 0) {
          return {
            type: "without_location",
            chunks: [],
          };
        }

        const results = this.#chunkWithLocation(tokenChunkLimit, [
          {
            page: -1,
            text: text.text,
          },
        ]);
        return {
          type: "without_location",
          chunks: results.map((r) => r.chunk),
        };
      }
      case "has_pages":
        return {
          type: "with_location",
          chunks: this.#chunkWithLocation(tokenChunkLimit, text.pages),
        };

      default:
        assertNever(text);
    }
  }

  #chunkWithLocation(
    tokenChunkLimit: number,
    pages: TextWithPage[],
  ): ChunkWithLocation[] {
    const acc: ChunkWithLocation[] = [];

    let currentChunk: IntermediateChunk | undefined = undefined;
    let currentChunkLength = 0;

    for (const page of pages) {
      const words = page.text.split(" ");
      for (const word of words) {
        if (currentChunkLength + word.length > tokenChunkLimit) {
          if (!currentChunk) {
            throw new Error("currentChunk is undefined");
          }
          acc.push({
            chunk: currentChunk.values.join(" "),
            location:
              currentChunk.startPage === page.page
                ? { type: "single", page: page.page }
                : {
                    type: "range",
                    start: currentChunk.startPage,
                    end: page.page,
                  },
          });
          currentChunk = undefined;

          currentChunkLength = 0;
        }
        if (!currentChunk) {
          currentChunk = {
            startPage: page.page,
            values: [],
          };
        }

        currentChunk.values.push(word);
        currentChunkLength += word.length;
      }
    }

    if (currentChunk && currentChunk.values.length > 0) {
      const lastPage = pages.at(-1)?.page;
      if (lastPage === undefined) {
        throw new Error("lastPage is undefined");
      }

      acc.push({
        chunk: currentChunk.values.join(" "),
        location:
          currentChunk.startPage === lastPage
            ? { type: "single", page: lastPage }
            : {
                type: "range",
                start: currentChunk.startPage,
                end: lastPage,
              },
      });
    }
    return acc;
  }
}

interface IntermediateChunk {
  startPage: number;
  values: string[];
}
