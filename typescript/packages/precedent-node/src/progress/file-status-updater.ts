import {
  assertNever,
  FileProgress,
  getFileType,
  ProgressForExcelTasks,
  ProgressForPdfTasks,
} from "@fgpt/precedent-iso";

import { FileReferenceStore } from "../file-reference-store";
import { ExcelProgressService } from "./excel-asset-progress-store";
import { ProcessedFileProgressService } from "./processed-file-progress-store";

export interface FileStatusService {
  update: (fileReferenceId: string) => Promise<void>;
  progress: (
    fileReferenceId: string,
  ) => Promise<FileProgress<ProgressForPdfTasks | ProgressForExcelTasks>>;
}

// TODO solve race condition
export class FileStatusServiceImpl implements FileStatusService {
  constructor(
    private readonly fileReferenceStore: FileReferenceStore,
    private readonly processedFileProgressStore: ProcessedFileProgressService,
    private readonly excelProgressStore: ExcelProgressService,
    private readonly longFormReport: boolean,
  ) {}

  async update(fileReferenceId: string) {
    const progress = await this.progress(fileReferenceId);

    await this.fileReferenceStore.update({
      id: fileReferenceId,
      status: progress.status,
    });
  }

  async progress(fileReferenceId: string) {
    const file = await this.fileReferenceStore.get(fileReferenceId);
    const type = getFileType(file.contentType);
    switch (type) {
      case "excel": {
        const excelProgress = await this.excelProgressStore.getProgress(
          fileReferenceId,
        );
        return excelProgress;
      }
      case "pdf": {
        const processedFileProgress =
          await this.processedFileProgressStore.getProgress(
            { longFormReport: this.longFormReport },
            fileReferenceId,
          );

        return processedFileProgress;
      }
      case undefined:
        throw new Error("unknown file type");
      default:
        assertNever(type);
    }
  }
}
