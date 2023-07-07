import { TaskStore } from "./task-store";

export interface ExcelOutputProgress {
  analyze: "pending" | "in-progress" | "complete";
}

export interface ExcelOutputProgressStore {
  getProgress(processedFileId: string): Promise<ExcelOutputProgress>;
}

export class PSqlExcelOutputProgressStore implements ExcelOutputProgressStore {
  constructor(private readonly taskStore: TaskStore) {}
  async getProgress(fileReferenceId: string): Promise<ExcelOutputProgress> {
    const tasks = await this.taskStore.getByFileReferenceId(fileReferenceId);
    console.log(tasks);
    return undefined!;
  }
}
