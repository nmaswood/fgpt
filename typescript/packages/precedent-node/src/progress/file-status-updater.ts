import { assertNever, getFileType } from "@fgpt/precedent-iso";

import { FileReferenceStore } from "../file-reference-store";
import { ExcelProgressService } from "./excel-asset-progress-store";
import { ProcessedFileProgressService } from "./processed-file-progress-store";

export interface FileStatusUpdater {
  update: (fileReferenceId: string) => Promise<void>;
}

// TODO solve race condition
export class FileStatusUpdaterImpl implements FileStatusUpdater {
  constructor(
    private readonly fileReferenceStore: FileReferenceStore,
    private readonly processedFileProgressStore: ProcessedFileProgressService,
    private readonly ExcelProgressStore: ExcelProgressService,
    private readonly longFormReport: boolean,
  ) {}

  async update(fileReferenceId: string) {
    const status = await this.#status(fileReferenceId);
    await this.fileReferenceStore.update({
      id: fileReferenceId,
      status,
    });
  }

  async #status(fileReferenceId: string) {
    const file = await this.fileReferenceStore.get(fileReferenceId);
    const type = getFileType(file.contentType);
    switch (type) {
      case "excel": {
        const excelProgress = await this.ExcelProgressStore.getProgress(
          fileReferenceId,
        );
        return excelProgress.status;
      }
      case "pdf": {
        const processedFileProgress =
          await this.processedFileProgressStore.getProgress(
            { longFormReport: this.longFormReport },
            fileReferenceId,
          );

        return processedFileProgress.status;
      }
      case undefined:
        throw new Error("unknown file");
      default:
        assertNever(type);
    }
  }
}
