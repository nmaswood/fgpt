import axios, { AxiosInstance } from "axios";
import z from "zod";

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

const ZSummaryResponse = z.object({
  response: z.string(),
});

type ZSummaryResponse = z.infer<typeof ZEmbeddingsResponse>;

const ZSimilarResponse = z.object({
  ids: z.string().array(),
});

interface SummarizeArgs {
  text: string;
}

interface SummarizeResponse {
  response: string;
}

interface UpsertVector {
  id: string;
  vector: number[];
  metadata: Record<string, any>;
}

interface SimiliarSearch {
  vector: number[];
  metadata: Record<string, string>;
}

export interface MLServiceClient {
  predict: (args: PredictArguments) => Promise<PredictResponse>;
  ping: () => Promise<"pong">;
  getEmbedding: (query: string) => Promise<number[]>;
  getEmbeddings: (args: GetEmbeddingsArgs) => Promise<GetEmbeddingsResponse>;
  summarize: (args: SummarizeArgs) => Promise<SummarizeResponse>;
  upsertVectors: (args: UpsertVector[]) => Promise<void>;
  getKSimilar: (args: SimiliarSearch) => Promise<string[]>;
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

  async summarize({ text }: SummarizeArgs): Promise<SummarizeResponse> {
    const response = await this.#client.post<PredictResponse>("/summarize", {
      text,
    });
    const parsed = ZSummaryResponse.parse(response.data);
    return parsed;
  }

  async upsertVectors(vectors: UpsertVector[]): Promise<void> {
    await this.#client.put<PredictResponse>("/upsert-vectors", {
      vectors,
    });
  }

  async getKSimilar({ vector, metadata }: SimiliarSearch): Promise<string[]> {
    const response = await this.#client.post<PredictResponse>(
      "/similar-vectors",
      {
        vector,
        metadata,
      }
    );
    return ZSimilarResponse.parse(response.data).ids;
  }
}
