export interface ExcelOutputProgress {
  analyze: "pending" | "in-progress" | "complete";
}

export interface ExcelOutputProgressStore {
  getProgress(processedFileId: string): Promise<ExcelOutputProgress>;
  setAnalyzeTableTaskId(processedFileId: string, taskId: string): Promise<void>;
}

export class PSqlExcelOutputProgressStore implements ExcelOutputProgressStore {
  async getProgress(_: string): Promise<ExcelOutputProgress> {
    throw new Error("not implemented");
  }
  async setAnalyzeTableTaskId(_: string, __: string): Promise<void> {
    throw new Error("not implemented");
  }
}
