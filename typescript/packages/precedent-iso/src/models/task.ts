import { z } from "zod";

export const ZTaskType = z.enum([
  "text-extraction",
  "text-chunk",
  "gen-embeddings",
]);

export const ZTaskStatus = z.enum([
  "queued",
  "in-progress",
  "succeeded",
  "failed",
]);

export const TextExtractionConfig = z.object({
  type: z.literal("text-extraction"),
  version: z.literal("1"),
  organizationId: z.string(),
  projectId: z.string(),
  fileId: z.string(),
});

export const TextChunkConfig = z.object({
  type: z.literal("text-chunk"),
  version: z.literal("1"),
  organizationId: z.string(),
  projectId: z.string(),
  fileId: z.string(),
  processedFileId: z.string(),
});

export const GenEmbeddingsConfig = z.object({
  type: z.literal("gen-embeddings"),
  version: z.literal("1"),
  organizationId: z.string(),
  projectId: z.string(),
  fileId: z.string(),
  processedFileId: z.string(),
});

export const ZTaskConfig = z.discriminatedUnion("type", [
  TextExtractionConfig,
  TextChunkConfig,
  GenEmbeddingsConfig,
]);

export type TaskType = z.infer<typeof ZTaskType>;
export type TaskStatus = z.infer<typeof ZTaskStatus>;
export type TaskConfig = z.infer<typeof ZTaskConfig>;

export type TaskOuput = Record<string, unknown>;
