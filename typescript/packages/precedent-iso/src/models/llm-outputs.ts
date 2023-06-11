export interface Summary {
  id: string;
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  processedFileId: string;
  textChunkId: string;
  textChunkGroupId: string;
  summary: string;
}
export interface Question {
  id: string;
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  processedFileId: string;
  textChunkId: string;
  textChunkGroupId: string;
  question: string;
}
export interface Metrics {
  id: string;
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  processedFileId: string;
  textChunkId: string;
  textChunkGroupId: string;
  value: string | undefined;
  description: string | undefined;
}

export interface Metric {
  description: string;
  value: string;
}

export interface Outputs {
  summaries: Summary[];
  questions: Question[];
  metrics: Metric[];
}
