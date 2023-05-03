import { ZSelectId } from "@fgpt/precedent-iso";
import { DatabasePool, sql } from "slonik";

export interface Summary {
  rawChunkId: string;
  content: string;
  numTokens: number;
  diff: number;
}

export interface SummaryStore {
  insert(summary: Summary): Promise<string>;
}

export class PsqlSummaryStore implements SummaryStore {
  constructor(private readonly pool: DatabasePool) {}
  insert({ rawChunkId, content, numTokens, diff }: Summary): Promise<string> {
    return this.pool.connect(async (cnx) => {
      const row = await cnx.one(
        sql.type(ZSelectId)`

INSERT INTO summary (raw_chunk_id, content, num_tokens, diff)
    VALUES (${rawChunkId}, ${content}, ${numTokens}, ${diff})
RETURNING
    id;

`
      );

      return row.id;
    });
  }
}
