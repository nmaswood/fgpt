import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface Summary {
  id: string;
  rawChunkId: string;
  content: string;
  numTokens: number;
  diff: number;
}

export interface SummaryStore {
  insert(summary: Omit<Summary, "id">): Promise<Summary>;
}

export class PsqlSummaryStore implements SummaryStore {
  constructor(private readonly pool: DatabasePool) {}
  insert({
    rawChunkId,
    content,
    numTokens,
    diff,
  }: Omit<Summary, "id">): Promise<Summary> {
    return this.pool.connect(async (cnx) => {
      const row = await cnx.one(
        sql.type(
          z.object({
            id: z.string(),
            raw_chunk_id: z.string(),
            content: z.string(),
            num_tokens: z.number(),
            diff: z.number(),
          })
        )`

INSERT INTO summary (raw_chunk_id, content, num_tokens, diff)
    VALUES (${rawChunkId}, ${content}, ${numTokens}, ${diff})
RETURNING
    id, raw_chunk_id, content, num_tokens, diff;

`
      );

      return {
        id: row.id,
        rawChunkId: row.raw_chunk_id,
        content: row.content,
        numTokens: row.num_tokens,
        diff: row.diff,
      };
    });
  }
}
