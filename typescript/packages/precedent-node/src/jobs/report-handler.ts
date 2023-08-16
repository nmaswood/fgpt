import { FileReferenceStore } from "../file-reference-store";
import { MiscOutputStore } from "../llm-outputs/misc-output-store";
import { QuestionStore } from "../llm-outputs/question-store";
import { MLReportService } from "../ml/ml-report-service";
import { ProcessedFileStore } from "../processed-file-store";
import { ShaHash } from "../sha-hash";

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace ReportHandler {
  export interface Arguments {
    fileReferenceId: string;
    processedFileId: string;
  }
}

export interface ReportHandler {
  generateReport: (args: ReportHandler.Arguments) => Promise<void>;
}

export class ReportHandlerImpl implements ReportHandler {
  constructor(
    private readonly mlReportService: MLReportService,
    private readonly questionStore: QuestionStore,
    private readonly miscOutputStore: MiscOutputStore,
    private readonly processedFileStore: ProcessedFileStore,
    private readonly fileReferenceStore: FileReferenceStore,
  ) {}

  async generateReport({
    fileReferenceId,
    processedFileId,
  }: ReportHandler.Arguments): Promise<void> {
    const file = await this.fileReferenceStore.get(fileReferenceId);
    const text = await this.processedFileStore.getText(processedFileId);

    const [questions, terms] = await Promise.all([
      this.mlReportService.generateQuestions(text),
      this.mlReportService.generateTerms(text),
    ]);

    if (terms.length > 0) {
      await this.miscOutputStore.insert({
        organizationId: file.organizationId,
        projectId: file.projectId,
        fileReferenceId,
        processedFileId,
        value: {
          type: "terms",
          value: terms,
          order: 0,
        },
      });
    }

    await this.questionStore.insertMany(
      questions.map((question) => ({
        organizationId: file.organizationId,
        projectId: file.projectId,
        fileReferenceId,
        processedFileId,
        question,
        hash: ShaHash.forData(question),
      })),
    );
  }
}
