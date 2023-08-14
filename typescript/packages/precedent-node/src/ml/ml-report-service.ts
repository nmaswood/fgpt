import { Term } from "@fgpt/precedent-iso/src/models/llm-outputs";
import { AxiosInstance } from "axios";
import { z } from "zod";

export interface LongFormArgs {
  text: string;
}

export interface LongFormResponse {
  raw: string;
  html: string | undefined;
}

export interface MLReportService {
  generateQuestions(text: string): Promise<string[]>;
  generateQuestionsClaude(text: string): Promise<string[]>;
  generateTerms(text: string): Promise<Term[]>;
  generateTermsClaude(text: string): Promise<Term[]>;
}
export class MLReportServiceImpl implements MLReportService {
  constructor(private readonly client: AxiosInstance) {}

  async generateQuestions(text: string): Promise<string[]> {
    return this.#generateQuestions("/report/generate-questions", text);
  }

  async generateQuestionsClaude(text: string): Promise<string[]> {
    return this.#generateQuestions("/report/generate-questions-claude", text);
  }

  async #generateQuestions(url: string, text: string): Promise<string[]> {
    const response = await this.client.post<unknown>(url, {
      text,
    });
    return ZQuestionsResponse.parse(response.data).questions;
  }

  async generateTerms(text: string): Promise<Term[]> {
    return this.#generateTerms("/report/generate-terms", text);
  }

  async generateTermsClaude(text: string): Promise<Term[]> {
    return this.#generateTerms("/report/generate-terms-claude", text);
  }

  async #generateTerms(url: string, text: string): Promise<Term[]> {
    const response = await this.client.post<unknown>(url, {
      text,
    });
    return ZTermsResponse.parse(response.data).terms;
  }
}

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
