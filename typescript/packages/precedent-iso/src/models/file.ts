import { z } from "zod";

export interface FileReference {
  id: string;
  fileName: string;
  organizationId: string;
  projectId: string;
  contentType: string;
  path: string;
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

export type Progress = z.infer<typeof ZProgress>;

export const ZProgress = z.object({
  value: z.number().min(0),
  total: z.number(),
});
