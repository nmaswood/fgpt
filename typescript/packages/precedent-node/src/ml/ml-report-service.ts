import {
  FinancialSummary,
  Term,
} from "@fgpt/precedent-iso/src/models/llm-outputs";
import { AxiosInstance } from "axios";
import { z } from "zod";

export interface LLMOutputArgs {
  text: string;
}

export interface LongFormArgs {
  text: string;
}

export interface LLMOutputResponse {
  summaries: string[];
  questions: string[];
  financialSummary: FinancialSummary;
  terms: Term[];
}

export interface LongFormResponse {
  raw: string;
  sanitizedHtml: string | undefined;
}

export interface MLReportService {
  llmOutput(args: LLMOutputArgs): Promise<LLMOutputResponse>;
  longForm(args: LongFormArgs): Promise<LongFormResponse>;
}
export class MLReportServiceImpl implements MLReportService {
  constructor(private readonly client: AxiosInstance) {}
  async llmOutput({ text }: LLMOutputArgs): Promise<LLMOutputResponse> {
    const response = await this.client.post<unknown>("/report/llm-output", {
      text,
    });
    return ZLLMOutputResponse.parse(response.data);
  }

  async longForm({ text }: LongFormArgs): Promise<LongFormResponse> {
    const response = await this.client.post<unknown>("/report/long-form", {
      text,
    });
    return ZLongFormReportResponse.parse(response.data);
  }
}

const ZLongFormReportResponse = z
  .object({
    raw: z.string(),
    sanitized_html: z.string().nullable(),
  })
  .transform((v) => ({
    raw: v.raw,
    sanitizedHtml: v.sanitized_html ?? undefined,
  }));

const ZTerm = z
  .object({
    term_value: z.string(),
    term_name: z.string(),
  })
  .transform(
    (row): Term => ({
      termValue: row.term_value,
      termName: row.term_name,
    }),
  );

const ZFinancialSummary = z
  .object({
    investment_merits: z.string().array(),
    investment_risks: z.string().array(),
    financial_summaries: z.string().array(),
  })
  .transform(
    (row): FinancialSummary => ({
      investmentMerits: row.investment_merits,
      investmentRisks: row.investment_risks,
      financialSummaries: row.financial_summaries,
    }),
  );

const ZLLMOutputResponse = z
  .object({
    summaries: z.array(z.string()),
    questions: z.array(z.string()),
    financial_summary: ZFinancialSummary,
    terms: z.array(ZTerm),
  })
  .transform(
    (row): LLMOutputResponse => ({
      summaries: row.summaries,
      questions: row.questions,
      terms: row.terms,
      financialSummary: {
        investmentRisks: [],
        investmentMerits: [],
        financialSummaries: [],
      },
    }),
  );
