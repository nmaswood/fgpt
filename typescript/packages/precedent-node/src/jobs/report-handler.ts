import { chunk } from "lodash";

import { MiscOutputStore } from "../llm-outputs/misc-output-store";
import { QuestionStore } from "../llm-outputs/question-store";
import { LOGGER } from "../logger";
import { MLReportService } from "../ml/ml-report-service";
import { ShaHash } from "../sha-hash";
import { TextChunkStore } from "../text-chunk-store";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ReportHandler {
  export interface Arguments {
    organizationId: string;
    projectId: string;
    fileReferenceId: string;
    processedFileId: string;
    textChunkGroupId: string;
    textChunkIds: string[];
  }
}

export interface ReportHandler {
  generateReport: (args: ReportHandler.Arguments) => Promise<void>;
}

const CHUNK_LIMIT = 2;
export class ReportHandlerImpl implements ReportHandler {
  constructor(
    private readonly mlReportService: MLReportService,
    private readonly textChunkStore: TextChunkStore,
    private readonly questionStore: QuestionStore,
    private readonly miscOutputStore: MiscOutputStore,
  ) {}

  async generateReport(config: ReportHandler.Arguments): Promise<void> {
    const { textChunkGroupId } = config;

    const allChunkIdsSeen = new Set(
      await this.miscOutputStore.textChunkIdsPresent(textChunkGroupId),
    );

    const toProcess = config.textChunkIds.filter(
      (id) => !allChunkIdsSeen.has(id),
    );

    LOGGER.info(
      `Skipping ${allChunkIdsSeen.size} chunks as they have already been processed`,
    );

    let seenError = false;
    for (const groupOfIds of chunk(toProcess, CHUNK_LIMIT)) {
      const result = await Promise.allSettled(
        groupOfIds.map((textChunkId) =>
          this.#generateReportForChunk({
            ...config,
            textChunkId,
          }),
        ),
      );

      seenError = seenError || result.some((r) => r.status === "rejected");
    }
    if (seenError) {
      throw new Error("Failed to generate report for some chunks");
    }
  }

  async #generateReportForChunk(config: {
    textChunkId: string;
    organizationId: string;
    projectId: string;
    fileReferenceId: string;
    processedFileId: string;
    textChunkGroupId: string;
  }): Promise<void> {
    const { textChunkId } = config;
    const chunk = await this.textChunkStore.getTextChunkById(textChunkId);

    const [questions, terms] = await Promise.all([
      this.mlReportService.generateQuestions(chunk.chunkText),
      this.mlReportService.generateTerms(chunk.chunkText),
    ]);

    if (terms.length > 0) {
      await this.miscOutputStore.insertMany([
        {
          ...config,
          value: {
            type: "terms",
            value: terms,
            order: chunk.chunkOrder,
          },
        },
      ]);
    }

    await this.questionStore.insertMany(
      questions.map((question) => ({
        ...config,
        question,
        hash: ShaHash.forData(question),
      })),
    );
  }
}
