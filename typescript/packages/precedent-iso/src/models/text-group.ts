import { z } from "zod";
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
