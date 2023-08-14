import { PromptSlug } from "@fgpt/precedent-iso";

import { MiscOutputStore } from "../llm-outputs/misc-output-store";
import { ProcessedFileStore } from "../processed-file-store";
import { PromptService } from "../prompt/prompt-service";

export interface PromptRunnerHandler {
  run(fileReferenceId: string, slug: PromptSlug): Promise<void>;
}

const DOCUMENT_KEY = "paredo_document" as const;

export class PromptRunnerHandlerImpl implements PromptRunnerHandler {
  constructor(
    private readonly promptService: PromptService,
    private readonly miscOutputStore: MiscOutputStore,
    private readonly processedFileStore: ProcessedFileStore,
  ) {}

  async run(fileReferenceId: string, slug: PromptSlug): Promise<void> {
    const processedFile = await this.processedFileStore.getByFileReferenceId(
      fileReferenceId,
    );

    const text = await this.processedFileStore.getText(processedFile.id);

    const { raw, html } = await this.promptService.run({
      model: "claude-2",
      organizationId: processedFile.organizationId,
      slug,
      args: {
        [DOCUMENT_KEY]: text,
      },
    });

    await this.miscOutputStore.insert({
      organizationId: processedFile.organizationId,
      projectId: processedFile.projectId,
      fileReferenceId,
      processedFileId: processedFile.id,
      value: {
        type: "output",
        slug,
        raw,
        html,
      },
    });
  }
}
