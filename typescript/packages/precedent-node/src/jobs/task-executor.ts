import { assertNever } from "@fgpt/precedent-iso";
import lodashChunk from "lodash/chunk";

import { LOGGER } from "../logger";
import { Task, TaskStore } from "../task-store";
import { EmbeddingsHandler } from "./generate-embeddings-handler";
import { LLMOutputHandler } from "./llm-output-handler";
import { TableHandler } from "./table-handler";
import { TextChunkHandler } from "./text-chunk-handler";
import { TextExtractionHandler } from "./text-extraction-handler";

export interface TaskExecutor {
  execute(task: Task): Promise<void>;
}

export class TaskExecutorImpl implements TaskExecutor {
  STRATEGIES = ["greedy_v0", "greedy_15k"] as const;
  constructor(
    private readonly taskService: TaskStore,
    private readonly textExtractionHandler: TextExtractionHandler,
    private readonly textChunkHandler: TextChunkHandler,
    private readonly generateEmbeddingsHandler: EmbeddingsHandler,
    private readonly llmOutputHandler: LLMOutputHandler,
    private readonly tableHandler: TableHandler
  ) {}

  async execute({ config, organizationId, projectId }: Task) {
    switch (config.type) {
      case "text-extraction": {
        const { processedFileId } = await this.textExtractionHandler.extract({
          organizationId,
          projectId,
          fileReferenceId: config.fileId,
        });

        await this.taskService.insertMany(
          this.STRATEGIES.map((strategy) => ({
            organizationId,
            projectId,
            fileReferenceId: config.fileId,
            config: {
              type: "text-chunk",
              version: "1",
              organizationId,
              projectId,
              fileId: config.fileId,
              processedFileId,
              strategy,
            },
          }))
        );

        break;
      }
      case "text-chunk": {
        const resp = await this.textChunkHandler.chunk({
          organizationId: config.organizationId,
          projectId: config.projectId,
          fileReferenceId: config.fileId,
          processedFileId: config.processedFileId,
          strategy: config.strategy ?? "greedy_v0",
        });

        switch (resp?.type) {
          case undefined:
            break;
          case "embeddings": {
            await this.taskService.insert({
              organizationId,
              projectId,
              fileReferenceId: config.fileId,
              config: {
                type: "gen-embeddings",
                version: "1",
                organizationId,
                projectId,
                fileId: config.fileId,
                processedFileId: config.processedFileId,
                textChunkGroupId: resp.textGroupId,
              },
            });
            break;
          }
          case "llm-output":
            await this.taskService.insertMany(
              resp.textChunkIds.map((textChunkId) => ({
                organizationId,
                projectId,
                fileReferenceId: config.fileId,
                config: {
                  type: "llm-outputs",
                  version: "1",
                  organizationId,
                  projectId,
                  fileReferenceId: config.fileId,
                  processedFileId: config.processedFileId,
                  textChunkGroupId: resp.textGroupId,
                  textChunkId,
                },
              }))
            );
            break;
          default:
            assertNever(resp);
        }

        break;
      }

      case "gen-embeddings": {
        const { textChunkIds } =
          await this.generateEmbeddingsHandler.generateEmbeddings({
            textChunkGroupId: config.textChunkGroupId,
          });

        const groups = lodashChunk(textChunkIds, 100);
        await this.taskService.insertMany(
          groups.map((chunkIds) => ({
            organizationId,
            projectId,
            fileReferenceId: config.fileId,
            config: {
              type: "upsert-embeddings",
              version: "1",
              organizationId: config.organizationId,
              projectId: config.projectId,
              fileId: config.fileId,
              processedFileId: config.processedFileId,
              chunkIds,
            },
          }))
        );

        break;
      }
      case "upsert-embeddings": {
        await this.generateEmbeddingsHandler.upsertEmbeddings({
          textChunkIds: config.chunkIds,
          organizationId: config.organizationId,
          projectId: config.projectId,
          fileReferenceId: config.fileId,
          processedFileId: config.processedFileId,
        });

        break;
      }
      case "delete-project": {
        LOGGER.warn("Delete project not implemented");
        break;
      }

      case "llm-outputs": {
        await this.llmOutputHandler.generateReport(config);
        break;
      }

      case "extract-table": {
        const res = await this.tableHandler.extractTable({
          fileReferenceId: config.fileReferenceId,
        });
        if (!res) {
          return;
        }
        await this.taskService.insert({
          organizationId,
          projectId,
          fileReferenceId: res.fileReferenceId,
          config: {
            type: "analyze-table",
            version: "1",
            organizationId,
            projectId,
            fileReferenceId: res.fileReferenceId,
            source: {
              type: "derived",
              excelAssetId: res.excelAssetId,
            },
          },
        });

        break;
      }

      case "analyze-table": {
        await this.tableHandler.analyzeTable({ config });
        break;
      }

      default:
        assertNever(config);
    }
  }
}
