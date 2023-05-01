export interface Summary {
  id: string;
  raw_chunk_id: string;
  content: string;
  num_tokens: number;
  diff: number;
}

export interface SummaryStore {
  insert(summary: Summary): Promise<void>;
}
