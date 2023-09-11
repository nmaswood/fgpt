import { ProcessedFileStore } from "../processed-file-store";

export interface HFMHandler {
  run: (fileReferenceId: string) => Promise<void>;
}

export interface HFMArgs {
  processedFileId: string;
}

export class HFMHandlerImpl implements HFMHandler {
  constructor(private readonly processedFileStore: ProcessedFileStore) {}

  async run(_: string): Promise<void> {
    this.processedFileStore;

    //const processedFile =
    //await this.processedFileStore.getByFileReferenceId(fileReferenceId);
    //await this.processedFileStore.getText(processedFile.id);
  }
}
