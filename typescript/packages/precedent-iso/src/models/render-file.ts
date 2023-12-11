import { FileType } from "../file-type";
import { AnalyzeResponseChunk } from "./excel";
import { FileStatus } from "./file";
import { Report } from "./llm-outputs";
import { TaskStatus } from "./task";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace FileToRender {
  export interface PDFFile {
    type: "pdf";
    id: string;
    signedUrl: string;
    report: Report;
    projectId: string;
    projectName: string;
    fileName: string;
    derivedSignedUrl: string | undefined;
    status: FileStatus;
    description: string | undefined;
    statusForPrompts: StatusForPrompts;
  }

  export type File = PDFFile | ExcelFile;

  export interface ExcelFile {
    type: "excel";
    id: string;
    projectId: string;
    projectName: string;
    fileName: string;
    signedUrl: string;
    output: AnalyzeResponseChunk[];
    status: FileStatus;

    description: string | undefined;
  }
}

export interface DisplayFile {
  signedUrl: string;
  type: FileType | undefined;
}

export type StatusForPrompt = TaskStatus | "not_created";
export interface StatusForPrompts {
  cim: StatusForPrompt;
  kpi: StatusForPrompt;
  business_model: StatusForPrompt;
  expense_drivers: StatusForPrompt;
  ebitda_adjustments: StatusForPrompt;
  hfm: StatusForPrompt;
}
