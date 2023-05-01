import { MLServiceClient } from "./ml-service";

interface SummarizeArgs {
  chunks: string[];
}

interface SummarizeResponse {
  response: string;
}

export interface MLActions {
  summarize: (args: SummarizeArgs) => Promise<SummarizeResponse>;
}

export class MLActionsImpl implements MLActions {
  constructor(private readonly client: MLServiceClient) {}

  async summarize({ chunks }: SummarizeArgs): Promise<SummarizeResponse> {
    const summaries: string[] = [];

    for (const text of chunks) {
      const summary = await this.client.summarize({ text });
      summaries.push(summary.response);
    }
    return { response: summaries.join(" ") };
  }
}
