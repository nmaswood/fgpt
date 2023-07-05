import { WorkBook } from "xlsx";

import { ISOSheet } from "../process-work-book";
import { AnalyzeOutput } from "./excel";
import { Report } from "./llm-outputs";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace FileToRender {
  export interface DerivedTable {
    parsed: WorkBook;
    sheets: ISOSheet<any>[];
    output: AnalyzeOutput | undefined;
  }

  export interface PDFFile {
    type: "pdf";
    signedUrl: string;
    report: Report | undefined;
    projectId: string;
    derived: DerivedTable | undefined;
  }

  export type File = PDFFile | ExcelFile;

  export interface ExcelFile {
    type: "excel";
    projectId: string;
    parsed: WorkBook;
    signedUrl: string;
    sheets: ISOSheet<any>[];
    output: AnalyzeOutput | undefined;
  }
}
