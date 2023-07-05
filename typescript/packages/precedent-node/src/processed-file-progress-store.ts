export interface ProcessedFileProgress {
  chunking: "pending" | "in-progress" | "complete";
  upsertEmbeddings: "pending" | "in-progress" | "complete";
  extractTable: "pending" | "in-progress" | "complete";
  analyzeTable: "pending" | "in-progress" | "complete";
}

export interface ProcessedFileProgressStore {
  getProgress(processedFileId: string): Promise<ProcessedFileProgress>;
  setChunkingTaskGroupId(
    processedFileId: string,
    taskGroupId: string
  ): Promise<void>;
  setUpsertEmbeddingTaskId(
    processedFileId: string,
    taskId: string
  ): Promise<void>;
  setExtractTableTaskId(processedFileId: string, taskId: string): Promise<void>;
  setAnalyzeTableTaskId(processedFileId: string, taskId: string): Promise<void>;
}

export class PSqlProcessedFileProgressStore
  implements ProcessedFileProgressStore
{
  async getProgress(_: string): Promise<ProcessedFileProgress> {
    throw new Error("not implemented");
  }
  async setChunkingTaskGroupId(_: string, __: string): Promise<void> {
    throw new Error("not implemented");
  }

  async setUpsertEmbeddingTaskId(_: string, __: string): Promise<void> {
    throw new Error("not implemented");
  }

  async setExtractTableTaskId(_: string, __: string): Promise<void> {
    throw new Error("not implemented");
  }

  async setAnalyzeTableTaskId(_: string, __: string): Promise<void> {
    throw new Error("not implemented");
  }
}
