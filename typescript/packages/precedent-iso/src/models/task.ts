import { z } from "zod";

export const ZTaskType = z.enum([
  "text-extraction",
  "text-chunking",
  "embedding-generation",
]);

export const ZTaskStatus = z.enum([
  "queued",
  "in-progress",
  "succeeded",
  "failed",
]);

export const TextExtractionConfig = z.object({
  type: z.literal("text-extraction"),
  fileId: z.string(),
});

export const ZTaskConfig = z.discriminatedUnion("type", [TextExtractionConfig]);

export type TaskType = z.infer<typeof ZTaskType>;
export type TaskStatus = z.infer<typeof ZTaskStatus>;
export type TaskConfig = z.infer<typeof ZTaskConfig>;

export type TaskOuput = Record<string, unknown>;
