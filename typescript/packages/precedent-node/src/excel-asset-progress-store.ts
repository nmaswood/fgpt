import {
  assertNever,
  FileProgress,
  ProgressForExcelTasks,
} from "@fgpt/precedent-iso";

import { TaskStore } from "./task-store";

export interface ExcelProgressStore {
  getProgress(
    processedFileId: string,
  ): Promise<FileProgress<ProgressForExcelTasks>>;
}

export class PSqlExcelProgressStore implements ExcelProgressStore {
  constructor(private readonly taskStore: TaskStore) {}
  async getProgress(
    fileReferenceId: string,
  ): Promise<FileProgress<ProgressForExcelTasks>> {
    const tasks = await this.taskStore.getByFileReferenceId(fileReferenceId);

    const forTask: ProgressForExcelTasks = {
      analyzeTable: { type: "task_does_not_exist" },
    };
    const analyzeTask = tasks.find((t) => t.config.type === "analyze-table");
    let type: FileProgress<ProgressForExcelTasks>["type"] = "pending";

    if (analyzeTask) {
      forTask.analyzeTable = { type: analyzeTask.status };
      switch (analyzeTask.status) {
        case "queued":
          break;
        case "in-progress":
          break;
        case "succeeded":
          type = "succeeded";
          break;
        case "failed":
          type = "has-failure";
          break;
        default:
          assertNever(analyzeTask.status);
      }
    }

    return {
      forTask,
      type,
    };
  }
}
