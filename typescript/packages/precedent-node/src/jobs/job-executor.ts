import { assertNever, GreedyTextChunker } from "@fgpt/precedent-iso";

import { LOGGER } from "../logger";
import { ProcessedFileStore } from "../processed-file-store";
import { ShaHash } from "../sha-hash";
import { Task, TaskService } from "../task-service";
import { TextChunkStore } from "../text-chunk-store";
import { TextExtractor } from "../text-extractor";
import { MLServiceClient } from "../ml/ml-service";

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
    private readonly processedFileStore: ProcessedFileStore,
    private readonly textChunkStore: TextChunkStore,
    private readonly mlService: MLServiceClient
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

  async #executeTask({ config }: Task) {
    switch (config.type) {
      case "text-extraction": {
        const { text } = await this.textExtractor.extract(config.fileId);
        const processedFile = await this.processedFileStore.upsert({
          organizationId: config.organizationId,
          projectId: config.projectId,
          fileReferenceId: config.fileId,
          text,
          hash: ShaHash.forData(text),
        });

        await this.taskService.insert({
          organizationId: config.organizationId,
          projectId: config.projectId,
          config: {
            type: "text-chunk",
            version: "1",
            organizationId: config.organizationId,
            projectId: config.projectId,
            fileId: config.fileId,
            processedFileId: processedFile.id,
          },
        });

        break;
      }
      case "text-chunk": {
        const text = await this.processedFileStore.getText(
          config.processedFileId
        );
        const chunker = new GreedyTextChunker();
        const chunks = chunker.chunk({
          tokenChunkLimit: 500,
          text,
        });

        await this.textChunkStore.upsertMany(
          chunks.map((chunkText, chunkOrder) => ({
            version: "1",
            organizationId: config.organizationId,
            projectId: config.projectId,
            fileReferenceId: config.fileId,
            processedFileId: config.processedFileId,
            chunkOrder,
            chunkText,
            hash: ShaHash.forData(chunkText),
          }))
        );

        await this.taskService.insert({
          organizationId: config.organizationId,
          projectId: config.projectId,
          config: {
            type: "gen-embeddings",
            version: "1",
            organizationId: config.organizationId,
            projectId: config.projectId,
            fileId: config.fileId,
            processedFileId: config.processedFileId,
          },
        });

        break;
      }

      case "gen-embeddings": {
        const chunks = await this.textChunkStore.listWithNoEmbeddings(
          config.processedFileId
        );

        const embeddings = await this.mlService.getEmbeddings({
          documents: chunks.map((chunk) => chunk.chunkText),
        });

        const withEmbeddings = chunks.map((chunk, i) => ({
          chunkId: chunk.id,
          embedding: embeddings.response[i]!,
        }));

        await this.textChunkStore.setManyEmbeddings(withEmbeddings);
        break;
      }
      default:
        assertNever(config);
    }
  }
}
