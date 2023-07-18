import { getFileType } from "@fgpt/precedent-iso";
import path from "path";

import { FileReferenceStore } from "../file-reference-store";
import { ThumbnailService } from "../ml/thumbnail-service";

export interface ThumbnailHandler {
  forPdf: (fileReferenceId: string) => Promise<void>;
}

export class ThumbnailHandlerImpl implements ThumbnailHandler {
  constructor(
    private readonly fileReferenceStore: FileReferenceStore,
    private readonly thumbnailService: ThumbnailService,
  ) {}

  async forPdf(fileReferenceId: string): Promise<void> {
    const file = await this.fileReferenceStore.get(fileReferenceId);
    const fileType = getFileType(file.contentType);
    if (fileType !== "pdf") {
      throw new Error("file is not a pdf");
    }

    const { objectPath } = await this.thumbnailService.forPdf({
      bucket: file.bucketName,
      objectPath: file.path,
      outputPrefix: path.join(
        "user-uploads",
        file.organizationId,
        file.projectId,
        file.id,
        "thumbnail",
      ),
    });

    await this.fileReferenceStore.setThumbnailPath(file.id, objectPath);
  }
}
