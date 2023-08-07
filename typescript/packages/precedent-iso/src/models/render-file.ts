import { FileType } from "../file-type";
import { AnalyzeResponseChunk } from "./excel";
import { FileStatus } from "./file";
import { Report } from "./llm-outputs";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace FileToRender {
  export interface PDFFile {
    type: "pdf";
    id: string;
    signedUrl: string;
    report: Report | undefined;
    projectId: string;
    projectName: string;
    fileName: string;
    derivedSignedUrl: string | undefined;
    status: FileStatus;
    description: string | undefined;
  }

  export type File = PDFFile | ExcelFile;

  export interface ExcelFile {
    type: "excel";
    id: string;
    projectId: string;
    projectName: string;
    fileName: string;
    signedUrl: string;
    output: ExcelOutputToRender;
    status: FileStatus;

    description: string | undefined;
  }
}

export interface ExcelOutputToRender {
  claude: AnalyzeResponseChunk[];
}

export interface DisplayFile {
  signedUrl: string;
  type: FileType | undefined;
}
