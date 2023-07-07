import { TaskStatus } from "./task";
export type ProgressTaskStatus = {
  type: "task_does_not_exist" | TaskStatus;
};

export const DEFAULT_STATUS = {
  type: "task_does_not_exist",
} as const;

export interface ProcessedFileProgress {
  type: "succeeded" | "pending" | "has-failure";
  forTask: ProgressForTask;
}

export interface ProgressForTask {
  embeddingChunk: ProgressTaskStatus;
  reportChunk: ProgressTaskStatus;
  report: ProgressTaskStatus;
  upsertEmbeddings: ProgressTaskStatus;
  extractTable: ProgressTaskStatus;
  analyzeTable: ProgressTaskStatus;
}
