import { z } from "zod";

import { ZFileType } from "../file-type";
import { ZChunkStrategy } from "../text-chunker/text-chunker";
import { ZExcelSource } from "./excel";

export const ZTaskType = z.enum([
  "ingest-file",
  "text-extraction",
  "text-chunk",
  "gen-embeddings",
  "delete-project",
  "llm-outputs",
  "extract-table",
  "analyze-table",
]);

export const ZTaskStatus = z.enum([
  "queued",
  "in-progress",
  "succeeded",
  "failed",
]);

export const ZIngestFileConfig = z.object({
  type: z.literal("ingest-file"),
  version: z.literal("1"),
  organizationId: z.string(),
  projectId: z.string(),
  fileReferenceId: z.string(),
  fileType: ZFileType,
});

export type IngestFileConfig = z.infer<typeof ZIngestFileConfig>;

export const ZTextExtractionConfig = z.object({
  type: z.literal("text-extraction"),
  version: z.literal("1"),
  organizationId: z.string(),
  projectId: z.string(),
  fileReferenceId: z.string(),
});

export const ZTextChunkConfig = z.object({
  type: z.literal("text-chunk"),
  version: z.literal("1"),
  organizationId: z.string(),
  projectId: z.string(),
  fileReferenceId: z.string(),
  processedFileId: z.string(),
  strategy: ZChunkStrategy,
});

export type TextChunkConfig = z.infer<typeof ZTextChunkConfig>;

export const ZGenEmbeddingsConfig = z.object({
  type: z.literal("gen-embeddings"),
  version: z.literal("1"),
  organizationId: z.string(),
  projectId: z.string(),
  fileReferenceId: z.string(),
  processedFileId: z.string(),
  textChunkGroupId: z.string(),
});

export const ZDeleteProjectConfig = z.object({
  type: z.literal("delete-project"),
  version: z.literal("1"),
  projectId: z.string(),
});

export const ZLLMOutputsConfig = z.object({
  type: z.literal("llm-outputs"),
  version: z.literal("1"),
  organizationId: z.string(),
  projectId: z.string(),
  fileReferenceId: z.string(),
  processedFileId: z.string(),
  textChunkGroupId: z.string(),
  textChunkIds: z.string().array(),
});

export const ZExtractTableConfig = z.object({
  type: z.literal("extract-table"),
  version: z.literal("1"),
  organizationId: z.string(),
  projectId: z.string(),
  fileReferenceId: z.string(),
});

export const ZAnalyzeTableConfig = z.object({
  type: z.literal("analyze-table"),
  version: z.literal("1"),
  organizationId: z.string(),
  projectId: z.string(),
  fileReferenceId: z.string(),
  source: ZExcelSource.nullable(),
});

export type AnalyzeTableConfig = z.infer<typeof ZAnalyzeTableConfig>;

export type ExtractTableConfig = z.infer<typeof ZExtractTableConfig>;

export type LLMOutputsConfig = z.infer<typeof ZLLMOutputsConfig>;

export const ZTaskConfig = z.discriminatedUnion("type", [
  ZIngestFileConfig,
  ZTextExtractionConfig,
  ZTextChunkConfig,
  ZGenEmbeddingsConfig,
  ZDeleteProjectConfig,
  ZLLMOutputsConfig,
  ZExtractTableConfig,
  ZAnalyzeTableConfig,
]);

export type TaskType = z.infer<typeof ZTaskType>;
export type TaskStatus = z.infer<typeof ZTaskStatus>;
export type TaskConfig = z.infer<typeof ZTaskConfig>;
export type TaskOuput = Record<string, unknown>;
