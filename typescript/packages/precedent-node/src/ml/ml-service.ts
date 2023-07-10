import { ChatHistory } from "@fgpt/precedent-iso";
import {
  FinancialSummary,
  Term,
} from "@fgpt/precedent-iso/src/models/llm-outputs";
import { AxiosInstance } from "axios";
import z from "zod";

interface GetEmbeddingsArgs {
  documents: string[];
}

const ZEmbeddingsResponse = z.object({
  response: z.array(z.array(z.number())),
});

type GetEmbeddingsResponse = z.infer<typeof ZEmbeddingsResponse>;

const ZVectorResult = z.object({
  id: z.string(),
  metadata: z.record(z.any()),
  score: z.number(),
});

export type VectorResult = z.infer<typeof ZVectorResult>;

const ZSimilarResponse = z.object({
  results: ZVectorResult.array(),
});

interface UpsertVector {
  id: string;
  vector: number[];
  metadata: Record<string, any>;
}

interface SimiliarSearch {
  vector: number[];
  metadata: Record<string, string>;
}

export interface AskQuestionStreamingArgs {
  context: string;
  question: string;
  history: ChatHistory[];
  onData: (resp: string) => void;
  onEnd: () => void;
}

export interface GenerateTitleStreamingArgs {
  question: string;
  answer: string;
  onData: (resp: string) => void;
  onEnd: () => void;
}

export interface AskQuestion {
  context: string;
  question: string;
}

export interface LLMOutputArgs {
  text: string;
}

export interface LLMOutputResponse {
  summaries: string[];
  questions: string[];
  financialSummary: FinancialSummary;
  terms: Term[];
}

export interface PlaygroundRequest {
  text: string;
  jsonSchema: Record<string, unknown>;
  prompt: string;
  functionName: string;
}

export interface PlaygroundResponse {
  raw: Record<string, any>;
}

export interface MLServiceClient {
  ping: () => Promise<"pong">;
  getEmbedding: (query: string) => Promise<number[]>;
  getEmbeddings: (args: GetEmbeddingsArgs) => Promise<GetEmbeddingsResponse>;
  upsertVectors: (args: UpsertVector[]) => Promise<void>;
  getKSimilar: (args: SimiliarSearch) => Promise<VectorResult[]>;
  askQuestion(args: AskQuestion): Promise<string>;
  askQuestionStreaming(args: AskQuestionStreamingArgs): Promise<void>;
  getTitleStreaming(args: GenerateTitleStreamingArgs): Promise<void>;
  llmOutput(args: LLMOutputArgs): Promise<LLMOutputResponse>;
  playGround(args: PlaygroundRequest): Promise<PlaygroundResponse>;
  tokenLength(text: string): Promise<{ model: "gpt4"; length: number }>;
}

export class MLServiceClientImpl implements MLServiceClient {
  constructor(private readonly client: AxiosInstance) {}

  async ping(): Promise<"pong"> {
    await this.client.get<unknown>("/ping");
    return "pong";
  }

  async getEmbeddings(args: GetEmbeddingsArgs): Promise<GetEmbeddingsResponse> {
    const response = await this.client.post<unknown>(
      "/embeddings/embedding-for-documents",
      { documents: args.documents },
    );
    const parsed = ZEmbeddingsResponse.parse(response.data);
    return parsed;
  }

  async getEmbedding(query: string): Promise<number[]> {
    const { response } = await this.getEmbeddings({ documents: [query] });
    return response[0]!;
  }

  async upsertVectors(vectors: UpsertVector[]): Promise<void> {
    await this.client.put<unknown>("/vector/upsert-vectors", {
      vectors,
    });
  }

  async getKSimilar({
    vector,
    metadata,
  }: SimiliarSearch): Promise<VectorResult[]> {
    const response = await this.client.post<unknown>(
      "/vector/similar-vectors",
      {
        vector,
        metadata,
      },
    );
    return ZSimilarResponse.parse(response.data).results;
  }

  async askQuestion({ context, question }: AskQuestion): Promise<string> {
    const response = await this.client.post<unknown>("/chat/ask-question", {
      context,
      question,
    });

    const parsed = ZAskQuestionResponse.parse(response.data);
    return parsed.data;
  }

  async askQuestionStreaming({
    context,
    question,
    onData,
    onEnd,
    history,
  }: AskQuestionStreamingArgs): Promise<void> {
    const response = await this.client.post<any>(
      "/chat/ask-question-streaming",
      {
        context,
        question,
        history,
      },
      {
        responseType: "stream",
      },
    );
    const stream = response.data;

    stream.on("data", (data: Buffer) => {
      onData(data.toString());
    });

    stream.on("end", () => {
      onEnd();
    });
  }

  async getTitleStreaming({
    question,
    answer,
    onData,
    onEnd,
  }: GenerateTitleStreamingArgs): Promise<void> {
    const response = await this.client.post<any>(
      "/chat/get-title-streaming",
      {
        question,
        answer,
      },
      {
        responseType: "stream",
      },
    );
    const stream = response.data;

    stream.on("data", (data: Buffer) => {
      onData(data.toString());
    });

    stream.on("end", () => {
      onEnd();
    });
  }

  async llmOutput({ text }: LLMOutputArgs): Promise<LLMOutputResponse> {
    const response = await this.client.post<unknown>("/report/llm-output", {
      text,
    });
    return ZLLMOutputResponse.parse(response.data);
  }

  async playGround(args: PlaygroundRequest): Promise<PlaygroundResponse> {
    const response = await this.client.post<unknown>("/playground", {
      text: args.text,
      prompt: args.prompt,
      json_schema: args.jsonSchema,
      function_name: args.functionName,
    });
    return ZPlaygroundResponse.parse(response.data);
  }

  async tokenLength(text: string): Promise<{ model: "gpt4"; length: number }> {
    const response = await this.client.post<unknown>("/text/token-length", {
      text,
    });
    const resp = TokenLengthResponse.parse(response.data);

    return {
      model: "gpt4",
      length: resp.gpt4,
    };
  }
}

const TokenLengthResponse = z.object({
  gpt4: z.number(),
});

const ZAskQuestionResponse = z.object({
  data: z.string(),
});

const ZPlaygroundResponse = z.object({
  raw: z.record(z.any()),
});

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
      financialSummary: row.financial_summary,
    }),
  );
