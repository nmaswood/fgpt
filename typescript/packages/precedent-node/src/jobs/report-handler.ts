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
    const { organizationId, projectId } =
      await this.fileReferenceStore.get(fileReferenceId);
    const text = await this.processedFileStore.getText(processedFileId);

    const [questionPages, termPages] = await Promise.all([
      this.mlReportService.generateQuestions(text),
      this.mlReportService.generateTerms(text),
    ]);

    const questions = questionPages.flatMap((page) => page.value);

    const terms = termPages;

    if (terms.length > 0) {
      await this.miscOutputStore.insertMany(
        termPages.map(({ value, order }) => ({
          organizationId,
          projectId,
          fileReferenceId,
          processedFileId,
          value: {
            type: "terms",
            value,
            order,
          },
        })),
      );
    }

    await this.questionStore.insertMany(
      questions.map((question) => ({
        organizationId,
        projectId,
        fileReferenceId,
        processedFileId,
        question,
        hash: ShaHash.forData(question),
      })),
    );
  }
}
