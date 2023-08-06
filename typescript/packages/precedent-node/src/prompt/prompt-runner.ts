import { AxiosInstance } from "axios";
import { z } from "zod";

export interface RunResponse {
  prompt: string;
  inputTokens: number;
  outputTokens: number;
  output: {
    raw: string;
    html: string | undefined;
  };
}

export interface PromptRunner {
  run(template: string, args: Record<string, string>): Promise<RunResponse>;
}
export class HTTPPromptRunner implements PromptRunner {
  constructor(private readonly client: AxiosInstance) {}
  async run(
    template: string,
    args: Record<string, string>,
  ): Promise<RunResponse> {
    const response = await this.client.post<unknown>("/prompt/run", {
      template,
      args,
    });

    return ZRunResponse.parse(response.data);
  }
}

const ZOutput = z
  .object({
    raw: z.string(),
    html: z.string().nullable(),
  })
  .transform((row) => ({
    raw: row.raw,
    html: row.html ?? undefined,
  }));

const ZRunResponse = z.object({
  prompt: z.string(),
  inputTokens: z.number().min(0),
  outputTokens: z.number().min(0),
  output: ZOutput,
});

export class DummyPromptRunner implements PromptRunner {
  async run(_: string, __: Record<string, string>): Promise<RunResponse> {
    return {
      prompt: "hi",
      inputTokens: 1,
      outputTokens: 1,
      output: {
        raw: "bye",
        html: undefined,
      },
    };
  }
}
