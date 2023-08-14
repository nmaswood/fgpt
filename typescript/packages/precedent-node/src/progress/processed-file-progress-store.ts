import {
  assertNever,
  FileProgress,
  ProgressForPdfTasks,
  ProgressTaskStatus,
} from "@fgpt/precedent-iso";

import { TaskStore } from "../task-store";
import { statusForFile } from "./status-for-file";

export interface ProcessedFileProgressService {
  getProgress(
    processedFileId: string,
  ): Promise<FileProgress<ProgressForPdfTasks>>;
}

export class ProcessedFileProgressServiceImpl
  implements ProcessedFileProgressService
{
  constructor(private readonly taskStore: TaskStore) {}
  async getProgress(
    fileReferenceId: string,
  ): Promise<FileProgress<ProgressForPdfTasks>> {
    const tasks = await this.taskStore.getByFileReferenceId(fileReferenceId);

    const forTask: ProgressForPdfTasks = {
      embeddingChunk: "task_does_not_exist",
      reportChunk: "task_does_not_exist",
      report: "task_does_not_exist",
      upsertEmbeddings: "task_does_not_exist",
      extractTable: "task_does_not_exist",
      scan: "task_does_not_exist",
      thumbnail: "task_does_not_exist",
      longFormReport: "task_does_not_exist",
    };

    for (const task of tasks) {
      switch (task.config.type) {
        case "text-chunk": {
          switch (task.config.strategy) {
            case "greedy_v0": {
              forTask.embeddingChunk = task.status;
              break;
            }
            case "greedy_15k": {
              forTask.reportChunk = task.status;
              break;
            }
            case "greedy_125k":
            case "greedy_150k": {
              break;
            }
            default:
              assertNever(task.config.strategy);
          }
          break;
        }

        case "gen-embeddings": {
          forTask.upsertEmbeddings = task.status;
          break;
        }
        case "llm-outputs": {
          forTask.report = task.status;
          break;
        }
        case "extract-table": {
          forTask.extractTable = task.status;
          break;
        }

        case "long-form":
          forTask.longFormReport = task.status;
          break;

        case "thumbnail": {
          forTask.thumbnail = task.status;
          break;
        }

        case "scan": {
          forTask.scan = task.status;
          break;
        }

        case "run-prompt":
          switch (task.config.slug) {
            case "cim":
              forTask.longFormReport = task.status;
              break;
            case "kpi":
            case "ebitda_adjustments":
            case "business_model":
            case "expense_drivers":
              break;
          }
          break;

        case "ingest-file":
        case "text-extraction":
        case "analyze-table":
          break;

        default:
          assertNever(task.config);
      }
    }
    const statuses: ProgressTaskStatus[] = Object.values(forTask);

    return {
      status: statusForFile(statuses),
      forTask,
    };
  }
}
