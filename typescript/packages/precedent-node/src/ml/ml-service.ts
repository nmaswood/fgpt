import axios, { AxiosInstance } from "axios";
import z from "zod";

interface PredictArguments {
  content: string;
}

const ZPredictionResponse = z.object({
  resp: z.string(),
});

type PredictResponse = z.infer<typeof ZPredictionResponse>;

interface GetEmbeddingsArgs {
  documents: string[];
}

interface GetEmbeddingsResponse {
  embeddings: number[][];
}

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

export class MLServiceImpl implements MLServiceClient {
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

  async getEmbeddings(_: GetEmbeddingsArgs): Promise<GetEmbeddingsResponse> {
    //
    throw new Error("not implemented");
  }

  async summarize(_: SummarizeArgs): Promise<SummarizeResponse> {
    throw new Error("not implemented");
  }
}
