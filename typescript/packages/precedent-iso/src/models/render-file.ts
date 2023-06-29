import { WorkBook } from "xlsx";

import { ISOSheet } from "../process-work-book";
import { AnalyzeOutput } from "./excel";
import { Report } from "./llm-outputs";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Render {
  export interface PDFFile {
    type: "pdf";
    signedUrl: string;
    report: Report | undefined;
    derived:
      | {
          parsed: WorkBook;
          sheets: ISOSheet<any>[];
          output: AnalyzeOutput | undefined;
        }
      | undefined;
  }

  export type File = PDFFile | ExcelFile;

  export interface ExcelFile {
    type: "excel";
    parsed: WorkBook;
    sheets: ISOSheet<any>[];
    output: AnalyzeOutput | undefined;
  }
}
