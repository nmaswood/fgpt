import { assertNever, IngestFileConfig } from "@fgpt/precedent-iso";

import { TaskStore } from "../task-store";

export interface IngestFileHandler {
  dispatch: (config: IngestFileConfig) => Promise<void>;
}

export class IngestFileHandlerImpl implements IngestFileHandler {
  constructor(private readonly taskStore: TaskStore) {}

  async dispatch({
    organizationId,
    projectId,
    fileReferenceId,
    fileType,
  }: IngestFileConfig): Promise<void> {
    switch (fileType) {
      case "pdf": {
        await this.taskStore.insertMany([
          {
            organizationId,
            projectId,
            fileReferenceId,
            config: {
              type: "thumbnail",
              fileReferenceId,
            },
          },
          {
            organizationId,
            projectId,
            fileReferenceId,
            config: {
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
              organizationId,
              projectId,
              type: "extract-table",
              fileReferenceId,
            },
          },
        ]);
        break;
      }
      case "excel": {
        await this.taskStore.insert({
          organizationId,
          projectId,
          fileReferenceId,
          config: {
            type: "analyze-table",
            organizationId,
            projectId,
            fileReferenceId,
            source: {
              type: "direct-upload",
            },
            analysis: {
              type: "text",
              model: "claude",
            },
          },
        });
        break;
      }
      default:
        assertNever(fileType);
    }
  }
}
