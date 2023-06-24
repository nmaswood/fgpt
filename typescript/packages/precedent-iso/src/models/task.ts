import { z } from "zod";

import { ZChunkStrategy } from "../text-chunker/text-chunker";

export const ZTaskType = z.enum([
  "text-extraction",
  "text-chunk",
  "gen-embeddings",
  "upsert-embeddings",
  "delete-project",
  "create-analysis",
  "llm-outputs",
  "extract-table",
]);

export const ZTaskStatus = z.enum([
  "queued",
  "in-progress",
  "succeeded",
  "failed",
]);

export const ZTextExtractionConfig = z.object({
  type: z.literal("text-extraction"),
  version: z.literal("1"),
  organizationId: z.string(),
  projectId: z.string(),
  fileId: z.string(),
});

export const ZTextChunkConfig = z.object({
  type: z.literal("text-chunk"),
  version: z.literal("1"),
  organizationId: z.string(),
  projectId: z.string(),
  fileId: z.string(),
  processedFileId: z.string(),
  strategy: ZChunkStrategy.optional(),
});

export type TextChunkConfig = z.infer<typeof ZTextChunkConfig>;

export const ZGenEmbeddingsConfig = z.object({
  type: z.literal("gen-embeddings"),
  version: z.literal("1"),
  organizationId: z.string(),
  projectId: z.string(),
  fileId: z.string(),
  processedFileId: z.string(),
  textChunkGroupId: z.string(),
});

export const ZUpsertEmbeddingsConfig = z.object({
  type: z.literal("upsert-embeddings"),
  version: z.literal("1"),
  organizationId: z.string(),
  projectId: z.string(),
  fileId: z.string(),
  processedFileId: z.string(),
  chunkIds: z.string().array(),
});

export const ZDeleteProjectConfig = z.object({
  type: z.literal("delete-project"),
  version: z.literal("1"),
  projectId: z.string(),
});

export const ZCreateAnalysisConfig = z.object({
  type: z.literal("create-analysis"),
  version: z.literal("1"),
  organizationId: z.string(),
  projectId: z.string(),
  fileReferenceId: z.string(),
  analysisId: z.string(),
});

export const ZLLMOutputsConfig = z.object({
  type: z.literal("llm-outputs"),
  version: z.literal("1"),
  organizationId: z.string(),
  projectId: z.string(),
  fileReferenceId: z.string(),
  processedFileId: z.string(),
  textChunkGroupId: z.string(),
  textChunkId: z.string(),
});

export const ZExtractTableConfig = z.object({
  type: z.literal("extract-table"),
  version: z.literal("1"),
  organizationId: z.string(),
  projectId: z.string(),
  fileReferenceId: z.string(),
});

export type ExtractTableConfig = z.infer<typeof ZExtractTableConfig>;

export type LLMOutputsConfig = z.infer<typeof ZLLMOutputsConfig>;

export const ZTaskConfig = z.discriminatedUnion("type", [
  ZTextExtractionConfig,
  ZTextChunkConfig,
  ZGenEmbeddingsConfig,
  ZUpsertEmbeddingsConfig,
  ZDeleteProjectConfig,
  ZCreateAnalysisConfig,
  ZLLMOutputsConfig,
  ZExtractTableConfig,
]);

export type TaskType = z.infer<typeof ZTaskType>;
export type TaskStatus = z.infer<typeof ZTaskStatus>;
export type TaskConfig = z.infer<typeof ZTaskConfig>;

export type TaskOuput = Record<string, unknown>;
