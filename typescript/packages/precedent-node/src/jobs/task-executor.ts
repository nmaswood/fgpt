import { assertNever } from "@fgpt/precedent-iso";

import { LOGGER } from "../logger";
import { TaskGroupService } from "../task-group-service";
import { Task, TaskStore } from "../task-store";
import { EmbeddingsHandler } from "./generate-embeddings-handler";
import { IngestFileHandler } from "./ingest-file-handler";
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
    private readonly taskStore: TaskStore,
    private readonly textExtractionHandler: TextExtractionHandler,
    private readonly textChunkHandler: TextChunkHandler,
    private readonly generateEmbeddingsHandler: EmbeddingsHandler,
    private readonly llmOutputHandler: LLMOutputHandler,
    private readonly tableHandler: TableHandler,
    private readonly taskGroupService: TaskGroupService,
    private readonly ingestFileHandler: IngestFileHandler,
  ) {}

  async execute({ config, organizationId, projectId }: Task) {
    switch (config.type) {
      case "ingest-file": {
        // this handler is special because it creates tasks
        await this.ingestFileHandler.dispatch(config);
        break;
      }

      case "text-extraction": {
        const { processedFileId } = await this.textExtractionHandler.extract({
          organizationId,
          projectId,
          fileReferenceId: config.fileReferenceId,
        });

        const taskGroup = await this.taskGroupService.insertTaskGroup({
          description: `Text chunking for ${config.fileReferenceId}`,
          organizationId,
          projectId,
          fileReferenceId: config.fileReferenceId,
        });

        const tasks = await this.taskStore.insertMany(
          this.STRATEGIES.map((strategy) => ({
            organizationId: config.organizationId,
            projectId: config.projectId,
            fileReferenceId: config.fileReferenceId,
            config: {
              type: "text-chunk",
              version: "1",
              organizationId,
              projectId,
              fileReferenceId: config.fileReferenceId,
              processedFileId,
              strategy,
            },
          })),
        );

        await this.taskGroupService.upsertTasks(
          taskGroup.id,
          tasks.map((task) => task.id),
        );

        break;
      }
      case "text-chunk": {
        const resp = await this.textChunkHandler.chunk({
          organizationId: config.organizationId,
          projectId: config.projectId,
          fileReferenceId: config.fileReferenceId,
          processedFileId: config.processedFileId,
          strategy: config.strategy,
        });

        switch (resp?.type) {
          case undefined:
            break;
          case "embeddings": {
            await this.taskStore.insert({
              organizationId,
              projectId,
              fileReferenceId: config.fileReferenceId,
              config: {
                type: "gen-embeddings",
                version: "1",
                organizationId,
                projectId,
                fileReferenceId: config.fileReferenceId,
                processedFileId: config.processedFileId,
                textChunkGroupId: resp.textGroupId,
              },
            });
            break;
          }
          case "llm-output": {
            const { id: taskGroupId } =
              await this.taskGroupService.insertTaskGroup({
                description: `Generate report for ${config.fileReferenceId}`,
                organizationId,
                projectId,
                fileReferenceId: config.fileReferenceId,
              });

            const tasks = await this.taskStore.insertMany(
              resp.textChunkIds.map((textChunkId) => ({
                organizationId,
                projectId,
                fileReferenceId: config.fileReferenceId,
                config: {
                  type: "llm-outputs",
                  version: "1",
                  organizationId,
                  projectId,
                  fileReferenceId: config.fileReferenceId,
                  processedFileId: config.processedFileId,
                  textChunkGroupId: resp.textGroupId,
                  textChunkId,
                  taskGroupId,
                },
              })),
            );
            await this.taskGroupService.upsertTasks(
              taskGroupId,
              tasks.map((task) => task.id),
            );

            break;
          }
          default:
            assertNever(resp);
        }

        break;
      }

      case "gen-embeddings": {
        await this.generateEmbeddingsHandler.generateAndUpsertEmbeddings({
          textChunkGroupId: config.textChunkGroupId,
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
        await this.taskStore.insert({
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
