import { MLServiceClient } from "../ml/ml-service";
import { ProcessedFileStore } from "../processed-file-store";

import { PromptService } from "../prompt/prompt-service";

const DOCUMENT_KEY = "paredo_document" as const;

export interface HFMHandler {
  run: (fileReferenceId: string) => Promise<void>;
}

export class HFMHandlerImpl implements HFMHandler {
  constructor(
    private readonly promptService: PromptService,
    private readonly processedFileStore: ProcessedFileStore,
    private readonly mlService: MLServiceClient,
  ) {}

  async run(fileReferenceId: string): Promise<void> {
    const processedFile =
      await this.processedFileStore.getByFileReferenceId(fileReferenceId);
    const text = await this.processedFileStore.getText(processedFile.id);

    const { raw } = await this.promptService.run({
      model: "claude-2",
      organizationId: processedFile.organizationId,
      slug: "hfm",
      args: {
        [DOCUMENT_KEY]: text,
      },
    });
    this.mlService;
    console.log(raw);
  }
}
