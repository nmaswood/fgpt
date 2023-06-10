import {
  assertNever,
  GREEDY_VO_CHUNK_SIZE,
  GreedyTextChunker,
  isNotNull,
} from "@fgpt/precedent-iso";
import lodashChunk from "lodash/chunk";
import keyBy from "lodash/keyBy";

import { AnalysisService } from "../analysis-service";
import { AnalysisStore } from "../analysis-store";
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

export interface JobExecutor {
  run: (optionss: RunOptions) => Promise<ExecutionResult[]>;
}
export class JobExecutorImpl implements JobExecutor {
  constructor(
    private readonly textExtractor: TextExtractor,
    private readonly taskService: TaskService,
    private readonly processedFileStore: ProcessedFileStore,
    private readonly textChunkStore: TextChunkStore,
    private readonly mlService: MLServiceClient,
    private readonly analysisService: AnalysisService,
    private readonly analysisStore: AnalysisStore
  ) {}

  async run(options: RunOptions): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    for (let i = 0; i < options.limit; i++) {
      const [task] = await this.taskService.setAsPending({ limit: 1 });

      const statusForTask = withTaskId(task?.id);

      if (!task) {
        LOGGER.info("No more work to do");
        results.push(statusForTask("succeeded"));
        break;
      }
      LOGGER.info({ task }, "Executing task");
      try {
        await this.#executeWithRetry(options, task);
        await this.taskService.setAsCompleted([
          { taskId: task.id, status: "succeeded", output: {} },
        ]);

        results.push(statusForTask("succeeded"));
      } catch (err) {
        LOGGER.error(err);
        await this.taskService.setAsCompleted([
          { taskId: task.id, status: "failed", output: {} },
        ]);

        results.push(statusForTask("failed"));
      }
    }
    return results;
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
        if (text.length === 0) {
          LOGGER.warn({ config }, "No text to extract");
          return;
        }
        const chunker = new GreedyTextChunker();
        const chunks = chunker.chunk({
          tokenChunkLimit: GREEDY_VO_CHUNK_SIZE,
          text,
        });

        const textChunkGroup = await this.textChunkStore.upsertTextChunkGroup({
          organizationId: config.organizationId,
          projectId: config.projectId,
          fileReferenceId: config.fileId,
          processedFileId: config.processedFileId,
          numChunks: chunks.length,
          strategy: "greedy_v0",
          embeddingsWillBeGenerated: true,
        });

        if (textChunkGroup.fullyChunked && textChunkGroup.fullyEmbedded) {
          LOGGER.warn(
            { textChunkGroup },
            "Text chunk group is already fully chunked and embedded, skipping"
          );
          return;
        }

        const allChunkArgs = chunks.map((chunkText, chunkOrder) => ({
          chunkOrder,
          chunkText,
          hash: ShaHash.forData(chunkText),
        }));

        const commonArgs = {
          organizationId: config.organizationId,
          projectId: config.projectId,
          fileReferenceId: config.fileId,
          processedFileId: config.processedFileId,
          textChunkGroupId: textChunkGroup.id,
        };
        for (const group of lodashChunk(allChunkArgs, 100)) {
          await this.textChunkStore.upsertManyTextChunks(commonArgs, group);
        }

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
        const allChunks = await this.textChunkStore.listWithNoEmbeddings(
          config.textChunkGroupId
        );

        if (allChunks.length === 0) {
          LOGGER.warn("No chunk ids with embeddings present, skipping");
          return;
        }

        for (const group of lodashChunk(allChunks, 100)) {
          LOGGER.info("Processing chunk group");
          const embeddings = await this.mlService.getEmbeddings({
            documents: group.map((chunk) => chunk.chunkText),
          });

          const withEmbeddings = group.map((chunk, i) => {
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
        }

        break;
      }
      case "upsert-embeddings": {
        const embeddings = await this.textChunkStore.getEmbeddings(
          config.chunkIds
        );
        const byChunkId = keyBy(embeddings, (e) => e.chunkId);

        for (const chunkId of config.chunkIds) {
          if (!byChunkId[chunkId]) {
            LOGGER.error({ chunkId }, "Missing embedding for chunk id");
          }
        }

        const payloads = config.chunkIds
          .map((chunkId) => ({
            chunkId,
            embedding: byChunkId[chunkId]?.embedding,
          }))
          .filter((val) => isNotNull(val.embedding))
          .map(({ chunkId, embedding }) => ({
            id: chunkId,
            vector: embedding!,
            metadata: {
              organizationId: config.organizationId,
              projectId: config.projectId,
              fileId: config.fileId,
              processedFileId: config.processedFileId,
            },
          }));

        await this.mlService.upsertVectors(payloads);
        break;
      }
      case "delete-project": {
        LOGGER.warn("Delete project not implemented");
        break;
      }

      case "create-analysis": {
        const output = await this.analysisService.analyze(config.analysisId);

        await this.analysisStore.update({
          id: config.analysisId,
          output,
        });

        LOGGER.warn("Create analysis not implemented");
        break;
      }
      default:
        assertNever(config);
    }
  }
}
