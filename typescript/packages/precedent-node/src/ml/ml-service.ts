import axios, { AxiosInstance } from "axios";
import z from "zod";
import { ChatHistory } from "@fgpt/precedent-iso";

interface PredictArguments {
  content: string;
}

const ZPredictionResponse = z.object({
  response: z.string(),
});

type PredictResponse = z.infer<typeof ZPredictionResponse>;

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

export interface AskQuestion {
  context: string;
  question: string;
}

export interface MLServiceClient {
  predict: (args: PredictArguments) => Promise<PredictResponse>;
  ping: () => Promise<"pong">;
  getEmbedding: (query: string) => Promise<number[]>;
  getEmbeddings: (args: GetEmbeddingsArgs) => Promise<GetEmbeddingsResponse>;
  upsertVectors: (args: UpsertVector[]) => Promise<void>;
  getKSimilar: (args: SimiliarSearch) => Promise<VectorResult[]>;
  askQuestion(args: AskQuestion): Promise<string>;
  askQuestionStreaming(args: AskQuestionStreamingArgs): Promise<void>;
}

export class MLServiceClientImpl implements MLServiceClient {
  #client: AxiosInstance;

  constructor(baseURL: string) {
    this.#client = axios.create({
      baseURL,
    });
  }

  async ping(): Promise<"pong"> {
    await this.#client.get<PredictResponse>("/ping");
    return "pong";
  }

  async predict({ content }: PredictArguments): Promise<PredictResponse> {
    const response = await this.#client.post<PredictResponse>(
      "/predict-for-ticker",
      { content: content.slice(4012) }
    );
    return ZPredictionResponse.parse(response.data);
  }

  async getEmbeddings(args: GetEmbeddingsArgs): Promise<GetEmbeddingsResponse> {
    const response = await this.#client.post<PredictResponse>(
      "/embedding-for-documents",
      { documents: args.documents }
    );
    const parsed = ZEmbeddingsResponse.parse(response.data);
    return parsed;
  }

  async getEmbedding(query: string): Promise<number[]> {
    const { response } = await this.getEmbeddings({ documents: [query] });
    return response[0]!;
  }

  async upsertVectors(vectors: UpsertVector[]): Promise<void> {
    await this.#client.put<PredictResponse>("/upsert-vectors", {
      vectors,
    });
  }

  async getKSimilar({
    vector,
    metadata,
  }: SimiliarSearch): Promise<VectorResult[]> {
    const response = await this.#client.post<PredictResponse>(
      "/similar-vectors",
      {
        vector,
        metadata,
      }
    );
    return ZSimilarResponse.parse(response.data).results;
  }

  async askQuestion({ context, question }: AskQuestion): Promise<string> {
    const response = await this.#client.post<unknown>("/ask-question", {
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
    const response = await this.#client.post<any>(
      "/ask-question-streaming",
      {
        context,
        question,
        history,
      },
      {
        responseType: "stream",
      }
    );
    const stream = response.data;

    stream.on("data", (data: Buffer) => {
      onData(data.toString());
    });

    stream.on("end", () => {
      onEnd();
    });
  }
}

const ZAskQuestionResponse = z.object({
  data: z.string(),
});
