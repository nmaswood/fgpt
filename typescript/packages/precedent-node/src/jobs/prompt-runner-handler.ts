import { PromptSlug } from "@fgpt/precedent-iso";

import { MiscOutputStore } from "../llm-outputs/misc-output-store";
import { ProcessedFileStore } from "../processed-file-store";
import { PromptService } from "../prompt/prompt-service";

export interface RunArgs {
  fileReferenceId: string;
  slug: PromptSlug;
}

export interface PromptRunnerHandler {
  run(args: RunArgs): Promise<void>;
}

const DOCUMENT_KEY = "paredo_document" as const;

export class PromptRunnerHandlerImpl implements PromptRunnerHandler {
  constructor(
    private readonly promptService: PromptService,
    private readonly miscOutputStore: MiscOutputStore,
    private readonly processedFileStore: ProcessedFileStore,
  ) {}

  async run({ fileReferenceId, slug }: RunArgs): Promise<void> {
    const processedFile = await this.processedFileStore.getByFileReferenceId(
      fileReferenceId,
    );

    const text = await this.processedFileStore.getText(processedFile.id);

    const { raw, html } = await this.promptService.run({
      organizationId: processedFile.organizationId,
      slug,
      args: {
        [DOCUMENT_KEY]: text,
      },
    });
    console.log({ raw, html, store: this.miscOutputStore });
  }
}
