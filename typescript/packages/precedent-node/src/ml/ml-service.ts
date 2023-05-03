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

interface SummarizeArgs {
  text: string;
}

interface SummarizeResponse {
  response: string;
}

export interface MLServiceClient {
  predict: (args: PredictArguments) => Promise<PredictResponse>;
  ping: () => Promise<"pong">;
  getEmbeddings: (args: GetEmbeddingsArgs) => Promise<GetEmbeddingsResponse>;
  summarize: (args: SummarizeArgs) => Promise<SummarizeResponse>;
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

  async summarize({ text }: SummarizeArgs): Promise<SummarizeResponse> {
    const response = await this.#client.post<PredictResponse>("/summarize", {
      text,
    });
    const parsed = ZSummaryResponse.parse(response.data);
    return parsed;
  }
}
