import {
  assertNever,
  DEFAULT_STATUS,
  FileProgress,
  ProgressForPdfTasks,
  TaskStatus,
} from "@fgpt/precedent-iso";

import { TaskStore } from "./task-store";

export interface ProcessedFileProgressStore {
  getProgress(
    processedFileId: string,
  ): Promise<FileProgress<ProgressForPdfTasks>>;
}

export class PSqlProcessedFileProgressStore
  implements ProcessedFileProgressStore
{
  constructor(private readonly taskStore: TaskStore) {}
  async getProgress(
    fileReferenceId: string,
  ): Promise<FileProgress<ProgressForPdfTasks>> {
    const tasks = await this.taskStore.getByFileReferenceId(fileReferenceId);

    const forTask: ProgressForPdfTasks = {
      embeddingChunk: DEFAULT_STATUS,
      reportChunk: DEFAULT_STATUS,
      longFormReportChunk: DEFAULT_STATUS,
      report: DEFAULT_STATUS,
      longFormReport: DEFAULT_STATUS,
      upsertEmbeddings: DEFAULT_STATUS,
      extractTable: DEFAULT_STATUS,
      analyzeTable: DEFAULT_STATUS,
    };

    let hasSeenError = false;
    let totalCompleted = 0;

    const checkStatus = (status: TaskStatus) => {
      switch (status) {
        case "in-progress":
        case "queued":
          break;
        case "failed":
          hasSeenError = true;
          break;
        case "succeeded":
          totalCompleted += 1;
          break;
        default:
          assertNever(status);
      }
    };
    for (const task of tasks) {
      switch (task.config.type) {
        case "text-chunk": {
          switch (task.config.strategy) {
            case "greedy_v0": {
              forTask.embeddingChunk = { type: task.status };
              checkStatus(task.status);
              break;
            }
            case "greedy_15k": {
              forTask.reportChunk = { type: task.status };
              checkStatus(task.status);
              break;
            }
            case "greedy_125k": {
              forTask.longFormReportChunk = { type: task.status };
              break;
            }
            default:
              assertNever(task.config.strategy);
          }
          break;
        }

        case "gen-embeddings": {
          checkStatus(task.status);
          forTask.upsertEmbeddings = { type: task.status };
          break;
        }
        case "llm-outputs": {
          checkStatus(task.status);
          forTask.report = { type: task.status };
          break;
        }
        case "extract-table": {
          checkStatus(task.status);
          forTask.extractTable = { type: task.status };
          break;
        }
        case "analyze-table": {
          checkStatus(task.status);
          forTask.analyzeTable = { type: task.status };
          break;
        }
        case "long-form":
          forTask.longFormReport = { type: task.status };
          break;
        case "ingest-file":
        case "text-extraction":
        case "thumbnail":
          break;

        default:
          assertNever(task.config);
      }
    }

    const getType = (): FileProgress<ProgressForPdfTasks>["type"] => {
      if (hasSeenError) {
        return "has-failure";
      } else if (totalCompleted === 6) {
        return "succeeded";
      }
      return "pending";
    };

    return {
      type: getType(),
      forTask,
    };
  }
}
