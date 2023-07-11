import {
  assertNever,
  FileReference,
  FileToRender,
  getFileType,
} from "@fgpt/precedent-iso";

import { ExcelProgressStore } from "./excel-asset-progress-store";
import { ExcelAssetStore } from "./excel-asset-store";
import { ExcelOutputStore } from "./excel-output-store";
import { FileReferenceStore } from "./file-reference-store";
import { ReportService } from "./llm-outputs/report-service";
import { ObjectStorageService } from "./object-store/object-store";
import { ProcessedFileProgressStore } from "./processed-file-progress-store";

export interface FileRenderService {
  forFile(fileReferenceId: string): Promise<FileToRender.File>;
}

export class FileToRenderServiceImpl implements FileRenderService {
  constructor(
    private readonly fileReferenceStore: FileReferenceStore,
    private readonly reportService: ReportService,
    private readonly objectStorageService: ObjectStorageService,
    private readonly excelOutputStore: ExcelOutputStore,
    private readonly excelAssetStore: ExcelAssetStore,
    private readonly pdfProgressStore: ProcessedFileProgressStore,
    private readonly excelProgressStore: ExcelProgressStore,
  ) {}

  async forFile(fileReferenceId: string): Promise<FileToRender.File> {
    const file = await this.fileReferenceStore.get(fileReferenceId);
    const fileType = getFileType(file.contentType);

    switch (fileType) {
      case "excel":
        return this.#forExcel(file);
      case "pdf":
        return this.#forPDF(file);
      case undefined:
        throw new Error("File type is undefined");
      default:
        assertNever(fileType);
    }
  }

  async #forExcel(file: FileReference): Promise<FileToRender.ExcelFile> {
    const [output, signedUrl, progress] = await Promise.all([
      this.excelOutputStore.forDirectUpload(file.id),
      this.objectStorageService.getSignedUrl(file.bucketName, file.path),
      this.excelProgressStore.getProgress(file.id),
    ]);
    return {
      type: "excel",
      id: file.id,
      signedUrl,
      projectId: file.projectId,
      output: output?.output,
      progress,
    };
  }

  async #forPDF(file: FileReference): Promise<FileToRender.PDFFile> {
    const [signedUrl, [derived], report, output, progress] = await Promise.all([
      this.objectStorageService.getSignedUrl(file.bucketName, file.path),
      this.excelAssetStore.list(file.id),
      this.reportService.forFileReferenceId(file.id),
      this.excelOutputStore.forDerived(file.id),
      this.pdfProgressStore.getProgress(file.id),
    ]);

    return {
      type: "pdf",
      id: file.id,
      signedUrl,
      projectId: file.projectId,
      report,
      progress,
      derived: derived
        ? await (async () => {
            const signedUrl = await this.objectStorageService.getSignedUrl(
              derived.bucketName,
              derived.path,
            );
            return {
              id: derived.id,
              signedUrl,
              output: output?.output,
            };
          })()
        : undefined,
    };
  }
}