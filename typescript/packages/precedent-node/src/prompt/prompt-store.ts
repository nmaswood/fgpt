import {
  Prompt,
  PromptDefinition,
  PromptSlug,
  ZPromptSlug,
} from "@fgpt/precedent-iso";
import { DatabasePool, sql } from "slonik";
import { z } from "zod";

interface UpsertPrompt {
  slug: string;
  definition: PromptDefinition;
}
export interface PromptStore {
  upsert(args: UpsertPrompt): Promise<Prompt>;
  getBySlug(slug: PromptSlug): Promise<Prompt>;
  list(): Promise<Prompt[]>;
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
  getBySlug(slug: string): Promise<Prompt> {
    return this.pool.one(sql.type(ZPromptRow)`
SELECT
    ${FIELDS}
FROM
    prompt
WHERE
    slug = ${slug}
`);
  }

  async list(): Promise<Prompt[]> {
    const rows = await this.pool.any(sql.type(ZPromptRow)`
SELECT
    ${FIELDS}
FROM
    prompt
`);
    return Array.from(rows);
  }
}

const ZDefinition = z.object({
  template: z.string(),
});

const ZPromptRow = z.object({
  id: z.string(),
  slug: ZPromptSlug,
  definition: ZDefinition,
});
