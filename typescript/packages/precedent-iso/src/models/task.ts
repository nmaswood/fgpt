import { z } from "zod";

export const ZTaskType = z.enum([
  "text-extraction",
  "text-chunk",
  "gen-embeddings",
  "upsert-embeddings",
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
  textChunkGroupId: z.string(),
});

export const UpsertEmbeddingsConfig = z.object({
  type: z.literal("upsert-embeddings"),
  version: z.literal("1"),
  organizationId: z.string(),
  projectId: z.string(),
  fileId: z.string(),
  processedFileId: z.string(),
  chunkIds: z.string().array(),
});

export const ZTaskConfig = z.discriminatedUnion("type", [
  TextExtractionConfig,
  TextChunkConfig,
  GenEmbeddingsConfig,
  UpsertEmbeddingsConfig,
]);

export type TaskType = z.infer<typeof ZTaskType>;
export type TaskStatus = z.infer<typeof ZTaskStatus>;
export type TaskConfig = z.infer<typeof ZTaskConfig>;

export type TaskOuput = Record<string, unknown>;
