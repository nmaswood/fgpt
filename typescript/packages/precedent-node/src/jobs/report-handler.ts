import { chunk } from "lodash";

import {
  InsertMiscValue,
  MiscOutputStore,
} from "../llm-outputs/misc-output-store";
import { QuestionStore } from "../llm-outputs/question-store";
import { LOGGER } from "../logger";
import { LongFormResponse, MLReportService } from "../ml/ml-report-service";
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
  generateLongFormReport: (args: ReportHandler.Arguments) => Promise<void>;
}

export class ReportHandlerImpl implements ReportHandler {
  constructor(
    private readonly mlReportService: MLReportService,
    private readonly textChunkStore: TextChunkStore,
    private readonly questionStore: QuestionStore,
    private readonly miscOutputStore: MiscOutputStore,
  ) {}

  async generateLongFormReport(config: ReportHandler.Arguments): Promise<void> {
    const { textChunkGroupId, textChunkIds } = config;
    const acc: {
      value: LongFormResponse;
      textChunkId: string;
    }[] = [];

    for (const textChunkId of textChunkIds) {
      const chunk = await this.textChunkStore.getTextChunkById(textChunkId);

      const value = await this.mlReportService.longForm({
        text: chunk.chunkText,
      });

      acc.push({
        value,
        textChunkId,
      });
    }

    await this.miscOutputStore.insertMany(
      acc.map((row) => ({
        textChunkId: row.textChunkId,
        organizationId: config.organizationId,
        projectId: config.projectId,
        fileReferenceId: config.fileReferenceId,
        processedFileId: config.processedFileId,
        textChunkGroupId,
        value: {
          type: "long_form",
          value: row.value.raw,
          sanitizedHtml: row.value.sanitizedHtml ?? undefined,
        },
      })),
    );
  }

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

    for (const groupOfIds of chunk(toProcess, 3)) {
      await Promise.all(
        groupOfIds.map((textChunkId) =>
          this.#generateReportForChunk({
            ...config,
            textChunkId,
          }),
        ),
      );
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

    const { questions, terms } = await this.mlReportService.llmOutput({
      text: chunk.chunkText,
    });

    const values: InsertMiscValue[] = [];

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
      })),
    );
  }
}
