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
  generateQuestions(text: string): Promise<Page<string[]>[]>;
  generateTerms(text: string): Promise<Page<Term[]>[]>;
}
export class MLReportServiceImpl implements MLReportService {
  constructor(private readonly client: AxiosInstance) {}

  async generateQuestions(text: string): Promise<Page<string[]>[]> {
    const response = await this.client.post<unknown>(
      "/report/generate-questions",
      {
        text,
      },
    );
    return ZQuestionsResponse.parse(response.data);
  }

  async generateTerms(text: string): Promise<Page<Term[]>[]> {
    const response = await this.client.post<unknown>("/report/generate-terms", {
      text,
    });
    return ZTermsResponse.parse(response.data);
  }
}

export interface Page<T> {
  order: number;
  value: T;
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

const ZQuestionsResponse = z
  .object({
    questions: z.array(
      z.object({
        order: z.number(),
        value: z.string().array(),
      }),
    ),
  })
  .transform((row): Page<string[]>[] => row.questions);

const ZTermsResponse = z
  .object({
    terms: z.array(
      z.object({
        order: z.number(),
        value: ZTerm.array(),
      }),
    ),
  })
  .transform((row): Page<Term[]>[] => row.terms);
