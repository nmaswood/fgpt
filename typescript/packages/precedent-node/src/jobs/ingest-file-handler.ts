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
      case "pdf":
        await this.taskStore.insert({
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
        });
        break;
      case "excel": {
        await this.taskStore.insert({
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
          },
        });
        break;
      }
      default:
        assertNever(fileType);
    }
  }
}
