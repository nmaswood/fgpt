import { assertNever, Outputs } from "@fgpt/precedent-iso";

import { MiscOutputStore } from "./misc-output-store";
import { QuestionStore } from "./question-store";

export interface ReportService {
  forFileReferenceId(fileReferenceId: string): Promise<Outputs.Report>;
}

export class ReportServiceImpl implements ReportService {
  constructor(
    private readonly questionStore: QuestionStore,
    private readonly miscValueStore: MiscOutputStore,
  ) {}

  async forFileReferenceId(fileReferenceId: string): Promise<Outputs.Report> {
    const [questions, miscValues] = await Promise.all([
      this.questionStore.getForFile(fileReferenceId),
      this.miscValueStore.getForFile(fileReferenceId),
    ]);

    return {
      questions,
      ...this.#processMiscValues(miscValues),
    };
  }

  #processMiscValues(
    values: Outputs.MiscValue[],
  ): Omit<Outputs.Report, "questions"> {
    const acc: Omit<Outputs.Report, "questions"> = {
      summaries: [],
      financialSummary: {
        investmentRisks: [],
        investmentMerits: [],
        financialSummaries: [],
      },
      terms: [],
      longForm: [],
    };

    const alreadySeenTerms = new Set<string>();

    for (const value of values) {
      switch (value.type) {
        case "financial_summary":
          acc.financialSummary.financialSummaries.push(
            ...value.value.financialSummaries,
          );
          acc.financialSummary.investmentRisks.push(
            ...value.value.investmentRisks,
          );
          acc.financialSummary.investmentMerits.push(
            ...value.value.investmentMerits,
          );
          break;
        case "terms": {
          const uniqueTerms = value.value.filter(
            (term) => !alreadySeenTerms.has(term.termName),
          );
          acc.terms.push(...uniqueTerms);
          for (const term of uniqueTerms) {
            alreadySeenTerms.add(term.termName);
          }
          break;
        }
        case "summary":
          acc.summaries.push(...value.value);
          break;
        case "long_form":
          acc.longForm.push(value.value);
          break;
        default:
          assertNever(value);
      }
    }

    return acc;
  }
}
