// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Render {
  export interface PDFFile<WorkBook, ExcelAnalysis, ReportForPDF> {
    type: "pdf";
    signedUrl: string;
    report: ReportForPDF | undefined;
    derived:
      | {
          parsed: WorkBook;
          output: ExcelAnalysis | undefined;
        }
      | undefined;
  }

  export type File<WorkBook, ExcelAnalysis, ReportForPDF> =
    | PDFFile<WorkBook, ExcelAnalysis, ReportForPDF>
    | ExcelFile<WorkBook, ExcelAnalysis>;

  export interface ExcelFile<WorkBook, ExcelAnalysis> {
    type: "excel";
    parsed: WorkBook;
    output: ExcelAnalysis | undefined;
  }

  export interface Data<WorkBook, ExcelAnalysis, ReportForPDF> {
    status: "maybeLoading" | "timed" | "complete";
    file: File<WorkBook, ExcelAnalysis, ReportForPDF>;
  }
}
