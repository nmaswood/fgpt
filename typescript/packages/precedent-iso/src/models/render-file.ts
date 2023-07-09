import { AnalyzeOutput } from "./excel";
import { Report } from "./llm-outputs";
import {
  FileProgress,
  ProgressForExcelTasks,
  ProgressForPdfTasks,
} from "./progress";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace FileToRender {
  export interface DerivedTable {
    signedUrl: string | undefined;
    output: AnalyzeOutput | undefined;
  }

  export interface PDFFile {
    type: "pdf";
    id: string;
    signedUrl: string;
    report: Report | undefined;
    projectId: string;
    derived: DerivedTable | undefined;
    progress: FileProgress<ProgressForPdfTasks>;
  }

  export type File = PDFFile | ExcelFile;

  export interface ExcelFile {
    type: "excel";
    id: string;
    projectId: string;
    signedUrl: string;
    output: AnalyzeOutput | undefined;
    progress: FileProgress<ProgressForExcelTasks>;
  }
}
