import { ZSelectId } from "@fgpt/precedent-iso";
import { DatabasePool, sql } from "slonik";

export interface ChunkPostSummary {
  summaryId: string;
  content: string;
  embedding: number[];
}

export interface ChunkPostSummaryStore {
  insert(chunk: ChunkPostSummary): Promise<string>;
}

export class PsqlChunkPostSummaryStore implements ChunkPostSummaryStore {
  constructor(private readonly pool: DatabasePool) {}
  async insert({
    summaryId,
    content,
    embedding,
  }: ChunkPostSummary): Promise<string> {
    return this.pool.connect(async (cnx) => {
      const row = await cnx.one(
        sql.type(ZSelectId)`

INSERT INTO chunk_post_summary (summary_id, content, embedding)
    VALUES (${summaryId}, ${content}, ${JSON.stringify({
          embedding,
        })})
RETURNING
    id;

`
      );

      return row.id;
    });
  }
}
