import { RenderShowCaseFile } from "@fgpt/precedent-iso";

import { FileReferenceStore } from "./file-reference-store";
import { ObjectStorageService } from "./object-store/object-store";
import { ShowCaseFileStore } from "./show-case-file-store";

export interface RenderShowCaseFileService {
  get: (projectId: string) => Promise<RenderShowCaseFile.File>;
}

export class RenderShowCaseFileServiceImpl
  implements RenderShowCaseFileService
{
  constructor(
    private readonly showCaseFileStore: ShowCaseFileStore,
    private readonly objectStore: ObjectStorageService,
    private readonly fileReferenceStore: FileReferenceStore,
    private readonly bucket: string,
  ) {}

  async get(projectId: string): Promise<RenderShowCaseFile.File> {
    const showCaseFile = await this.showCaseFileStore.get(projectId);
    if (!showCaseFile) {
      return RenderShowCaseFile.NOT_SET;
    }
    const path = await this.fileReferenceStore.getThumbnailPath(
      showCaseFile.fileReferenceId,
    );
    if (!path) {
      return {
        type: "set",
        url: undefined,
        fileReferenceId: showCaseFile.fileReferenceId,
      };
    }
    const value = await this.objectStore.getSignedUrl(this.bucket, path);

    return {
      type: "set",
      url: value,
      fileReferenceId: showCaseFile.fileReferenceId,
    };
  }
}
