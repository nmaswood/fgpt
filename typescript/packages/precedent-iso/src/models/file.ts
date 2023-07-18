import { FileType } from "../file-type";

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
  createdAt: Date;
  fileType: FileType | undefined;
}
