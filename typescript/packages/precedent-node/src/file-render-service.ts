import {
  AnalyzeOutput,
  assertNever,
  FileReference,
  getFileType,
  Outputs,
  Render,
} from "@fgpt/precedent-iso";
import { WorkBook } from "xlsx";
import { read } from "xlsx";

import { ExcelAssetStore } from "./excel-asset-store";
import { ExcelOutputStore } from "./excel-output-store";
import { FileReferenceStore } from "./file-reference-store";
import { ReportService } from "./llm-outputs/report-service";
import { ObjectStorageService } from "./object-store/object-store";

export interface FileRenderService {
  forFile(
    fileReferenceId: string
  ): Promise<Render.File<WorkBook, AnalyzeOutput, Outputs.Report>>;
}

export class FileToRenderServiceImpl implements FileRenderService {
  constructor(
    private readonly fileReferenceStore: FileReferenceStore,
    private readonly reportService: ReportService,
    private readonly objectStorageService: ObjectStorageService,
    private readonly excelOutputStore: ExcelOutputStore,
    private readonly excelAssetStore: ExcelAssetStore
  ) {}

  async forFile(
    fileReferenceId: string
  ): Promise<Render.File<WorkBook, AnalyzeOutput, Outputs.Report>> {
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

  async #forExcel(
    file: FileReference
  ): Promise<Render.File<WorkBook, AnalyzeOutput, Outputs.Report>> {
    const output = await this.excelOutputStore.forDirectUpload(file.id);
    return {
      type: "excel",
      parsed: await this.#fetchExcel(file.bucketName, file.path),
      output: output?.output,
    };
  }

  async #forPDF(
    file: FileReference
  ): Promise<Render.File<WorkBook, AnalyzeOutput, Outputs.Report>> {
    const [signedUrl, [derived], report, output] = await Promise.all([
      this.objectStorageService.getSignedUrl(file.bucketName, file.path),
      this.excelAssetStore.list(file.id),
      this.reportService.forFileReferenceId(file.id),
      this.excelOutputStore.forDerived(file.id),
    ]);

    return {
      type: "pdf",
      signedUrl,
      report,
      derived: derived
        ? {
            parsed: await this.#fetchExcel(derived.bucketName, derived.path),
            output: output?.output,
          }
        : undefined,
    };
  }

  async #fetchExcel(bucketName: string, path: string) {
    const blob = await this.objectStorageService.download(bucketName, path);
    return read(blob);
  }
}
