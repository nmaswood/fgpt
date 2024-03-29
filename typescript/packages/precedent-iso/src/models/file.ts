import { z } from "zod";

import { FileType } from "../file-type";
import { TrafficLightAnswer } from "./common";

export const ZFileStatus = z.enum(["pending", "ready", "error"]);
export type FileStatus = z.infer<typeof ZFileStatus>;

export interface FileReference {
  id: string;
  fileName: string;
  organizationId: string;
  projectId: string;
  contentType: string;
  path: string;
  bucketName: string;
  createdAt: Date;
  status: FileStatus;
  description: string | undefined;
  fileSize: number | undefined;
}

export interface LoadedFile {
  id: string;
  fileName: string;
  createdAt: Date;
  fileType: FileType | undefined;
  status: FileStatus;
  description: string | undefined;
}

export const ZFileUpload = z.object({
  name: z.string(),
  storageUrl: z.string(),
  projectId: z.string(),
  fileSize: z.number(),
  contentType: z.string(),
});

export interface FileReferenceMetadata {
  tags: string[];
  isFinancialDocument: TrafficLightAnswer | undefined;
  isCim: TrafficLightAnswer | undefined;
}
