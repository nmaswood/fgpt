import { assertNever, IngestFileConfig } from "@fgpt/precedent-iso";

import { TaskStore } from "../task-store";

export type DispatchResponse =
  | {
      type: "pdf";
      textExtractionTaskId: string;
      extractTableTaskId: string;
    }
  | {
      type: "excel";
      analyzeTableTaskId: string;
    };

export interface IngestFileHandler {
  dispatch: (config: IngestFileConfig) => Promise<DispatchResponse>;
}

export class IngestFileHandlerImpl implements IngestFileHandler {
  constructor(private readonly taskStore: TaskStore) {}

  async dispatch({
    organizationId,
    projectId,
    fileReferenceId,
    fileType,
  }: IngestFileConfig): Promise<DispatchResponse> {
    switch (fileType) {
      case "pdf": {
        const tasks = await this.taskStore.insertMany([
          {
            organizationId,
            projectId,
            fileReferenceId,
            config: {
              version: "1",
              organizationId,
              projectId,
              type: "text-extraction",
              fileReferenceId,
            },
          },
          {
            organizationId,
            projectId,
            fileReferenceId,
            config: {
              version: "1",
              organizationId,
              projectId,
              type: "extract-table",
              fileReferenceId,
            },
          },
        ]);

        const textExtractionTaskId = tasks.find(
          (task) => task.config.type === "text-extraction",
        )?.id;

        const extractTableTaskId = tasks.find(
          (task) => task.config.type === "extract-table",
        )?.id;

        if (!textExtractionTaskId || !extractTableTaskId) {
          throw new Error("illegal state");
        }

        return {
          type: "pdf",
          textExtractionTaskId,
          extractTableTaskId,
        };
      }
      case "excel": {
        const { id: analyzeTableTaskId } = await this.taskStore.insert({
          organizationId,
          projectId,
          fileReferenceId,
          config: {
            version: "1",
            type: "analyze-table",
            organizationId,
            projectId,
            fileReferenceId,
            source: {
              type: "direct-upload",
            },
            model: "gpt",
          },
        });

        return {
          type: "excel",
          analyzeTableTaskId,
        };
      }
      default:
        assertNever(fileType);
    }
  }
}
