import axios, { AxiosInstance } from "axios";
import z from "zod";

interface PredictArguments {
  prompt: string;
}

const ZPredictionResponse = z.object({
  answer: z.string(),
});

type PredictResponse = z.infer<typeof ZPredictionResponse>;

export interface MLService {
  predict: (args: PredictArguments) => Promise<PredictResponse>;
}

export class MLServiceImpl implements MLService {
  #client: AxiosInstance;

  constructor(baseURL: string) {
    this.#client = axios.create({
      baseURL,
    });
  }

  async predict(args: PredictArguments): Promise<PredictResponse> {
    const response = await this.#client.post<PredictResponse>("/predict", args);

    const parsed = ZPredictionResponse.parse(response.data);

    return parsed;
  }
}
