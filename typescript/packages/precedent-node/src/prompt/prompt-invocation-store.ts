import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export type Model = "claude-100";

export interface InsertPromptInvocation {
  model: Model;
  organizationId: string;
  promptId: string | undefined;
  inputTokens: number;
  outputTokens: number;
}

export interface PromptInvocationStore {
  insert(invocations: InsertPromptInvocation): Promise<string>;
}

const FIELDS = sql.fragment`id`;
export class PsqlPromptInvocationStore implements PromptInvocationStore {
  constructor(private readonly pool: DatabasePool) {}
  async insert(arg: InsertPromptInvocation): Promise<string> {
    const [res] = await this.#insertMany([arg]);
    if (!res) {
      throw new Error("invalid state");
    }
    return res;
  }
  async #insertMany(args: InsertPromptInvocation[]): Promise<string[]> {
    const values = args.map(
      ({ model, organizationId, promptId, inputTokens, outputTokens }) =>
        sql.fragment`
(${model},
    ${organizationId},
    ${promptId ?? null},
    ${inputTokens},
    ${outputTokens})
`,
    );

    const res = await this.pool.any(sql.type(ZRow)`
INSERT INTO prompt_invocation (model, organization_id, prompt_id, input_tokens, output_tokens)
    VALUES
        ${sql.join(values, sql.fragment`, `)}
    RETURNING
        ${FIELDS}
`);
    return res.map((row) => row.id);
  }
}

const ZRow = z.object({
  id: z.string(),
});
