import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export type Model = "claude-2";

export interface InsertPromptInvocation {
  model: Model;
  organizationId: string;
  promptId: string;
  inputTokens: number;
  outputTokens: number;
}

export interface PromptInvocationStore {
  insert(invocations: InsertPromptInvocation): Promise<string>;
}

const FIELDS = sql.fragment`id`;
export class PsqlPromptInvocationStore implements PromptInvocationStore {
  constructor(private readonly pool: DatabasePool) {}
  async insert({
    model,
    organizationId,
    promptId,
    inputTokens,
    outputTokens,
  }: InsertPromptInvocation): Promise<string> {
    return this.pool.oneFirst(sql.type(ZRow)`
INSERT INTO prompt_invocation (model, organization_id, prompt_id, input_tokens, output_tokens)
    VALUES (${model}, ${organizationId}, ${promptId}, ${inputTokens}, ${outputTokens})
RETURNING
    ${FIELDS}
`);
  }
}

const ZRow = z.object({
  id: z.string(),
});
