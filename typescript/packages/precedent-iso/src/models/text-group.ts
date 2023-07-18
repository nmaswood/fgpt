export interface TextChunkGroup {
  id: string;
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  processedFileId: string;
  numChunks: number;
}

export interface TextChunk {
  id: string;
  organizationId: string;
  projectId: string;
  fileReferenceId: string;
  processedFileId: string;
  textChunkGroupId: string;
  chunkOrder: number;
  chunkText: string;
  hasEmbedding: boolean;
}
