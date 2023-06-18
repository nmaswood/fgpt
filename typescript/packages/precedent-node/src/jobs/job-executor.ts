import { LOGGER } from "../logger";
import { Task, TaskStore } from "../task-store";
import { TaskExecutor } from "./task-executor";

export interface RunOptions {
  limit: number;
  retryLimit: number;
  debugMode: boolean;
}

export interface ExecutionResult {
  taskId: string | undefined;
  status: "succeeded" | "failed";
}

function withTaskId(taskId: string | undefined) {
  return (status: "succeeded" | "failed"): ExecutionResult => ({
    taskId,
    status,
  });
}

export interface TaskRunner {
  run: (optionss: RunOptions) => Promise<ExecutionResult[]>;
}

export class TaskRunnerImpl implements TaskRunner {
  constructor(
    private readonly taskService: TaskStore,
    private readonly taskExecutor: TaskExecutor
  ) {}

  async run(options: RunOptions): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    for (let i = 0; i < options.limit; i++) {
      const task = await this.taskService.getAndSetToInProgress();

      const statusForTask = withTaskId(task?.id);

      if (!task) {
        LOGGER.info("No more work to do");
        results.push(statusForTask("succeeded"));
        break;
      }
      LOGGER.info({ task }, `Executing task ${task.config.type}`);
      try {
        await this.#executeWithRetry(options, task);
        await this.taskService.setToSuceeded(task.id);

        results.push(statusForTask("succeeded"));
      } catch (err) {
        LOGGER.error(err);
        if (options.debugMode) {
          await this.taskService.setToQueued(task.id);
        } else {
          await this.taskService.setToFailed(task.id);
        }

        results.push(statusForTask("failed"));
      }
    }
    return results;
  }

  async #executeWithRetry(options: RunOptions, task: Task): Promise<void> {
    for (let attempt = 0; attempt < options.retryLimit; attempt++) {
      LOGGER.info(`Attempt number ${attempt + 1} / ${options.retryLimit}`);
      try {
        await this.taskExecutor.execute(task);
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
}
