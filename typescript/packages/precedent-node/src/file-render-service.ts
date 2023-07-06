import {
  assertNever,
  FileReference,
  FileToRender,
  getFileType,
  processWorkBook,
} from "@fgpt/precedent-iso";
import { read } from "xlsx";

import { ExcelAssetStore } from "./excel-asset-store";
import { ExcelOutputStore } from "./excel-output-store";
import { FileReferenceStore } from "./file-reference-store";
import { ReportService } from "./llm-outputs/report-service";
import { ObjectStorageService } from "./object-store/object-store";

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

  async #forExcel(file: FileReference): Promise<FileToRender.File> {
    const output = await this.excelOutputStore.forDirectUpload(file.id);
    const parsed = await this.#fetchExcel(file.bucketName, file.path);

    const signedUrl = await this.objectStorageService.getSignedUrl(
      file.bucketName,
      file.path,
    );
    return {
      type: "excel",
      signedUrl,
      projectId: file.projectId,
      parsed,
      sheets: processWorkBook(parsed.Sheets),
      output: output?.output,
    };
  }

  async #forPDF(file: FileReference): Promise<FileToRender.File> {
    const [signedUrl, [derived], report, output] = await Promise.all([
      this.objectStorageService.getSignedUrl(file.bucketName, file.path),
      this.excelAssetStore.list(file.id),
      this.reportService.forFileReferenceId(file.id),
      this.excelOutputStore.forDerived(file.id),
    ]);

    return {
      type: "pdf",
      signedUrl,
      projectId: file.projectId,
      report,
      derived: derived
        ? await (async () => {
            const parsed = await this.#fetchExcel(
              derived.bucketName,
              derived.path,
            );
            return {
              parsed,
              sheets: processWorkBook(parsed.Sheets),
              output: output?.output,
            };
          })()
        : undefined,
    };
  }

  async #fetchExcel(bucketName: string, path: string) {
    const blob = await this.objectStorageService.download(bucketName, path);
    return read(blob);
  }
}
