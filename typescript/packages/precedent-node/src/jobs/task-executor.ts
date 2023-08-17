import { assertNever } from "@fgpt/precedent-iso";

import { LOGGER } from "../logger";
import { Task, TaskStore } from "../task-store";
import { EmbeddingsHandler } from "./generate-embeddings-handler";
import { IngestFileHandler } from "./ingest-file-handler";
import { PromptRunnerHandler } from "./prompt-runner-handler";
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
    private readonly promptRunnerHandler: PromptRunnerHandler,
  ) {}

  async execute({ config, organizationId, projectId }: Task) {
    switch (config.type) {
      case "ingest-file": {
        await this.ingestFileHandler.dispatch(config);
        break;
      }

      case "text-extraction": {
        const { processedFileId } = await this.textExtractionHandler.extract({
          organizationId,
          projectId,
          fileReferenceId: config.fileReferenceId,
        });

        await this.taskStore.insertMany([
          {
            organizationId: config.organizationId,
            projectId: config.projectId,
            fileReferenceId: config.fileReferenceId,
            config: {
              type: "text-chunk",
              organizationId,
              projectId,
              fileReferenceId: config.fileReferenceId,
              processedFileId,
              strategy: "greedy_v0",
            },
          },
          {
            organizationId: config.organizationId,
            projectId: config.projectId,
            fileReferenceId: config.fileReferenceId,
            config: {
              type: "scan",
              fileReferenceId: config.fileReferenceId,
              processedFileId,
            },
          },
          {
            organizationId: config.organizationId,
            projectId: config.projectId,
            fileReferenceId: config.fileReferenceId,
            config: {
              type: "run-prompt",
              fileReferenceId: config.fileReferenceId,
              slug: "cim",
            },
          },
          {
            organizationId,
            projectId,
            fileReferenceId: config.fileReferenceId,
            config: {
              type: "llm-outputs",
              organizationId,
              projectId,
              fileReferenceId: config.fileReferenceId,
              processedFileId,
            },
          },
        ]);

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
        if (resp == null) {
          return;
        }

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

      case "gen-embeddings": {
        await this.generateEmbeddingsHandler.generateAndUpsertEmbeddings({
          textChunkGroupId: config.textChunkGroupId,
          projectId,
        });
        break;
      }

      case "llm-outputs": {
        await this.reportHandler.generateReport(config);
        break;
      }
      case "long-form": {
        LOGGER.warn("Generating skipping long form report");
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
          default:
            assertNever(config.analysis.type);
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
        await this.promptRunnerHandler.run(config.fileReferenceId, config.slug);
        break;
      }

      default:
        assertNever(config);
    }
  }
}
