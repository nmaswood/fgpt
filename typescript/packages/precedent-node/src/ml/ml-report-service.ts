import { Term } from "@fgpt/precedent-iso/src/models/llm-outputs";
import { AxiosInstance } from "axios";
import { z } from "zod";

export interface LongFormArgs {
  text: string;
}

export interface LongFormResponse {
  raw: string;
  sanitizedHtml: string | undefined;
}

export interface MLReportService {
  generateQuestions(text: string): Promise<string[]>;
  generateTerms(text: string): Promise<Term[]>;
  longForm(args: LongFormArgs): Promise<LongFormResponse>;
}
export class MLReportServiceImpl implements MLReportService {
  constructor(private readonly client: AxiosInstance) {}

  async generateQuestions(text: string): Promise<string[]> {
    const response = await this.client.post<unknown>(
      "/report/generate-questions",
      {
        text,
      },
    );
    return ZQuestionsResponse.parse(response.data).questions;
  }

  async generateTerms(text: string): Promise<Term[]> {
    const response = await this.client.post<unknown>("/report/generate-terms", {
      text,
    });
    return ZTermsResponse.parse(response.data).terms;
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

const ZQuestionsResponse = z.object({
  questions: z.array(z.string()),
});

const ZTermsResponse = z.object({
  terms: z.array(ZTerm),
});
