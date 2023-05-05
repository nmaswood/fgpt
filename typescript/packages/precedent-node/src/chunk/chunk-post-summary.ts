import { ZSelectId } from "@fgpt/precedent-iso";
import { DatabasePool, sql } from "slonik";
import { z } from "zod";

export interface ChunkPostSummary {
  id: string;
  summaryId: string;
  content: string;
  embedding: number[];
}

const ZChunkPostSummaryRow = z.object({
  id: z.string(),
  summary_id: z.string(),
  content: z.string(),
});

export interface LoadedChunkPostSummary {
  ticker: string;
  hrefId: string;
  transcriptContentId: string;
  chunkId: string;
  postSummaryChunkId: string;
  summaryId: string;
  embedding: number[];
}
export interface ChunkPostSummaryStore {
  insertMany(chunks: Omit<ChunkPostSummary, "id">[]): Promise<string[]>;
  getLoaded(): AsyncIterable<LoadedChunkPostSummary>;
  getMany(ids: string[]): Promise<Omit<ChunkPostSummary, "embedding">[]>;
}

const ZLoadedRow = z.object({
  ticker: z.string(),
  href_id: z.string(),
  transcript_content_id: z.string(),
  chunk_id: z.string(),
  summary_id: z.string(),
  post_summary_chunk_id: z.string(),
  embedding: z.string(),
});

export class PsqlChunkPostSummaryStore implements ChunkPostSummaryStore {
  constructor(private readonly pool: DatabasePool) {}
  async insertMany(chunks: Omit<ChunkPostSummary, "id">[]): Promise<string[]> {
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

  async *getLoaded(): AsyncIterable<LoadedChunkPostSummary> {
    let lastId: string | undefined = undefined;

    while (true) {
      const rows = await this.pool.connect(async (cnx) => {
        const response = await cnx.query(
          sql.type(ZLoadedRow)`
SELECT
    TH.ticker,
    TC.href_id as href_id,
    TC.id as transcript_content_id,
    RC.id as chunk_id,
    S.id as summary_id,
    CPS.id as post_summary_chunk_id,
    CPS.embedding ->> 'embedding' as embedding
FROM
    transcript_href TH
    JOIN transcript_content TC on TH.id = tc.href_id
    JOIN raw_chunk RC ON RC.transcript_content_id = TC.id
    JOIN summary S ON S.raw_chunk_id = RC.id
    JOIN chunk_post_summary CPS ON CPS.summary_id = S.id ${
      lastId === undefined
        ? sql.fragment`WHERE TRUE`
        : sql.fragment` WHERE CPS.id > ${lastId}`
    }
ORDER BY
    CPS.id ASC;

`
        );

        return response.rows.map((row) => ({
          ticker: row.ticker,
          hrefId: row.href_id,
          transcriptContentId: row.transcript_content_id,
          chunkId: row.chunk_id,
          postSummaryChunkId: row.post_summary_chunk_id,
          summaryId: row.summary_id,
          embedding: JSON.parse(row.embedding),
        }));
      });
      if (rows.length === 0) {
        return;
      }

      yield* rows;
      const lastIdFromRows = rows.at(-1)?.postSummaryChunkId;
      if (lastIdFromRows === undefined) {
        throw new Error("illegal state");
      }
      lastId = lastIdFromRows;
    }
  }

  async getMany(ids: string[]): Promise<Omit<ChunkPostSummary, "embedding">[]> {
    return this.pool.connect(async (cnx) => {
      const response = await cnx.query(sql.type(ZChunkPostSummaryRow)`
SELECT
    id,
    summary_id,
    content
FROM
    chunk_post_summary
WHERE
    id IN (${sql.join(ids, sql.fragment`, `)})
`);

      return response.rows.map((row) => ({
        id: row.id,
        summaryId: row.summary_id,
        content: row.content,
      }));
    });
  }
}
