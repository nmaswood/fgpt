import { assertNever, ChunkStrategy } from "@fgpt/precedent-iso";

import { LOGGER } from "../logger";
import { PromptService } from "../prompt/prompt-service";
import { CreateTask, Task, TaskStore } from "../task-store";
import { EmbeddingsHandler } from "./generate-embeddings-handler";
import { IngestFileHandler } from "./ingest-file-handler";
import { ReportHandler } from "./report-handler";
import { ScanHandler } from "./scan-handler";
import { TableHandler } from "./table-handler";
import { TextChunkHandler } from "./text-chunk-handler";
import { TextExtractionHandler } from "./text-extraction-handler";
import { ThumbnailHandler } from "./thumbnail-handler";

export interface TaskExecutor {
  execute(task: Task): Promise<void>;
}

export class TaskExecutorImpl implements TaskExecutor {
  STRATEGIES: ChunkStrategy[] = ["greedy_v0", "greedy_15k"];
  constructor(
    private readonly taskStore: TaskStore,
    private readonly textExtractionHandler: TextExtractionHandler,
    private readonly textChunkHandler: TextChunkHandler,
    private readonly generateEmbeddingsHandler: EmbeddingsHandler,
    private readonly reportHandler: ReportHandler,
    private readonly tableHandler: TableHandler,
    private readonly ingestFileHandler: IngestFileHandler,
    private readonly thumbnailHandler: ThumbnailHandler,
    private readonly scanHandler: ScanHandler,
    private readonly promptService: PromptService,
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

        const taskConfig: CreateTask[] = this.STRATEGIES.map((strategy) => ({
          organizationId: config.organizationId,
          projectId: config.projectId,
          fileReferenceId: config.fileReferenceId,
          config: {
            type: "text-chunk",
            organizationId,
            projectId,
            fileReferenceId: config.fileReferenceId,
            processedFileId,
            strategy,
          },
        }));
        LOGGER.info("Enqueueing greedy_150k chunking");
        taskConfig.push({
          organizationId: config.organizationId,
          projectId: config.projectId,
          fileReferenceId: config.fileReferenceId,
          config: {
            type: "text-chunk",
            organizationId,
            projectId,
            fileReferenceId: config.fileReferenceId,
            processedFileId,
            strategy: "greedy_150k",
          },
        });

        taskConfig.push({
          organizationId: config.organizationId,
          projectId: config.projectId,
          fileReferenceId: config.fileReferenceId,
          config: {
            type: "scan",
            fileReferenceId: config.fileReferenceId,
            processedFileId,
          },
        });

        await this.taskStore.insertMany(taskConfig);

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
            LOGGER.info(
              `Inserting an llm-output task with ${resp.textChunkIds.length} text chunks`,
            );
            await this.taskStore.insert({
              organizationId,
              projectId,
              fileReferenceId: config.fileReferenceId,
              config: {
                type: "llm-outputs",
                organizationId,
                projectId,
                fileReferenceId: config.fileReferenceId,
                processedFileId: config.processedFileId,
                textChunkGroupId: resp.textGroupId,
                textChunkIds: resp.textChunkIds,
              },
            });

            break;
          }
          case "long-form":
            await this.taskStore.insert({
              organizationId,
              projectId,
              fileReferenceId: config.fileReferenceId,
              config: {
                type: "long-form",
                organizationId,
                projectId,
                fileReferenceId: config.fileReferenceId,
                processedFileId: config.processedFileId,
                textChunkGroupId: resp.textGroupId,
                textChunkIds: resp.textChunkIds,
              },
            });
            break;
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

      case "llm-outputs": {
        await this.reportHandler.generateReport(config);
        break;
      }
      case "long-form": {
        await this.reportHandler.generateLongFormReport(config);
        break;
      }

      case "extract-table": {
        await this.tableHandler.extractTable({
          fileReferenceId: config.fileReferenceId,
        });
        break;
      }

      case "analyze-table": {
        if (config.source === null) {
          return;
        }

        switch (config.analysis.type) {
          case "text": {
            await this.tableHandler.analyzeTable({
              projectId: config.projectId,
              organizationId: config.organizationId,
              source: config.source,
              fileReferenceId: config.fileReferenceId,
              model: config.analysis.model,
            });
            break;
          }
          case "code": {
            throw new Error("Not implemented");
          }
        }
        break;
      }

      case "thumbnail": {
        await this.thumbnailHandler.forPdf(config.fileReferenceId);
        break;
      }

      case "scan": {
        await this.scanHandler.scan({
          fileReferenceId: config.fileReferenceId,
          processedFileId: config.processedFileId,
        });
        break;
      }

      case "run-prompt": {
        this.promptService;
        throw new Error("not implemented");
      }

      default:
        assertNever(config);
    }
  }
}
