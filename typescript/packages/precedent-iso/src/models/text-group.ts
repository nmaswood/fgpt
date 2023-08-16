import { z } from "zod";

import { ChunkLocation } from "../text-chunker/text-chunker";

export interface TextChunkGroup {
  id: string;
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  numChunks: number;
}

export interface TextChunk {
  id: string;
  organizationId: string;
  fileReferenceId: string;
  chunkOrder: number;
  chunkText: string;
  hasEmbedding: boolean;
  hash: string;
  location: ChunkLocation | undefined;
}

export const ZTextWithPage = z.object({
  page: z.number(),
  text: z.string(),
});

export type TextWithPage = z.infer<typeof ZTextWithPage>;

export type SourceText =
  | {
      type: "text_only";
      text: string;
    }
  | {
      type: "has_pages";
      pages: TextWithPage[];
    };
