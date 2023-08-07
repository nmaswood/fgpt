import { PromptInvocationStore } from "./prompt-invocation-store";
import { PromptRunner, RunResponse } from "./prompt-runner";
import { PromptStore } from "./prompt-store";

export interface RunArgs {
  organizationId: string;
  promptId: string;
  args: Record<string, string>;
}
export interface PromptService {
  run(args: RunArgs): Promise<RunResponse>;
}

export class PromptServiceImpl implements PromptService {
  constructor(
    private readonly runner: PromptRunner,
    private readonly promptStore: PromptStore,
    private readonly promptInvocationStore: PromptInvocationStore,
  ) {}

  async run({ organizationId, promptId, args }: RunArgs): Promise<RunResponse> {
    const prompt = await this.promptStore.get(promptId);
    const result = await this.runner.run(prompt.definition.template, args);
    await this.promptInvocationStore.insert({
      model: "claude-2",
      organizationId,
      promptId,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    });
    return result;
  }
}
