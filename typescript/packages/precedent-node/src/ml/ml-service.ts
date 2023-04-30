import axios, { AxiosInstance } from "axios";
import z from "zod";

interface PredictArguments {
  content: string;
}

const ZPredictionResponse = z.object({
  resp: z.string(),
});

type PredictResponse = z.infer<typeof ZPredictionResponse>;

export interface MLService {
  predict: (args: PredictArguments) => Promise<PredictResponse>;
  ping: () => Promise<"pong">;
}

export class MLServiceImpl implements MLService {
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

  async predict(args: PredictArguments): Promise<PredictResponse> {
    const response = await this.#client.post<PredictResponse>(
      "/predict-for-ticker",
      args
    );

    const parsed = ZPredictionResponse.parse(response.data);

    return parsed;
  }
}
