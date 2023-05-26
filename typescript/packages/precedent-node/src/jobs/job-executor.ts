import { assertNever, GreedyTextChunker } from "@fgpt/precedent-iso";
import keyBy from "lodash/keyBy";

import { LOGGER } from "../logger";
import { MLServiceClient } from "../ml/ml-service";
import { ProcessedFileStore } from "../processed-file-store";
import { ShaHash } from "../sha-hash";
import { Task, TaskService } from "../task-service";
import { TextChunkStore } from "../text-chunk-store";
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

        const textChunkGroup = await this.textChunkStore.upsertTextChunkGroup({
          organizationId: config.organizationId,
          projectId: config.projectId,
          fileReferenceId: config.fileId,
          processedFileId: config.processedFileId,
          numChunks: chunks.length,
        });

        if (textChunkGroup.fullyChunked && textChunkGroup.fullyEmbedded) {
          LOGGER.warn(
            { textChunkGroup },
            "Text chunk group is already fully chunked and embedded, skipping"
          );
          return;
        }

        await this.textChunkStore.upsertManyTextChunks(
          {
            organizationId: config.organizationId,
            projectId: config.projectId,
            fileReferenceId: config.fileId,
            processedFileId: config.processedFileId,
            textChunkGroupId: textChunkGroup.id,
          },
          chunks.map((chunkText, chunkOrder) => ({
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
            textChunkGroupId: textChunkGroup.id,
          },
        });

        break;
      }

      case "gen-embeddings": {
        const chunks = await this.textChunkStore.listWithNoEmbeddings(
          config.textChunkGroupId
        );

        if (chunks.length === 0) {
          LOGGER.warn("No chunk ids with embeddings present, skipping");
          return;
        }

        const embeddings = await this.mlService.getEmbeddings({
          documents: chunks.map((chunk) => chunk.chunkText),
        });

        const withEmbeddings = chunks.map((chunk, i) => {
          const embedding = embeddings.response[i];
          if (!embedding) {
            throw new Error("undefined embedding");
          }
          return {
            chunkId: chunk.id,
            embedding,
          };
        });

        const chunksWritten = await this.textChunkStore.setManyEmbeddings(
          config.textChunkGroupId,
          withEmbeddings
        );

        await this.taskService.insert({
          organizationId: config.organizationId,
          projectId: config.projectId,
          config: {
            type: "upsert-embeddings",
            version: "1",
            organizationId: config.organizationId,
            projectId: config.projectId,
            fileId: config.fileId,
            processedFileId: config.processedFileId,
            chunkIds: chunksWritten.map((chunk) => chunk.id),
          },
        });
        break;
      }
      case "upsert-embeddings": {
        const embeddings = await this.textChunkStore.getEmbeddings(
          config.chunkIds
        );
        const byChunkId = keyBy(embeddings, (e) => e.chunkId);
        await this.mlService.upsertVectors(
          config.chunkIds.map((id) => ({
            id,
            vector: byChunkId[id]!.embedding,
            metadata: {
              organizationId: config.organizationId,
              projectId: config.projectId,
              fileId: config.fileId,
              processedFileId: config.processedFileId,
            },
          }))
        );
        break;
      }
      case "delete-project": {
        LOGGER.warn("Delete project not implemented");
        break;
      }
      default:
        assertNever(config);
    }
  }
}
