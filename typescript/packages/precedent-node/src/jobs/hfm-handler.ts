import { LOGGER } from "../logger";
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

    const kickoff = parseArgs(raw);
    if (!kickoff) {
      LOGGER.warn("Could not parse analysis for hfm");
      return;
    }

    const result = await this.mlService.hfm({
      ...kickoff,
      text,
    });

    debugger;

    console.log(kickoff, result);
  }
}

interface KickoffArgs {
  analysis: string[];
  personas: string[];
}

function parseArgs(raw: string): KickoffArgs | undefined {
  const splat = raw.split("\n");

  const lines = splat.filter(
    (line) => !line.startsWith("Here") && line.length > 0,
  );

  const seperator = lines.findIndex((line) => line === "___");
  if (seperator === -1) {
    return undefined;
  }
  const analysis = lines.slice(0, seperator).map(trimLine);
  const personas = lines.slice(seperator + 1).map(trimLine);
  return {
    analysis,
    personas,
  };
}

function trimLine(line: string): string {
  if (line.startsWith("- ")) {
    return line.slice(2).trim();
  }
  return line.trim();
}
