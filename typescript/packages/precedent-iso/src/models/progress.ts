import { TaskStatus } from "./task";
export type ProgressTaskStatus = {
  type: "task_does_not_exist" | TaskStatus;
};

export const DEFAULT_STATUS = {
  type: "task_does_not_exist",
} as const;

export interface FileProgress<
  T extends ProgressForPdfTasks | ProgressForExcelTasks,
> {
  type: "succeeded" | "pending" | "has-failure";
  forTask: T;
}

export interface ProgressForPdfTasks {
  embeddingChunk: ProgressTaskStatus;
  reportChunk: ProgressTaskStatus;
  report: ProgressTaskStatus;
  longFormReportChunk: ProgressTaskStatus;
  longFormReport: ProgressTaskStatus;
  upsertEmbeddings: ProgressTaskStatus;
  extractTable: ProgressTaskStatus;
  analyzeTable: ProgressTaskStatus;
}

export interface ProgressForExcelTasks {
  analyzeTable: ProgressTaskStatus;
}
