import { AxiosInstance } from "axios";
import { z } from "zod";

export interface RunResponse {
  prompt: string;
  inputTokens: number;
  outputTokens: number;
  raw: string;
  html: string | undefined;
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

const ZRunResponse = z
  .object({
    prompt: z.string(),
    input_tokens: z.number().min(0),
    output_tokens: z.number().min(0),
    raw: z.string(),
    html: z.string().nullable(),
  })
  .transform((row) => ({
    prompt: row.prompt,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    raw: row.raw,
    html: row.html ?? undefined,
  }));

export class DummyPromptRunner implements PromptRunner {
  async run(_: string, __: Record<string, string>): Promise<RunResponse> {
    return {
      prompt: "hi",
      inputTokens: 1,
      outputTokens: 1,
      raw: "bye",
      html: "<p>bye</p>",
    };
  }
}

export const DUMMY_PROMPT_RUNNER = new DummyPromptRunner();
