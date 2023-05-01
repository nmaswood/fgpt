export interface ChunkPostSummary {
  id: string;
  summary_id: string;
  content: string;
  embedding: object;
}

export interface ChunkPostSummary {
  insert(chunk: ChunkPostSummary): Promise<void>;
}
