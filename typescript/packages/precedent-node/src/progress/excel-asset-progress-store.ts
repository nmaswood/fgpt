import {
  assertNever,
  FileProgress,
  ProgressForExcelTasks,
} from "@fgpt/precedent-iso";

import { TaskStore } from "../task-store";
import { statusForFile } from "./status-for-file";

export interface ExcelProgressService {
  getProgress(
    processedFileId: string,
  ): Promise<FileProgress<ProgressForExcelTasks>>;
}

export class ExcelProgressServiceImpl implements ExcelProgressService {
  constructor(private readonly taskStore: TaskStore) {}
  async getProgress(
    fileReferenceId: string,
  ): Promise<FileProgress<ProgressForExcelTasks>> {
    const tasks = await this.taskStore.getByFileReferenceId(fileReferenceId);

    const forTask: ProgressForExcelTasks = {
      analyzeTableClaude: "task_does_not_exist",
    };

    for (const task of tasks) {
      switch (task.config.type) {
        case "analyze-table": {
          switch (task.config.analysis?.model) {
            case "claude": {
              forTask.analyzeTableClaude = task.status;
              break;
            }
            case "gpt":
            case undefined:
            case null:
              break;
            default:
              assertNever(task.config.analysis.model);
          }
          break;
        }
        case "gen-embeddings":
        case "llm-outputs":
        case "extract-table":
        case "long-form":
        case "ingest-file":
        case "text-extraction":
        case "text-chunk":
        case "thumbnail":
        case "scan":
        case "run-prompt":
          break;
        default:
          assertNever(task.config);
      }
    }

    return {
      forTask,
      status: statusForFile(Object.values(forTask)),
    };
  }
}
