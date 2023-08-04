import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface PromptDefinition {
  template: string;
}

export interface Prompt {
  id: string;
  slug: string;
  definition: PromptDefinition;
}

interface UpsertPrompt {
  slug: string;
  definition: PromptDefinition;
}
export interface PromptStore {
  upsert(args: UpsertPrompt): Promise<Prompt>;
  get(slug: string): Promise<Prompt>;
}

const FIELDS = sql.fragment`id, slug, definition`;
export class PsqlPromptStore implements PromptStore {
  constructor(private readonly pool: DatabasePool) {}
  upsert(args: UpsertPrompt): Promise<Prompt> {
    return this.pool.one(sql.type(ZPromptRow)`
INSERT INTO prompt (slug, definition)
    VALUES (${args.slug}, ${JSON.stringify(args.definition)})
ON CONFLICT (slug)
    DO UPDATE SET
        definition = EXCLUDED.definition
    RETURNING
        ${FIELDS}
`);
  }
  get(slug: string): Promise<Prompt> {
    return this.pool.one(sql.type(ZPromptRow)`
SELECT
    ${FIELDS}
FROM
    prompt
WHERE
    slug = ${slug}
`);
  }
}

const ZDefinition = z.object({
  template: z.string(),
});

const ZPromptRow = z.object({
  id: z.string(),
  slug: z.string(),
  definition: ZDefinition,
});
