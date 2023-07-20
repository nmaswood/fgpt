import { FileReferenceStore } from "../file-reference-store";
import { MLServiceClient } from "../ml/ml-service";
import { ProcessedFileStore } from "../processed-file-store";

export interface ScanHandlerArguments {
  fileReferenceId: string;
  processedFileId: string;
}
export interface ScanHandler {
  scan: (args: ScanHandlerArguments) => Promise<void>;
}

export class ScanHandlerImpl implements ScanHandler {
  constructor(
    private readonly client: MLServiceClient,
    private readonly fileReferenceStore: FileReferenceStore,
    private readonly processedFileStore: ProcessedFileStore,
  ) {}

  async scan({
    fileReferenceId,
    processedFileId,
  }: ScanHandlerArguments): Promise<void> {
    const { fileName } = await this.fileReferenceStore.get(fileReferenceId);
    // todo truncate
    const text = await this.processedFileStore.getText(processedFileId);
    const { description } = await this.client.scan({
      text,
      fileName,
    });

    await this.fileReferenceStore.update({
      id: fileReferenceId,
      description,
    });
  }
}
