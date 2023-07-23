import {
  AnalyzeOutput,
  assertNever,
  ExcelOutputToRender,
  FileReference,
  FileToRender,
  getFileType,
} from "@fgpt/precedent-iso";

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
      this.objectStorageService.getSignedUrl(file.bucketName, file.path),
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
    };
  }

  async #forPDF(file: FileReference): Promise<FileToRender.PDFFile> {
    const [signedUrl, [derived], report, output, project] = await Promise.all([
      this.objectStorageService.getSignedUrl(file.bucketName, file.path),
      this.excelAssetStore.list(file.id),
      this.reportService.forFileReferenceId(file.id),
      this.excelOutputStore.forDerived(file.id),
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
      derived: derived
        ? await (async () => {
            const signedUrl = await this.objectStorageService.getSignedUrl(
              derived.bucketName,
              derived.path,
            );
            return {
              id: derived.id,
              signedUrl,
              output: transformOutput(output.map((row) => row.output)),
            };
          })()
        : undefined,
    };
  }
}

function transformOutput(output: AnalyzeOutput[]): ExcelOutputToRender {
  const acc: ExcelOutputToRender = {
    gpt: [],
    claude: [],
  };
  for (const row of output) {
    switch (row.model) {
      case "gpt":
        acc.gpt.push(...row.value);
        break;
      case "claude":
        acc.claude.push(...row.value);
        break;

      default:
        assertNever(row.model);
    }
  }

  return acc;
}
