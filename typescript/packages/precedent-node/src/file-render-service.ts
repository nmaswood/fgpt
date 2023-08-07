import {
  AnalyzeOutput,
  assertNever,
  ExcelOutputToRender,
  FileReference,
  FileToRender,
  getFileType,
} from "@fgpt/precedent-iso";
import { parse } from "path";

import { ExcelAssetStore } from "./excel-asset-store";
import { ExcelOutputStore } from "./excel-output-store";
import { FileReferenceStore } from "./file-reference-store";
import { ReportService } from "./llm-outputs/report-service";
import { ObjectStorageService } from "./object-store/object-store";
import { ProjectStore } from "./project-store";

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
    private readonly projectStore: ProjectStore,
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
    const [output, signedUrl, project] = await Promise.all([
      this.excelOutputStore.forDirectUpload(file.id),
      this.objectStorageService.getSignedUrl(
        file.bucketName,
        file.path,
        file.fileName,
      ),
      this.projectStore.get(file.projectId),
    ]);
    return {
      type: "excel",
      id: file.id,
      fileName: file.fileName,
      projectName: project?.name ?? file.projectId,
      signedUrl,
      projectId: file.projectId,
      output: transformOutput(output.map((row) => row.output)),
      status: file.status,
      description: file.description,
    };
  }

  async #forPDF(file: FileReference): Promise<FileToRender.PDFFile> {
    const [signedUrl, [derived], report, project] = await Promise.all([
      this.objectStorageService.getSignedUrl(
        file.bucketName,
        file.path,
        file.fileName,
      ),
      this.excelAssetStore.list(file.id),
      this.reportService.forFileReferenceId(file.id),
      this.projectStore.get(file.projectId),
    ]);

    return {
      type: "pdf",
      id: file.id,
      signedUrl,
      fileName: file.fileName,
      projectId: file.projectId,
      projectName: project?.name ?? file.projectId,
      report,
      derivedSignedUrl: derived
        ? await this.objectStorageService.getSignedUrl(
            derived.bucketName,
            derived.path,
            `${parse(file.fileName).name}.xlsx`,
          )
        : undefined,

      status: file.status,
      description: file.description,
    };
  }
}

function transformOutput(output: AnalyzeOutput[]): ExcelOutputToRender {
  return {
    claude: output
      .filter((row) => row.model === "claude")
      .flatMap((row) => row.value),
  };
}
