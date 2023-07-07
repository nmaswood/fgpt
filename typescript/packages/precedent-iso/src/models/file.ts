export interface FileReference {
  id: string;
  fileName: string;
  organizationId: string;
  projectId: string;
  contentType: string;
  path: string;
  bucketName: string;
  createdAt: Date;
}

export interface LoadedFile {
  id: string;
  fileName: string;
  fileSize: number | undefined;
  createdAt: Date;
  contentType: string;
  extractedTextLength: number | undefined;
  gpt4TokenLength: number | undefined;
  fullyChunked: boolean;
  fullyEmbedded: boolean;
}
