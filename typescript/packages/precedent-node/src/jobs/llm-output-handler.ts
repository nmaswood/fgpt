import {
  InsertMiscValue,
  MiscOutputStore,
} from "../llm-outputs/misc-output-store";
import { QuestionStore } from "../llm-outputs/question-store";
import { MLServiceClient } from "../ml/ml-service";
import { ShaHash } from "../sha-hash";
import { TextChunkStore } from "../text-chunk-store";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace LLMOutputHandler {
  export interface Arguments {
    textChunkId: string;
    organizationId: string;
    projectId: string;
    fileReferenceId: string;
    processedFileId: string;
    textChunkGroupId: string;
  }
}

export interface LLMOutputHandler {
  generateReport: (args: LLMOutputHandler.Arguments) => Promise<void>;
}

export class LLMOutputHandlerImpl implements LLMOutputHandler {
  constructor(
    private readonly mlService: MLServiceClient,
    private readonly textChunkStore: TextChunkStore,
    private readonly questionStore: QuestionStore,
    private readonly miscOutputStore: MiscOutputStore
  ) {}

  async generateReport(config: LLMOutputHandler.Arguments): Promise<void> {
    const { textChunkId } = config;
    const chunk = await this.textChunkStore.getTextChunkById(textChunkId);
    const { summaries, questions, financialSummary, terms } =
      await this.mlService.llmOutput({
        text: chunk.chunkText,
      });

    const values: InsertMiscValue[] = [];
    if (
      financialSummary.financialSummaries.length > 0 ||
      financialSummary.investmentMerits.length > 0 ||
      financialSummary.investmentRisks.length > 0
    ) {
      values.push({
        ...config,
        value: {
          type: "financial_summary",
          value: financialSummary,
        },
      });
    }
    if (summaries.length > 0) {
      values.push({
        ...config,
        value: {
          type: "summary",
          value: summaries,
        },
      });
    }

    if (terms.length > 0) {
      values.push({
        ...config,
        value: {
          type: "terms",
          value: terms,
        },
      });
    }

    await this.miscOutputStore.insertMany(values);

    await this.questionStore.insertMany(
      questions.map((question) => ({
        ...config,
        question,
        hash: ShaHash.forData(question),
      }))
    );

    await this.textChunkStore.incrementLlmOutputChunkSeen(
      config.textChunkGroupId
    );
  }
}
