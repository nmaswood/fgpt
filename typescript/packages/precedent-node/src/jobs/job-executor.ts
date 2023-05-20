import { assertNever } from "@fgpt/precedent-iso";

import { LOGGER } from "../logger";
import { ProcessedFileStore } from "../processed-file-store";
import { ShaHash } from "../sha-hash";
import { Task, TaskService } from "../task-service";
import { TextExtractor } from "../text-extractor";

export interface RunOptions {
  limit: number;
  retryLimit: number;
}

export interface JobExecutor {
  run: (optionss: RunOptions) => Promise<void>;
}
export class JobExecutorImpl implements JobExecutor {
  constructor(
    private readonly textExtractor: TextExtractor,
    private readonly taskService: TaskService,
    private readonly processedFileStore: ProcessedFileStore
  ) {}

  async run(options: RunOptions): Promise<void> {
    for (let i = 0; i < options.limit; i++) {
      const [task] = await this.taskService.setAsPending({ limit: 1 });

      if (!task) {
        LOGGER.info("No more work to do");
        return;
      }
      LOGGER.info({ task }, "Executing task");
      try {
        await this.#executeWithRetry(options, task);
        await this.taskService.setAsCompleted([
          { taskId: task.id, status: "succeeded", output: {} },
        ]);
      } catch (err) {
        LOGGER.error(err);
        await this.taskService.setAsCompleted([
          { taskId: task.id, status: "failed", output: {} },
        ]);
      }
    }
  }

  async #executeWithRetry(options: RunOptions, task: Task): Promise<void> {
    for (let attempt = 0; attempt < options.retryLimit; attempt++) {
      LOGGER.info(`Attempt number ${attempt + 1} / ${options.retryLimit}`);
      try {
        await this.#executeTask(task);
        LOGGER.info("Task succeeded");
        break;
      } catch (err) {
        LOGGER.error(err);
        if (attempt === options.retryLimit - 1) {
          LOGGER.warn("Failed to execute task after max retries");
          throw err;
        }
      }
    }
  }

  async #executeTask(task: Task) {
    switch (task.config.type) {
      case "text-extraction": {
        const { text } = await this.textExtractor.extract(task.config.fileId);
        await this.processedFileStore.upsertMany([
          {
            organizationId: task.config.organizationId,
            projectId: task.config.projectId,
            fileReferenceId: task.config.fileId,
            text,
            hash: ShaHash.forData(text),
          },
        ]);
        break;
      }
      default:
        assertNever(task.config.type);
    }
  }
}
