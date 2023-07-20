import { AnalyzeResponseChunk } from "./excel";
import { Report } from "./llm-outputs";
import {
  FileProgress,
  ProgressForExcelTasks,
  ProgressForPdfTasks,
} from "./progress";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace FileToRender {
  export interface DerivedTable {
    id: string;
    signedUrl: string;
    output: ExcelOutputToRender;
  }

  export interface PDFFile {
    type: "pdf";
    id: string;
    signedUrl: string;
    report: Report | undefined;
    projectId: string;
    projectName: string;
    fileName: string;
    derived: DerivedTable | undefined;
    progress: FileProgress<ProgressForPdfTasks>;
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
    progress: FileProgress<ProgressForExcelTasks>;
  }
}

export interface ExcelOutputToRender {
  gpt: AnalyzeResponseChunk[];
  claude: AnalyzeResponseChunk[];
}
