import { ZSelectId } from "@fgpt/precedent-iso";
import { DatabasePool, sql } from "slonik";

export interface ChunkPostSummary {
  summaryId: string;
  content: string;
  embedding: number[];
}

export interface ChunkPostSummaryStore {
  insertMany(chunks: ChunkPostSummary[]): Promise<string[]>;
}

export class PsqlChunkPostSummaryStore implements ChunkPostSummaryStore {
  constructor(private readonly pool: DatabasePool) {}
  async insertMany(chunks: ChunkPostSummary[]): Promise<string[]> {
    return this.pool.connect(async (cnx) => {
      const rawChunkValues = chunks.map(
        ({ summaryId, content, embedding }) =>
          sql.fragment`(${summaryId}, ${content}, ${JSON.stringify({
            embedding,
          })})`
      );

      const resp = await cnx.query(
        sql.type(ZSelectId)`
INSERT INTO chunk_post_summary (summary_id, content, embedding)
    VALUES 
        ${sql.join(rawChunkValues, sql.fragment`, `)}
    
RETURNING
    id;

`
      );

      return resp.rows.map((row) => row.id);
    });
  }
}
