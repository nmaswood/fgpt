import { z } from "zod";

export interface ChunkTextArgs {
  tokenChunkLimit: number;
  text: string;
}

export interface TextChunkResponse {
  chunks: string[];
}
export interface TextChunker {
  chunk(args: ChunkTextArgs): string[];
}

// 4k does not have embeddings generated
export const ZChunkStrategy = z.enum(["greedy_v0", "greedy_4k"]);

export const GREEDY_VO_CHUNK_SIZE = 500;
export const GREEDY_4k_CHUNK_SIZE = 4_000;

export type ChunkStrategy = z.infer<typeof ZChunkStrategy>;

export class GreedyTextChunker implements TextChunker {
  chunk({ text, tokenChunkLimit }: ChunkTextArgs): string[] {
    const chunks: string[] = [];

    let currentChunk: string[] = [];
    let currentChunkLength = 0;

    const words = text.split(" ");

    for (const word of words) {
      if (currentChunkLength + word.length > tokenChunkLimit) {
        chunks.push(currentChunk.join(" "));
        currentChunk = [];
        currentChunkLength = 0;
      }

      currentChunk.push(word);
      currentChunkLength += word.length;
    }
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(" "));
    }
    return chunks;
  }
}
