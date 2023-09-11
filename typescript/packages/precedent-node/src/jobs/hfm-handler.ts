import { IngestFileConfig } from "@fgpt/precedent-iso";

import { ProcessedFileStore } from "../processed-file-store";

export interface HFMHandler {
  dispatch: (config: IngestFileConfig) => Promise<void>;
}

export class HFMHandlerImpl implements HFMHandler {
  constructor(private readonly processedFileStore: ProcessedFileStore) {}

  async dispatch({ fileReferenceId }: IngestFileConfig): Promise<void> {
    const processedFile =
      await this.processedFileStore.getByFileReferenceId(fileReferenceId);

    const text = await this.processedFileStore.getText(processedFile.id);
    console.log(text);
  }
}
